# import os
# import re
# import faiss
# import numpy as np
# import requests
# import urllib3
# import time
# from math import radians, cos, sin, asin, sqrt
# from langchain_ollama import ChatOllama, OllamaEmbeddings

# # Import your models
# from .models import Job, ProfileRecord, UserInfo, Match

# # ---- 1. Global Configurations ----
# urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# PROXIES = {
#    'http': 'http://172.17.0.11:8080',
#    'https': 'http://172.17.0.11:8080',
# }

# HEADERS = {
#     'User-Agent': 'TCS_GenAI_Internal_Tool/1.0 (contact@tcs.com)' 
# }

# # OLLAMA_URL = "http://172.20.200.21:9007"
# OLLAMA_URL="http://172.20.203.198:7777"
# MODEL_NAME="qwen2.5-coder:3b"
# # "mistral-nemo:latest"
# CITY_CACHE = {} 

# # ---- 2. Initialize Models ----
# try:
#     llm = ChatOllama(base_url=OLLAMA_URL, model=MODEL_NAME, temperature=0.3)
#     print(f"🌐 Connecting to Ollama Embeddings at {OLLAMA_URL}...")
#     embed_model = OllamaEmbeddings(base_url=OLLAMA_URL, model=MODEL_NAME)
# except Exception as e:
#     print(f"⚠️ Model Init Error: {e}")
#     llm = None
#     embed_model = None


# # ---- 3. Helper Functions ----

# def clean(txt: str) -> str:
#     if not txt: return ""
#     return re.sub(r"<think>.*?</think>", "", txt, flags=re.S).strip()

# def extract_trainee(trainee_data, jd_text):
#     p = f"""
#     Job Description:
#     {jd_text}

#     Trainee Profile:
#     {trainee_data}

#     Task:
#     Extract and return ONLY:
#     1. Relevant technical skills
#     2. Soft skills
#     3. Location

#     Rules:
#     - Match exact skills AND transferable skills.
    
#     Output ONLY:
#     - relevant_skills: [List]
#     - soft_skills: [List]
#     - matched_location: [Location]
#     """
#     if llm: return clean(llm.invoke(p).content)
#     return str(trainee_data)

# def extract_jd(jd_data):
#     p = f"JD JSON:\n{jd_data}\nExtract required skills, soft skills & preferred locations."
#     if llm: return clean(llm.invoke(p).content)
#     return str(jd_data)

# def get_coordinates(city_name):
#     if not city_name: return None
#     city_key = city_name.lower().strip()
#     if city_key in CITY_CACHE: return CITY_CACHE[city_key]

#     url = "https://nominatim.openstreetmap.org/search"
#     params = {'q': city_name, 'format': 'json', 'limit': 1}

#     try:
#         response = requests.get(url, params=params, headers=HEADERS, proxies=PROXIES, verify=False, timeout=10)
#         if response.status_code == 200:
#             data = response.json()
#             if data:
#                 lat, lon = float(data[0]['lat']), float(data[0]['lon'])
#                 CITY_CACHE[city_key] = (lat, lon)
#                 return (lat, lon)
#     except Exception as e:
#         fallback = {"chennai": (13.0827, 80.2707), "bangalore": (12.9716, 77.5946)}
#         if city_key in fallback: return fallback[city_key]
#         print(f"❌ Geo API Error: {e}")
#     return None

# def geo_distance(loc1_name, loc2_name):
#     coords1 = get_coordinates(loc1_name)
#     coords2 = get_coordinates(loc2_name)
#     if not coords1 or not coords2: return 9999

#     lat1, lon1 = coords1
#     lat2, lon2 = coords2
#     R = 6371
#     dlat = radians(lat2 - lat1)
#     dlon = radians(lon2 - lon1)
#     a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
#     return round(2 * R * asin(sqrt(a)), 1)

# def compute_score(t_dict, jd_dict, dist, llm_response_text, vector_similarity):
#     """
#     Strict Scoring Ranges:
#     - Perfect Match: 80 - 96
#     - Skills Only:   65 - 80
#     - Location Only: 50 - 65
#     - Nearby:        0 - 50
#     """
#     matched_skills_set = set()
    
#     # --- 1. IDENTIFY SKILLS (Hybrid: Hard Match + LLM) ---
#     trainee_courses = t_dict.get("strengths", []) + t_dict.get("weaknesses", [])
    
#     # A. Hard Match
#     for s in jd_dict.get("techSkills", []):
#         s_clean = s.lower().strip()
#         for x in trainee_courses:
#             c_name = x.get("courseName", "").lower().strip()
#             if s_clean in c_name or c_name in s_clean:
#                 matched_skills_set.add(s) 

#     # B. LLM Match
#     if llm_response_text:
#         lower_resp = llm_response_text.lower()
#         for s in jd_dict.get("techSkills", []):
#             if s.lower() in lower_resp:
#                 matched_skills_set.add(s)

#     # --- 2. CALCULATE "QUALITY" METRIC (0.0 to 1.0) ---
#     # This metric determines where they fall WITHIN their bucket range.
#     # It combines: % of skills matched (70% weight) + AI Vector Similarity (30% weight)
    
#     total_jd_skills = len(jd_dict.get("techSkills", []))
#     matched_count = len(matched_skills_set)
    
#     if total_jd_skills > 0:
#         skill_ratio = matched_count / total_jd_skills
#     else:
#         skill_ratio = 0.0
        
#     # Quality score (0.0 to 1.0)
#     # If they matched all skills and vectors are close, quality is 1.0
#     quality_metric = (skill_ratio * 0.7) + (vector_similarity * 0.3)
#     quality_metric = min(quality_metric, 1.0) # Cap at 1.0

#     # --- 3. DETERMINE BUCKET ---
#     SKILL_THRESHOLD_RATIO = 0.4 # Must have at least 40% skills for Skill/Perfect bucket
#     EXACT_LIMIT = 50.0
#     PROXIMAL_LIMIT = 600.0

#     has_enough_skills = skill_ratio >= SKILL_THRESHOLD_RATIO
#     has_exact_location = dist <= EXACT_LIMIT
#     is_proximal = dist <= PROXIMAL_LIMIT

#     bucket = "NO_MATCH"
#     final_score = 0.0

#     # --- 4. ASSIGN SCORE BASED ON BUCKET RANGES ---

#     if has_enough_skills and has_exact_location:
#         bucket = "PERFECT_MATCH"
#         # Range: 80 to 96
#         # Formula: 80 + (Quality * 16)
#         final_score = 80.0 + (quality_metric * 16.0)

#     elif has_enough_skills and not has_exact_location:
#         bucket = "SKILLS_ONLY"
#         # Range: 65 to 80
#         # Formula: 65 + (Quality * 15)
#         final_score = 65.0 + (quality_metric * 15.0)

#     elif not has_enough_skills and has_exact_location:
#         bucket = "LOCATION_ONLY"
#         # Range: 50 to 65
#         # Even without hard skills, we vary score based on vector similarity (soft skills/context)
#         # Formula: 50 + (VectorSim * 15)
#         final_score = 50.0 + (vector_similarity * 15.0)

#     elif is_proximal:
#         bucket = "NEARBY"
#         # Range: Below 50
#         # Formula: Distance Decay. Closer = Higher Score.
#         # 50km -> 49 pts, 600km -> 10 pts
#         # Normalized Distance (0.0 is close, 1.0 is far)
#         norm_dist = (dist - EXACT_LIMIT) / (PROXIMAL_LIMIT - EXACT_LIMIT)
#         # Score = 49 - (norm_dist * 39)  (keeps it roughly 10-49)
#         final_score = 49.0 - (norm_dist * 39.0)
#         final_score = max(final_score, 10.0) # Minimum 10 points

#     else:
#         bucket = "NO_MATCH"
#         final_score = 0.0

#     # --- 5. FORMATTING ---
#     final_score = round(final_score, 2)
    
#     # Visual splits for frontend (optional logic to fill the individual bars)
#     # We just distribute the final score logically for display purposes
#     if bucket in ["PERFECT_MATCH", "SKILLS_ONLY"]:
#         skill_display = final_score
#         loc_display = 0.0 if bucket == "SKILLS_ONLY" else 30.0
#     elif bucket == "LOCATION_ONLY":
#         skill_display = 0.0
#         loc_display = final_score
#     else:
#         skill_display = 0.0
#         loc_display = final_score # For nearby, entire score is location-based

#     if bucket == "NO_MATCH":
#         final_matched_skills = []
#     else:
#         final_matched_skills = list(matched_skills_set)

#     return skill_display, loc_display, final_score, bucket, final_matched_skills


# # ---- 4. Main Engine Function ----

# def run_matching_logic():
#     updates_made = False
#     active_jobs = Job.objects.filter(status='active')
#     trainees_db = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses').all()

#     if not active_jobs.exists() or not trainees_db.exists():
#         return False

#     for job in active_jobs:
#         jd_dict = {
#             "title": job.title,
#             "techSkills": job.techSkills,
#             "location": job.location if isinstance(job.location, list) else [job.location],
#         }

#         existing_trainee_ids = Match.objects.filter(job_ref=job).values_list('trainee_ref_id', flat=True)
#         new_trainees_db = [t for t in trainees_db if t.id not in existing_trainee_ids]

#         if not new_trainees_db: continue

#         trainees_list_dicts = []
#         for t in new_trainees_db:
#             t_info = {
#                 "name": t.userInfo.name if t.userInfo else "Unknown",
#                 "location": t.userInfo.location if t.userInfo else "",
#                 "id": t.id
#             }
#             strengths = [{"courseName": s.courseName, "avgScore": s.avgScore} for s in t.strengths.all()]
#             weaknesses = [{"courseName": w.courseName, "avgScore": w.avgScore} for w in t.weaknesses.all()]
            
#             trainees_list_dicts.append({
#                 "userInfo": t_info, "strengths": strengths, "weaknesses": weaknesses, "db_obj": t
#             })

#         # LLM Semantic Extraction
#         semantic_profiles = [extract_trainee(t, str(jd_dict)) for t in trainees_list_dicts]
#         jd_semantic = extract_jd(str(jd_dict))
        
#         if not semantic_profiles: continue 
        
#         try:
#             if embed_model:
#                 vecs = np.array(embed_model.embed_documents(semantic_profiles), dtype='float32')
#                 jd_vec = np.array(embed_model.embed_documents([jd_semantic]), dtype='float32')
#             else: continue
#         except Exception: continue

#         faiss.normalize_L2(vecs); faiss.normalize_L2(jd_vec)
#         index = faiss.IndexFlatIP(vecs.shape[1])
#         index.add(vecs)
        
#         # Get Similarity Scores (D) along with Indices (I)
#         D, I = index.search(jd_vec, len(trainees_list_dicts)) 

#         # Process Results
#         for i, idx in enumerate(I[0]):
#             if idx == -1: continue
            
#             vector_similarity = float(D[0][i]) 
#             llm_text_response = semantic_profiles[int(idx)]
#             t_data = trainees_list_dicts[int(idx)]
            
#             t_loc = t_data["userInfo"].get("location")
#             jd_locs = jd_dict.get("location", [])
#             dists = [geo_distance(t_loc, l) for l in jd_locs]
#             dist = min(dists) if dists else 9999

#             s, l, tot, b, matched_skills = compute_score(
#                 t_data, jd_dict, dist, 
#                 llm_response_text=llm_text_response,
#                 vector_similarity=vector_similarity
#             )

#             match, created = Match.objects.get_or_create(
#                 job_ref=job,
#                 trainee_ref=t_data['db_obj'],
#                 defaults={
#                     "trainee_name": t_data["userInfo"]["name"],
#                     "trainee_location": t_loc,
#                     "trainee_id": t_data["userInfo"].get("id"),
#                     "job_id": job.id,
#                     "job_title": job.title,
#                     "skills_percentage": s,
#                     "location_percentage": l,
#                     "total_percentage": tot,
#                     "bucket": b,
#                     "distance": dist,             
#                     "matched_skills": matched_skills 
#                 }
#             )
#             if created: updates_made = True

#     return updates_made


import os
import re
import faiss
import numpy as np
import requests
import urllib3
import time
from math import radians, cos, sin, asin, sqrt
from langchain_ollama import ChatOllama, OllamaEmbeddings

# Import your models
from .models import Job, ProfileRecord, UserInfo, Match

# ---- 1. Global Configurations ----
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# NETWORK CONFIG: Bypass proxy for internal IPs
os.environ['NO_PROXY'] = 'localhost,127.0.0.1,172.20.203.198'

PROXIES = {
   'http': 'http://172.17.0.11:8080',
   'https': 'http://172.17.0.11:8080',
}

HEADERS = {
    'User-Agent': 'TCS_GenAI_Internal_Tool/1.0 (contact@tcs.com)' 
}

OLLAMA_URL = "http://172.20.203.198:7777"
MODEL_NAME = "qwen2.5-coder:3b"
CITY_CACHE = {} 

# ---- 2. Initialize Models ----
try:
    print(f"🌐 Connecting to Ollama at {OLLAMA_URL}...")
    # Test connection first
    _test = requests.get(f"{OLLAMA_URL}/api/tags", proxies={}, timeout=2)
    if _test.status_code == 200:
        print("✅ Ollama Connection Successful.")
        embed_model = OllamaEmbeddings(base_url=OLLAMA_URL, model=MODEL_NAME)
        llm = ChatOllama(base_url=OLLAMA_URL, model=MODEL_NAME, temperature=0.1) # Low temp for strictness
    else:
        print(f"⚠️ Ollama reachable but status: {_test.status_code}")
        llm = None; embed_model = None
except Exception as e:
    print(f"⚠️ Model Init Error: {e}")
    llm = None; embed_model = None


# ---- 3. Helper Functions ----

def clean(txt: str) -> str:
    if not txt: return ""
    return re.sub(r"<think>.*?</think>", "", txt, flags=re.S).strip()

def extract_trainee_strict(trainee_data, jd_text):
    """
    Revised Prompt: STRICT extraction. 
    We specifically tell the LLM NOT to hallucinate transferable skills.
    """
    p = f"""
    Analyze the Candidate Profile against the Job Description.
    
    Job Description:
    {jd_text}

    Candidate Profile:
    {trainee_data}

    Task:
    1. List ONLY technical skills explicitly mentioned in both texts.
    2. Do NOT infer skills (e.g., do not say "knows Java" if they only know "Python").
    
    Output Format (Comma separated):
    Skills: [List]
    Location: [City]
    """
    if llm: return clean(llm.invoke(p).content)
    return str(trainee_data)

def get_coordinates(city_name):
    if not city_name: return None
    city_key = city_name.lower().strip()
    if city_key in CITY_CACHE: return CITY_CACHE[city_key]

    # Fast Fallbacks to avoid API latency
    fallback = {
        "chennai": (13.08, 80.27), "bangalore": (12.97, 77.59), "bengaluru": (12.97, 77.59),
        "mumbai": (19.07, 72.87), "delhi": (28.70, 77.10), "hyderabad": (17.38, 78.48),
        "pune": (18.52, 73.85), "kolkata": (22.57, 88.36), "coimbatore": (11.01, 76.95),
        "kochi": (9.93, 76.26), "trivandrum": (8.52, 76.93)
    }
    if city_key in fallback:
        CITY_CACHE[city_key] = fallback[city_key]
        return fallback[city_key]

    url = "https://nominatim.openstreetmap.org/search"
    try:
        # Strict timeout 2s
        resp = requests.get(url, params={'q': city_name, 'format': 'json', 'limit': 1}, 
                           headers=HEADERS, proxies=PROXIES, verify=False, timeout=2)
        if resp.status_code == 200 and resp.json():
            lat, lon = float(resp.json()[0]['lat']), float(resp.json()[0]['lon'])
            CITY_CACHE[city_key] = (lat, lon)
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

def compute_score_strict(t_dict, jd_dict, dist, vector_similarity):
    """
    STRICT BUCKETING LOGIC
    """
    matched_skills_set = set()
    
    # --- 1. HARD SKILL MATCHING (The Gatekeeper) ---
    # We strictly compare JD required skills vs Trainee courses
    # We normalize everything to lowercase for comparison
    
    trainee_skills = [s.get("courseName", "").lower().strip() for s in t_dict.get("strengths", [])]
    trainee_skills += [w.get("courseName", "").lower().strip() for w in t_dict.get("weaknesses", [])]
    
    jd_tech_skills = jd_dict.get("techSkills", [])
    total_jd_skills = len(jd_tech_skills)
    
    for req_skill in jd_tech_skills:
        req_clean = req_skill.lower().strip()
        # substring match: e.g. "python" matches "python programming"
        if any(req_clean in t_skill or t_skill in req_clean for t_skill in trainee_skills):
            matched_skills_set.add(req_skill)

    matched_count = len(matched_skills_set)
    skill_match_ratio = matched_count / total_jd_skills if total_jd_skills > 0 else 0.0

    # --- 2. LOGIC GATES ---
    
    # CONSTANTS
    EXACT_LOC_LIMIT = 60.0   # km
    NEARBY_LIMIT    = 600.0  # km
    PASSING_SKILL   = 0.45   # 45% skills must match to be considered "Skilled"
    
    bucket = "NO_MATCH"
    final_score = 0.0
    
    # GATE 1: Check Location
    is_exact_loc = dist <= EXACT_LOC_LIMIT
    is_nearby    = dist <= NEARBY_LIMIT
    
    # GATE 2: Check Skills
    has_skills   = skill_match_ratio >= PASSING_SKILL

    # --- 3. BUCKET ASSIGNMENT (Strict Hierarchy) ---

    if has_skills and is_exact_loc:
        bucket = "PERFECT_MATCH"
        # Score driven by High Skills + High Vector Sim
        final_score = 85.0 + (skill_match_ratio * 10) + (vector_similarity * 5)

    elif has_skills and not is_exact_loc:
        bucket = "SKILLS_ONLY"
        # Score driven by Skills, penalized by distance
        final_score = 70.0 + (skill_match_ratio * 10)

    elif not has_skills and is_exact_loc:
        bucket = "LOCATION_ONLY"
        # Score is lower (50-65), implies they are close but need training
        final_score = 55.0 + (vector_similarity * 10)

    elif is_nearby:
        # If they are essentially "No Skills" and "Not Exact Loc" but "Nearby"
        bucket = "NEARBY"
        # Decay score based on distance (closer to 60km = higher score)
        # Range 10.0 to 49.0
        dist_factor = (NEARBY_LIMIT - dist) / (NEARBY_LIMIT - EXACT_LOC_LIMIT) # 1.0 is close, 0.0 is far
        final_score = 10.0 + (dist_factor * 39.0)

    else:
        bucket = "NO_MATCH"
        final_score = 0.0

    # --- 4. SAFETY CLAMP ---
    final_score = min(max(final_score, 0.0), 100.0)
    final_score = round(final_score, 2)
    
    # --- 5. VISUAL SPLIT ---
    if bucket == "PERFECT_MATCH":
        s_disp = final_score * 0.7
        l_disp = final_score * 0.3
    elif bucket == "SKILLS_ONLY":
        s_disp = final_score
        l_disp = 0.0
    elif bucket == "LOCATION_ONLY":
        s_disp = 0.0
        l_disp = final_score
    else: # Nearby / No Match
        s_disp = 0.0
        l_disp = final_score

    return s_disp, l_disp, final_score, bucket, list(matched_skills_set)


# ---- 4. Main Engine Function ----

def run_matching_logic():
    print("🚀 Starting STRICT Matching Logic...")
    updates_made = False
    
    active_jobs = Job.objects.filter(status='active')
    trainees_db = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses').all()

    if not active_jobs.exists() or not trainees_db.exists():
        return False

    for job in active_jobs:
        print(f"🔍 Processing Job: {job.title} ({job.location})")
        
        jd_dict = {
            "title": job.title,
            "techSkills": job.techSkills, # List of strings
            "location": job.location if isinstance(job.location, list) else [job.location],
        }

        # Filter: Only process trainees NOT already matched for this job
        existing = set(Match.objects.filter(job_ref=job).values_list('trainee_ref_id', flat=True))
        candidates = [t for t in trainees_db if t.id not in existing]

        if not candidates: continue

        # --- BATCH PROCESSING (Size 5) ---
        BATCH_SIZE = 5
        for i in range(0, len(candidates), BATCH_SIZE):
            batch = candidates[i:i+BATCH_SIZE]
            
            trainees_list_dicts = []
            semantic_texts = []
            
            # Prepare Batch Data
            for t in batch:
                t_info = {
                    "name": t.userInfo.name if t.userInfo else "Unknown",
                    "location": t.userInfo.location if t.userInfo else "",
                    "id": t.id
                }
                strengths = [{"courseName": s.courseName} for s in t.strengths.all()]
                weaknesses = [{"courseName": w.courseName} for w in t.weaknesses.all()]
                
                trainees_list_dicts.append({
                    "userInfo": t_info, "strengths": strengths, "weaknesses": weaknesses, "db_obj": t
                })
                
                # Semantic Text Prep (Combine name, loc, skills for context)
                skills_str = ", ".join([s['courseName'] for s in strengths])
                semantic_texts.append(f"Candidate: {t_info['name']}. Skills: {skills_str}. Location: {t_info['location']}")

            # JD Text
            jd_skills_str = ", ".join(jd_dict['techSkills'])
            jd_text = f"Job: {jd_dict['title']}. Skills: {jd_skills_str}. Location: {jd_dict['location']}"
            
            # 1. EMBEDDINGS (Safe Call)
            try:
                if embed_model:
                    vecs = np.array(embed_model.embed_documents(semantic_texts), dtype='float32')
                    jd_vec = np.array(embed_model.embed_documents([jd_text]), dtype='float32')
                else:
                    # Fallback if model failed init
                    vecs = np.random.rand(len(batch), 768).astype('float32')
                    jd_vec = np.random.rand(1, 768).astype('float32')
            except Exception as e:
                print(f"   ❌ Embed Failed: {e}")
                continue

            # 2. FAISS SEARCH
            faiss.normalize_L2(vecs); faiss.normalize_L2(jd_vec)
            index = faiss.IndexFlatIP(vecs.shape[1])
            index.add(vecs)
            D, I = index.search(jd_vec, len(batch))

            # 3. SCORE & SAVE
            for j, idx in enumerate(I[0]):
                if idx == -1: continue
                
                t_data = trainees_list_dicts[int(idx)]
                vector_sim = float(D[0][j])
                
                # Distance Calc
                t_loc = t_data["userInfo"]["location"]
                jd_locs = jd_dict["location"]
                # Find closest JD location
                dists = [geo_distance(t_loc, l) for l in jd_locs]
                dist = min(dists) if dists else 9999

                # STRICT SCORING
                s, l, tot, b, matched_skills = compute_score_strict(
                    t_data, jd_dict, dist, vector_sim
                )

                # --- DB SAVE FIX: Matching Your Schema Exactly ---
                Match.objects.create(
                    # Foreign Keys
                    job_ref=job,
                    trainee_ref=t_data['db_obj'],
                    
                    # Snapshot Fields (The ones causing your NULL error)
                    trainee_name=t_data["userInfo"]["name"],
                    trainee_location=t_loc,
                    trainee_id=t_data["userInfo"]["id"],  # Explicit ID
                    job_id=job.id,                        # Explicit ID
                    job_title=job.title,                  # Explicit Title
                    
                    # Scoring Fields
                    skills_percentage=s,
                    location_percentage=l,
                    total_percentage=tot,
                    bucket=b,
                    distance=dist,             
                    matched_skills=matched_skills 
                )
                updates_made = True
                print(f"   👤 {t_data['userInfo']['name']} -> {b}")

    return updates_made