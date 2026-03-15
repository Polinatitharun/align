import os
import re
import faiss
import numpy as np
import requests
import urllib3
from math import radians, cos, sin, asin, sqrt
from langchain_ollama import ChatOllama, OllamaEmbeddings
from django.db import transaction

from .models import Job, ProfileRecord, Match

# ---- 1. Global Configurations ----
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
os.environ['NO_PROXY'] = 'localhost,127.0.0.1,172.20.203.198'

PROXIES = {
   'http': 'http://172.17.0.11:8080',
   'https': 'http://172.17.0.11:8080',
}
HEADERS = {'User-Agent': 'TCS_GenAI_Internal_Tool/1.0'}

OLLAMA_URL = "http://localhost:11434/"
MODEL_NAME = "llama3:latest"
CITY_CACHE = {}

# ---- 2. Initialize Models ----
try:
    print(f"🌐 Connecting to Ollama at {OLLAMA_URL}...")
    requests.get(f"{OLLAMA_URL}/api/tags", proxies={}, timeout=2)
    embed_model = OllamaEmbeddings(base_url=OLLAMA_URL, model=MODEL_NAME)
    llm = ChatOllama(base_url=OLLAMA_URL, model=MODEL_NAME, temperature=0.1)
except Exception as e:
    print(f"⚠️ Model Init Error: {e}")
    llm = embed_model = None

# ---- 3. Helper Functions ----

def clean(txt: str) -> str:
    return re.sub(r"<think>.*?</think>", "", txt or "", flags=re.S).strip()

def get_coordinates(city_name):
    if not city_name: return None
    key = city_name.lower().strip()
    if key in CITY_CACHE: return CITY_CACHE[key]

    fallback = {
        "chennai": (13.08, 80.27), "bangalore": (12.97, 77.59), "bengaluru": (12.97, 77.59),
        "mumbai": (19.07, 72.87), "delhi": (28.70, 77.10), "hyderabad": (17.38, 78.48),
        "pune": (18.52, 73.85), "kolkata": (22.57, 88.36), "coimbatore": (11.01, 76.95),
        "kochi": (9.93, 76.26), "trivandrum": (8.52, 76.93), "vizag": (17.69, 83.22)
    }
    if key in fallback:
        CITY_CACHE[key] = fallback[key]
        return fallback[key]

    url = "https://nominatim.openstreetmap.org/search"
    try:
        resp = requests.get(url, params={'q': city_name, 'format': 'json', 'limit': 1},
                            headers=HEADERS, proxies=PROXIES, verify=False, timeout=2)
        if resp.status_code == 200 and resp.json():
            lat, lon = float(resp.json()[0]['lat']), float(resp.json()[0]['lon'])
            CITY_CACHE[key] = (lat, lon)
            return (lat, lon)
    except:
        pass
    return None

def geo_distance(loc1_name, loc2_name):
    coords1 = get_coordinates(loc1_name)
    coords2 = get_coordinates(loc2_name)
    if not coords1 or not coords2: return 9999
    lat1, lon1 = map(radians, coords1)
    lat2, lon2 = map(radians, coords2)
    a = sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2) * sin((lon2-lon1)/2)**2
    return round(6371 * 2 * asin(sqrt(a)), 1)

def skill_matches(jd_skill, trainee_skill):
    """Whole‑word match to avoid false positives (Java ≠ JavaScript)."""
    jd_clean = jd_skill.lower().strip()
    t_clean = trainee_skill.lower().strip()
    return (jd_clean == t_clean) or bool(re.search(rf'\b{re.escape(jd_clean)}\b', t_clean))

# ---- 4. Core Scoring Function ----

def compute_scores(t_dict, jd_dict, dist):
    """
    Returns:
        skills_pct (float): 0–100, percentage of required tech skills matched.
        location_pct (float): 0–100, based on distance to nearest job location.
        total_pct (float): average of skills_pct and location_pct.
        bucket (str): one of the bucket choices.
        matched_skills (list): names of matched skills.
    """
    # ----- Skill match (only strengths) -----
    trainee_skills = [s.get("courseName", "").lower().strip() for s in t_dict.get("strengths", [])]
    jd_skills = jd_dict.get("techSkills", [])
    total_jd_skills = len(jd_skills)

    matched_set = set()
    for req in jd_skills:
        req_clean = req.lower().strip()
        if any(skill_matches(req_clean, ts) for ts in trainee_skills):
            matched_set.add(req)

    matched_count = len(matched_set)
    if total_jd_skills == 0:
        skills_pct = 100.0
    else:
        skills_pct = (matched_count / total_jd_skills) * 100.0

    # ----- Location match -----
    EXACT_LIMIT = 60.0      # km – considered “exact”
    NEARBY_LIMIT = 600.0    # km – considered “nearby”

    t_loc = t_dict["userInfo"]["location"]
    jd_locs = jd_dict.get("location", [])
    if t_loc and jd_locs:
        # distance to the closest job location
        dist = min([geo_distance(t_loc, l) for l in jd_locs])
    else:
        dist = 9999  # effectively no location info

    if dist <= EXACT_LIMIT:
        location_pct = 100.0
    elif dist <= NEARBY_LIMIT:
        # linear drop from 100% at EXACT_LIMIT to 0% at NEARBY_LIMIT
        location_pct = max(0, 100 * (1 - (dist - EXACT_LIMIT) / (NEARBY_LIMIT - EXACT_LIMIT)))
    else:
        location_pct = 0.0

    # ----- Bucket assignment -----
    PASSING_SKILL = 45  # 45% skills required to be considered “skilled”
    has_skills = skills_pct >= PASSING_SKILL
    is_exact = dist <= EXACT_LIMIT
    is_nearby = dist <= NEARBY_LIMIT

    if has_skills and is_exact:
        bucket = "PERFECT_MATCH"
    elif has_skills and not is_exact:
        bucket = "SKILLS_ONLY"
    elif not has_skills and is_exact:
        bucket = "LOCATION_ONLY"
    elif not has_skills and is_nearby:
        bucket = "NEARBY"
    else:
        bucket = "NO_MATCH"

    # ----- Total percentage (simple average) -----
    total_pct = (skills_pct + location_pct) / 2.0

    return skills_pct, location_pct, total_pct, bucket, list(matched_set)

# ---- 5. Main Matching Engine ----

from django.db import transaction

def run_matching_logic(job_id=None):
    print("🚀 Starting Matching Engine...")
    updates_made = False

    if job_id:
        jobs = Job.objects.filter(id=job_id, status='active')
        if not jobs.exists():
            print(f"   Job {job_id} not found or inactive.")
            return False
    else:
        jobs = Job.objects.filter(status='active')

    trainees = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses').all()

    if not jobs.exists() or not trainees.exists():
        return False

    with transaction.atomic():
        for job in jobs:
            print(f"🔍 Processing job: {job.title} ({job.location})")

            # Delete old matches for this job
            deleted, _ = Match.objects.filter(job_ref=job).delete()
            if deleted:
                print(f"   Deleted {deleted} old matches.")

            jd_dict = {
                "title": job.title,
                "techSkills": job.techSkills,
                "location": job.location if isinstance(job.location, list) else [job.location],
            }
            candidates = trainees  # all trainees; we'll process them in batches

            BATCH_SIZE = 5
            for i in range(0, len(candidates), BATCH_SIZE):
                batch = candidates[i:i+BATCH_SIZE]

                batch_data = []
                semantic_texts = []
                for t in batch:
                    info = {
                        "name": t.userInfo.name if t.userInfo else "Unknown",
                        "location": t.userInfo.location if t.userInfo else "",
                        "userId": t.userInfo.userId if t.userInfo else "",
                        "id": t.id
                    }
                    strengths = [{"courseName": s.courseName} for s in t.strengths.all()]
                    weaknesses = [{"courseName": w.courseName} for w in t.weaknesses.all()]
                    batch_data.append({
                        "userInfo": info,
                        "strengths": strengths,
                        "weaknesses": weaknesses,
                        "db_obj": t
                    })
                    skill_str = ", ".join([s['courseName'] for s in strengths])
                    semantic_texts.append(f"Candidate: {info['name']}. Skills: {skill_str}. Location: {info['location']}")

                # Embeddings (if available)
                jd_text = f"Job: {jd_dict['title']}. Skills: {', '.join(jd_dict['techSkills'])}. Location: {', '.join(jd_dict['location'])}"
                try:
                    if embed_model:
                        vecs = np.array(embed_model.embed_documents(semantic_texts), dtype='float32')
                        jd_vec = np.array(embed_model.embed_documents([jd_text]), dtype='float32')
                    else:
                        vecs = np.random.rand(len(batch), 768).astype('float32')
                        jd_vec = np.random.rand(1, 768).astype('float32')
                except Exception as e:
                    print(f"   ❌ Embedding failed: {e}")
                    continue

                # FAISS similarity (used only for vector_sim, not for scoring)
                faiss.normalize_L2(vecs)
                faiss.normalize_L2(jd_vec)
                index = faiss.IndexFlatIP(vecs.shape[1])
                index.add(vecs)
                D, I = index.search(jd_vec, len(batch))

                # Score and save
                for j, idx in enumerate(I[0]):
                    if idx == -1: continue
                    t_data = batch_data[int(idx)]
                    vector_sim = float(D[0][j])

                    # Compute distance (will be recalculated inside compute_scores, but we pass it anyway)
                    dist = 9999
                    if t_data["userInfo"]["location"] and jd_dict["location"]:
                        dist = min([geo_distance(t_data["userInfo"]["location"], loc) for loc in jd_dict["location"]])

                    skills_pct, loc_pct, total_pct, bucket, matched = compute_scores(t_data, jd_dict, dist)

                    Match.objects.create(
                        job_ref=job,
                        trainee_ref=t_data['db_obj'],
                        trainee_name=t_data["userInfo"]["name"],
                        trainee_location=t_data["userInfo"]["location"],
                        trainee_id=t_data["userInfo"]["userId"],
                        job_id=job.id,
                        job_title=job.title,
                        skills_percentage=skills_pct,
                        location_percentage=loc_pct,
                        total_percentage=total_pct,
                        bucket=bucket,
                        distance=dist,
                        matched_skills=matched
                    )
                    updates_made = True
                    print(f"   👤 {t_data['userInfo']['name']} -> {bucket} (skills: {skills_pct:.1f}%, loc: {loc_pct:.1f}%)")

    return updates_made