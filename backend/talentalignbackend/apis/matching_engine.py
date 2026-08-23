# apis/matching_engine.py
"""
Matching Engine for Talent Align – semantic embeddings + parallel execution.

- Skills are matched using cosine similarity of local model embeddings.
- Job embeddings are computed once per job.
- Trainee skill embeddings are cached across the run.
- Thread pool processes trainees in parallel.
- Geocoding uses Nominatim with Django cache + hardcoded fallback.
- City name normalization handles spelling variations (Bangalore/Bengaluru).
- Preferred locations (up to 3) are used exclusively for location matching.
- userInfo.location is NOT used as fallback.
- LLM is imported for other modules (not used in matching).
"""

import logging
import time
import os
import requests
from math import radians, cos, sin, asin, sqrt
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db import transaction
from django.core.cache import cache
import numpy as np
from .models import Job, ProfileRecord, Match, Notification, Consent

# ---------- LLM Setup (for views that use it) ----------
try:
    from langchain_community.llms import Ollama
    llm = Ollama(model="llama3")
except ImportError:
    llm = None
    logging.warning("LangChain not installed. AI features will be limited.")

def clean(text):
    """Strip whitespace and remove extra newlines."""
    return text.strip() if text else ""

logger = logging.getLogger(__name__)

# ---------- Local embedding service configuration ----------
EMBEDDING_SERVICE_URL = os.environ.get(
    'EMBEDDING_SERVICE_URL',
    'http://localhost:11434/api/embed'
)
EMBEDDING_MODEL = "nomic-embed-text:latest"
EMBEDDING_TIMEOUT = 30

_embedding_session = requests.Session()

# ----------- Caches for embeddings -----------
_skill_embedding_cache = {}
_trainee_embedding_cache = {}


# ----------- Skill Normalization Mapping -----------
SKILL_MAPPING = {
    'java': ['java', 'spring', 'spring boot', 'selenium with java', 'junit', 'hibernate', 'j2ee', 'core java', 'advanced java'],
    'python': ['python', 'django', 'flask', 'fastapi', 'selenium with python', 'pandas', 'numpy'],
    'javascript': ['javascript', 'node', 'nodejs', 'node.js', 'react', 'angular', 'vue', 'vue.js', 'typescript', 'jest', 'express', 'express.js', 'next.js', 'nextjs'],
    '.net': ['.net', 'c#', 'csharp', 'asp.net', 'dotnet', '.net core', 'vb.net'],
    'data': ['sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'data', 'analytics', 'data science', 'data engineering', 'power bi', 'tableau'],
    'cloud': ['aws', 'azure', 'gcp', 'cloud', 'devops', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'],
    'testing': ['testing', 'qa', 'automation', 'manual testing', 'selenium', 'cypress', 'appium', 'jmeter', 'load testing'],
    'web': ['html', 'css', 'bootstrap', 'tailwind', 'sass', 'less', 'responsive design'],
}

# Build reverse mapping: specific skill -> stream category
_SKILL_TO_STREAM = {}
for stream, skills in SKILL_MAPPING.items():
    for skill in skills:
        _SKILL_TO_STREAM[skill.lower()] = stream


def normalize_skills(stream_or_skill):
    """Expand a stream name or skill into all related skill keywords."""
    if not stream_or_skill:
        return []
    key = stream_or_skill.strip().lower()
    # If it's a stream name, return all related skills
    if key in SKILL_MAPPING:
        return SKILL_MAPPING[key]
    # If it's a specific skill, return the stream's skills
    if key in _SKILL_TO_STREAM:
        return SKILL_MAPPING[_SKILL_TO_STREAM[key]]
    return [key]


def get_normalized_job_skills(job):
    """Get expanded skill list for a job based on its skills and stream fields."""
    skills_set = set()
    # Add skills from the skills field
    if job.skills:
        for skill in job.skills.split(','):
            skill = skill.strip()
            if skill:
                skills_set.add(skill.lower())
                # Also add normalized expansions
                for expanded in normalize_skills(skill):
                    skills_set.add(expanded.lower())
    # Add skills from stream field
    if job.stream:
        for expanded in normalize_skills(job.stream):
            skills_set.add(expanded.lower())
    return list(skills_set)


def _parse_embedding_response(data):
    """Parse embedding response from Ollama's /api/embed endpoint."""
    if not isinstance(data, dict):
        raise ValueError('Unexpected embedding response format')

    if 'embeddings' in data and isinstance(data['embeddings'], list) and data['embeddings']:
        return data['embeddings'][0]
    
    if 'embedding' in data:
        return data['embedding']

    if 'data' in data and isinstance(data['data'], list) and data['data']:
        first = data['data'][0]
        if isinstance(first, dict) and 'embedding' in first:
            return first['embedding']

    raise ValueError(f'No embedding found in response. Response structure: {list(data.keys())}')


def get_embedding(text):
    """Get embedding vector for a text string using nomic-embed-text model."""
    if not text:
        return None

    text = text.strip()[:8000]
    
    payload = {
        'model': EMBEDDING_MODEL,
        'input': text,
    }

    try:
        response = _embedding_session.post(
            EMBEDDING_SERVICE_URL,
            json=payload,
            timeout=EMBEDDING_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        embedding = _parse_embedding_response(data)
        return np.array(embedding, dtype=np.float32)
    except Exception as e:
        logger.exception(f'Embedding service failed for "{text[:50]}...": {e}')
        return None


def is_valid_embedding(vec):
    """Check if embedding vector is valid for similarity calculation."""
    return isinstance(vec, np.ndarray) and vec.size > 0 and np.linalg.norm(vec) > 1e-6


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors."""
    if not is_valid_embedding(vec1) or not is_valid_embedding(vec2):
        return 0.0
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 < 1e-6 or norm2 < 1e-6:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


def get_skill_embedding(skill_name):
    """Return embedding vector for a skill with in‑memory cache."""
    if not skill_name:
        return None
    key = skill_name.lower().strip()
    if key not in _skill_embedding_cache:
        _skill_embedding_cache[key] = get_embedding(key)
    return _skill_embedding_cache[key]


def get_trainee_skill_embeddings(trainee):
    """Return dict of {skill_name -> embedding} for a trainee."""
    if trainee.id not in _trainee_embedding_cache:
        emb = {}
        for s in trainee.strengths.all():
            skill_name = s.courseName if hasattr(s, 'courseName') else str(s)
            emb[skill_name] = get_skill_embedding(skill_name)
        _trainee_embedding_cache[trainee.id] = emb
    return _trainee_embedding_cache[trainee.id]


# ---------- Haversine Distance ----------
def haversine(lon1, lat1, lon2, lat2):
    """Calculate distance between two points in km using haversine formula."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Earth's radius in km
    return c * r


# ---------- City Name Normalization ----------
CITY_ALIASES = {
    'bangalore': 'bengaluru',
    'bengaluru': 'bengaluru',
    'bengalore': 'bengaluru',
    'blr': 'bengaluru',
    'mumbai': 'mumbai',
    'bombay': 'mumbai',
    'delhi': 'delhi',
    'new delhi': 'delhi',
    'dilli': 'delhi',
    'chennai': 'chennai',
    'madras': 'chennai',
    'hyderabad': 'hyderabad',
    'hyd': 'hyderabad',
    'secunderabad': 'hyderabad',
    'pune': 'pune',
    'poona': 'pune',
    'kolkata': 'kolkata',
    'calcutta': 'kolkata',
    'ahmedabad': 'ahmedabad',
    'amdavad': 'ahmedabad',
    'lucknow': 'lucknow',
    'lakhnau': 'lucknow',
    'nagpur': 'nagpur',
    'kochi': 'kochi',
    'cochin': 'kochi',
    'trivandrum': 'thiruvananthapuram',
    'thiruvananthapuram': 'thiruvananthapuram',
    'tvm': 'thiruvananthapuram',
    'jaipur': 'jaipur',
    'indore': 'indore',
    'bhopal': 'bhopal',
    'visakhapatnam': 'visakhapatnam',
    'vizag': 'visakhapatnam',
    'waltair': 'visakhapatnam',
    'vskp': 'visakhapatnam',
    'bhubaneswar': 'bhubaneswar',
    'bbsr': 'bhubaneswar',
    'chandigarh': 'chandigarh',
    'guwahati': 'guwahati',
    'mysore': 'mysuru',
    'mysuru': 'mysuru',
    'mangalore': 'mangaluru',
    'mangaluru': 'mangaluru',
    'gurgaon': 'gurugram',
    'gurugram': 'gurugram',
    'noida': 'noida',
    'greater noida': 'noida',
    'ghaziabad': 'ghaziabad',
    'faridabad': 'faridabad',
    'surat': 'surat',
    'vadodara': 'vadodara',
    'baroda': 'vadodara',
    'rajkot': 'rajkot',
    'nashik': 'nashik',
    'nasik': 'nashik',
    'aurangabad': 'aurangabad',
    'sambhajinagar': 'aurangabad',
    'coimbatore': 'coimbatore',
    'kovai': 'coimbatore',
    'madurai': 'madurai',
    'tiruchirappalli': 'tiruchirappalli',
    'trichy': 'tiruchirappalli',
    'salem': 'salem',
    'tirunelveli': 'tirunelveli',
    'pondicherry': 'puducherry',
    'puducherry': 'puducherry',
    'pondy': 'puducherry',
}


def normalize_city_name(city_name):
    """Convert city name to canonical form for matching."""
    if not city_name:
        return None
    cleaned = city_name.strip().lower()
    cleaned = ' '.join(cleaned.split())
    return CITY_ALIASES.get(cleaned, cleaned)


# ---------- Real Geocoding with Caching ----------
def geocode_city(city_name):
    """
    Convert a city name to (latitude, longitude).
    Uses Nominatim with Django cache (30 days) and hardcoded fallback.
    """
    if not city_name:
        return None, None

    city_key = normalize_city_name(city_name)
    if not city_key:
        return None, None
    
    cache_key = f"geocode_{city_key}"

    cached = cache.get(cache_key)
    if cached:
        logger.debug(f"Cache hit for {city_name} -> ({cached[0]}, {cached[1]})")
        return cached

    headers = {'User-Agent': 'TalentAlign/1.0 (tharunpolinati@gmail.com)'}
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': city_name,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'in'
    }

    try:
        time.sleep(1.1)
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                cache.set(cache_key, (lat, lon), 60 * 60 * 24 * 30)
                logger.debug(f"Geocoded {city_name} -> ({lat}, {lon})")
                return lat, lon
            else:
                logger.warning(f"No geocoding results for {city_name}")
        else:
            logger.error(f"Nominatim error {response.status_code} for {city_name}")
    except Exception as e:
        logger.exception(f"Geocoding exception for {city_name}: {e}")

    fallback_coords = {
        'bengaluru': (12.9716, 77.5946),
        'mumbai': (19.0760, 72.8777),
        'delhi': (28.6139, 77.2090),
        'chennai': (13.0827, 80.2707),
        'hyderabad': (17.3850, 78.4867),
        'pune': (18.5204, 73.8567),
        'ahmedabad': (23.0225, 72.5714),
        'kolkata': (22.5726, 88.3639),
        'nagpur': (21.1458, 79.0882),
        'lucknow': (26.8467, 80.9462),
        'kochi': (9.9312, 76.2673),
        'thiruvananthapuram': (8.5241, 76.9366),
        'jaipur': (26.9124, 75.7873),
        'indore': (22.7196, 75.8577),
        'bhopal': (23.2599, 77.4126),
        'visakhapatnam': (17.6868, 83.2185),
        'bhubaneswar': (20.2961, 85.8245),
        'chandigarh': (30.7333, 76.7794),
        'guwahati': (26.1445, 91.7362),
        'mysuru': (12.2958, 76.6394),
        'mangaluru': (12.9141, 74.8560),
        'gurugram': (28.4595, 77.0266),
        'noida': (28.5355, 77.3910),
        'ghaziabad': (28.6692, 77.4538),
        'faridabad': (28.4089, 77.3178),
        'surat': (21.1702, 72.8311),
        'vadodara': (22.3072, 73.1812),
        'rajkot': (22.3039, 70.8022),
        'nashik': (19.9975, 73.7898),
        'aurangabad': (19.8762, 75.3433),
        'coimbatore': (11.0168, 76.9558),
        'madurai': (9.9252, 78.1198),
        'tiruchirappalli': (10.7905, 78.7047),
        'salem': (11.6643, 78.1460),
        'tirunelveli': (8.7139, 77.7567),
        'puducherry': (11.9416, 79.8083),
    }
    
    coords = fallback_coords.get(city_key, (None, None))
    if coords[0]:
        cache.set(cache_key, coords, 60 * 60 * 24 * 7)
        logger.info(f"Using fallback coordinates for {city_name}")
    return coords


# ---------- Location Percentage Calculation ----------
def calculate_location_percentage(distance_km):
    """Convert distance to percentage match score."""
    if distance_km <= 50:
        return 100.0
    elif distance_km <= 200:
        return 80 + (200 - distance_km) / 150 * 20
    elif distance_km <= 500:
        return 50 + (500 - distance_km) / 300 * 30
    elif distance_km <= 800:
        return max(0, 50 - (distance_km - 500) / 300 * 50)
    else:
        return 0.0


# ---------- Semantic Skill Matching ----------
def compute_skills_match(job_embeddings, trainee_embeddings):
    """
    Compute skills match percentage using pre‑computed embeddings.
    If embeddings are unavailable, fall back to exact string matching.
    """
    if not job_embeddings:
        return 0.0, []

    job_skill_names = list(job_embeddings.keys())
    trainee_skill_names = list(trainee_embeddings.keys())

    valid_job_embeds = [v for v in job_embeddings.values() if is_valid_embedding(v)]
    valid_trainee_embeds = [v for v in trainee_embeddings.values() if is_valid_embedding(v)]
    
    has_valid_job_embeddings = len(valid_job_embeds) == len(job_embeddings)
    has_valid_trainee_embeddings = len(valid_trainee_embeds) == len(trainee_embeddings)

    if not (has_valid_job_embeddings and has_valid_trainee_embeddings):
        lower_job_skills = {skill.lower().strip() for skill in job_skill_names}
        matched_skills = [skill for skill in trainee_skill_names if skill.lower().strip() in lower_job_skills]
        if len(job_skill_names) > 0:
            percentage = (len(matched_skills) / len(job_skill_names)) * 100
        else:
            percentage = 0.0
        return min(percentage, 100.0), matched_skills

    matched_trainee_skills = []
    total_similarity = 0.0

    for job_skill, job_emb in job_embeddings.items():
        best_sim = 0.0
        best_trainee_skill = None
        for trainee_skill, trainee_emb in trainee_embeddings.items():
            sim = cosine_similarity(job_emb, trainee_emb)
            if sim > best_sim:
                best_sim = sim
                best_trainee_skill = trainee_skill
        total_similarity += best_sim
        if best_sim > 0.5 and best_trainee_skill and best_trainee_skill not in matched_trainee_skills:
            matched_trainee_skills.append(best_trainee_skill)

    if len(job_embeddings) > 0:
        percentage = (total_similarity / len(job_embeddings)) * 100
    else:
        percentage = 0.0
    percentage = min(percentage, 100.0)
    return percentage, matched_trainee_skills


# ---------- Trainee Processing Function (for thread pool) ----------
# ---------- Trainee Processing Function (for thread pool) ----------
def process_trainee(args):
    """
    args = (trainee, job_locations, job_embeddings)
    Returns a result dict.
    
    Location matching uses ONLY preferred locations (never userInfo.location):
    1. Preferred Location 1 (exact match via city normalization)
    2. Preferred Location 2 (exact match via city normalization)
    3. Preferred Location 3 (exact match via city normalization)
    4. Preferred Location 1 (proximity via Haversine)
    5. Preferred Location 2 (proximity via Haversine)
    6. Preferred Location 3 (proximity via Haversine)
    
    If no preferred locations are set, location_percentage = 0.
    """
    trainee, job_locations, job_embeddings = args
    trainee_embeddings = get_trainee_skill_embeddings(trainee)

    # Skills
    skills_perc, matched_skills = compute_skills_match(job_embeddings, trainee_embeddings)

    # Collect preferred locations (including state and city)
    preferred_locations = []
    if trainee.userInfo:
        if trainee.userInfo.preferred_location_1 and str(trainee.userInfo.preferred_location_1).strip():
            preferred_locations.append(str(trainee.userInfo.preferred_location_1).strip())
        if trainee.userInfo.preferred_location_2 and str(trainee.userInfo.preferred_location_2).strip():
            preferred_locations.append(str(trainee.userInfo.preferred_location_2).strip())
        if trainee.userInfo.preferred_location_3 and str(trainee.userInfo.preferred_location_3).strip():
            preferred_locations.append(str(trainee.userInfo.preferred_location_3).strip())
        if getattr(trainee.userInfo, 'preferred_city', None) and str(trainee.userInfo.preferred_city).strip():
            city_val = str(trainee.userInfo.preferred_city).strip()
            if city_val not in preferred_locations:
                preferred_locations.append(city_val)
        if getattr(trainee.userInfo, 'preferred_state', None) and str(trainee.userInfo.preferred_state).strip():
            state_val = str(trainee.userInfo.preferred_state).strip()
            if state_val not in preferred_locations:
                preferred_locations.append(state_val)

    best_distance = 9999.0
    best_location = None
    best_location_percentage = 0.0

    # Only calculate location match if preferred locations are set
    if preferred_locations:
        for job_loc in job_locations:
            job_loc_clean = normalize_city_name(job_loc)
            job_coords = geocode_city(job_loc)

            for pref_loc in preferred_locations:
                pref_loc_clean = normalize_city_name(pref_loc)
                
                # Exact match check (case-insensitive, normalized)
                if job_loc_clean and pref_loc_clean and job_loc_clean == pref_loc_clean:
                    best_location_percentage = 100.0
                    best_location = pref_loc
                    best_distance = 0.0
                    break
                
                # Proximity check
                if job_coords[0] is not None:
                    pref_coords = geocode_city(pref_loc)
                    if pref_coords[0] is not None:
                        dist = haversine(job_coords[1], job_coords[0], pref_coords[1], pref_coords[0])
                        loc_perc = calculate_location_percentage(dist)
                        if dist < best_distance or (dist == best_distance and loc_perc > best_location_percentage):
                            best_distance = dist
                            best_location = pref_loc
                            best_location_percentage = loc_perc

            # If exact match found, skip remaining job locations
            if best_location_percentage == 100.0:
                break

    # DPI is on a 0-5 scale, convert to percentage
    # 0 -> 0%, 1 -> 20%, 2 -> 40%, 3 -> 60%, 4 -> 80%, 5 -> 100%
    dpi_value = trainee.dpi if trainee.dpi is not None else 0
    dpi_value = max(0, min(5, float(dpi_value)))  # Clamp to 0-5
    experience_perc = (dpi_value / 5.0) * 100  # Convert to percentage

    availability_perc = 0.0 if trainee.userInfo and trainee.userInfo.isMapped else 100.0
    total_perc = (
        (skills_perc * 0.60) +
        (best_location_percentage * 0.20) +
        (experience_perc * 0.10) +
        (availability_perc * 0.10)
    )

    # Bucket categorization
    # - PERFECT_MATCH: Skills >= 80% AND Location >= 80%
    # - SKILLS_ONLY: Skills >= 70% AND Location < 80%
    # - LOCATION_ONLY: Skills < 70% AND Location >= 70%
    # - NEARBY: Skills < 70% AND Location >= 50% (proximity match)
    # - NO_MATCH: Everything else
    if skills_perc >= 80 and best_location_percentage >= 80:
        bucket = 'PERFECT_MATCH'
    elif skills_perc >= 70 and best_location_percentage < 80:
        bucket = 'SKILLS_ONLY'
    elif skills_perc < 70 and best_location_percentage >= 70:
        bucket = 'LOCATION_ONLY'
    elif skills_perc < 70 and best_location_percentage >= 50:
        bucket = 'NEARBY'
    else:
        bucket = 'NO_MATCH'

    return {
        'trainee': trainee,
        'skills_percentage': round(skills_perc, 2),
        'matched_skills': list(matched_skills) if matched_skills else [],
        'location_percentage': round(best_location_percentage, 2),
        'experience_percentage': round(experience_perc, 2),
        'availability_percentage': round(availability_perc, 2),
        'total_percentage': round(total_perc, 2),
        'bucket': bucket,
        'distance': round(best_distance, 2),
        'matched_location': best_location,
    }
# ---------- Main Matching Engine ----------
def run_matching_logic(job_id=None):
    """
    Match a specific job (if job_id given) or all active jobs.
    Returns True if successful, False otherwise.
    """
    if job_id:
        jobs = Job.objects.filter(id=job_id, status='active')
        logger.info(f"Running matching for job_id={job_id}")
    else:
        jobs = Job.objects.filter(status='active')
        logger.info("Running matching for all active jobs")

    if not jobs.exists():
        logger.info("No active jobs to match.")
        return False

    test_embedding = get_embedding("test")
    if test_embedding is None:
        logger.warning("Embedding service is not responding. Falling back to exact skill matching.")
    else:
        logger.info(f"✓ Embedding service active (vector dimension: {len(test_embedding)})")

    for job in jobs:
        logger.info(f"Processing job: {job.project_name} (Batch: {job.batch_name or 'None'})")

        trainees = ProfileRecord.objects.select_related('userInfo', 'userInfo__course').prefetch_related('strengths')
        if job.course_id:
            trainees = trainees.filter(userInfo__course_id=job.course_id)
            logger.info(f"  Filtered to course '{job.course.name}': {trainees.count()} trainees")
        if job.batch_name:
            trainees = trainees.filter(batch_name=job.batch_name)
            logger.info(f"  Filtered to batch '{job.batch_name}': {trainees.count()} trainees")

        # Exclude trainees who have PENDING or ACCEPTED consent for OTHER jobs
        consent_locked_trainee_ids = set(
            Consent.objects.filter(
                status__in=['PENDING', 'ACCEPTED']
            ).exclude(
                job=job
            ).values_list('trainee_id', flat=True)
        )
        if consent_locked_trainee_ids:
            trainees = trainees.exclude(id__in=consent_locked_trainee_ids)
            logger.info(f"  Excluded {len(consent_locked_trainee_ids)} consent-locked trainees")

        if not trainees.exists():
            logger.info(f"  No trainees found in this batch.")
            continue

        job_locations = [loc.strip() for loc in job.location.split(',') if loc.strip()] if job.location else []
        job_tech_skills = [skill.strip() for skill in job.skills.split(',') if skill.strip()] if job.skills else []

        # Also get normalized/expanded skills for broader matching
        normalized_skills = get_normalized_job_skills(job)
        # Merge: use original skills as primary, add normalized ones that aren't duplicates
        all_skills_lower = {s.lower() for s in job_tech_skills}
        for ns in normalized_skills:
            if ns.lower() not in all_skills_lower:
                job_tech_skills.append(ns)
                all_skills_lower.add(ns.lower())

        if not job_tech_skills:
            logger.warning(f"  Job has no skills defined. Skipping.")
            continue

        logger.info(f"  Computing embeddings for {len(job_tech_skills)} skills...")
        job_embeddings = {}
        for skill in job_tech_skills:
            emb = get_skill_embedding(skill)
            if emb is not None:
                job_embeddings[skill] = emb
            else:
                logger.warning(f"    Failed to get embedding for skill: {skill}")
        
        if not job_embeddings:
            job_embeddings = {skill: None for skill in job_tech_skills}
            logger.warning(f"  No valid embeddings for job skills. Using exact skill fallback.")

        trainee_args = [(trainee, job_locations, job_embeddings) for trainee in trainees]

        results = []
        max_workers = max(1, (os.cpu_count() or 4) // 2)
        logger.info(f"  Processing {len(trainee_args)} trainees with {max_workers} workers...")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_trainee = {executor.submit(process_trainee, args): args[0] for args in trainee_args}
            completed = 0
            for future in as_completed(future_to_trainee):
                try:
                    res = future.result()
                    results.append(res)
                    completed += 1
                    if completed % 10 == 0:
                        logger.debug(f"    Processed {completed}/{len(trainee_args)} trainees")
                except Exception as e:
                    trainee = future_to_trainee[future]
                    logger.exception(f"Error processing trainee {trainee.id}: {e}")

        matches_created = 0
        sorted_results = sorted(results, key=lambda item: item['total_percentage'], reverse=True)
        recommendation_limit = max(0, job.available_openings)
        for rank, res in enumerate(sorted_results, 1):
            trainee = res['trainee']
            # Use first preferred location as trainee_location in match record
            trainee_display_location = ''
            if trainee.userInfo:
                trainee_display_location = trainee.userInfo.preferred_location_1 or ''
            try:
                with transaction.atomic():
                    match, created = Match.objects.update_or_create(
                        job_ref=job,
                        trainee_ref=trainee,
                        defaults={
                            'trainee_name': trainee.userInfo.name if trainee.userInfo else '',
                            'trainee_location': trainee_display_location,
                            'trainee_id': trainee.userInfo.userId if trainee.userInfo else '',
                            'job_id': job.id,
                            'job_title': job.project_name,
                            'skills_percentage': res['skills_percentage'],
                            'location_percentage': res['location_percentage'],
                            'experience_percentage': res['experience_percentage'],
                            'availability_percentage': res['availability_percentage'],
                            'total_percentage': res['total_percentage'],
                            'bucket': res['bucket'],
                            'distance': res['distance'],
                            'matched_skills': res['matched_skills'] or [],
                            'matched_location': res['matched_location'] or '',
                            'is_recommended': rank <= recommendation_limit and res['bucket'] != 'NO_MATCH',
                            'rank': rank,
                        }
                    )
                    if created:
                        matches_created += 1
            except Exception as e:
                logger.exception(f"Error saving match for trainee {trainee.id}: {e}")

        logger.info(f"  ✓ Job '{job.project_name}': {matches_created} matches created/updated")

        job.matches = Match.objects.filter(job_ref=job).count()
        job.save(update_fields=['matches'])
        logger.info(f"  Job '{job.project_name}' now has {job.matches} total matches.")

        if job.course:
            for owner in job.course.owners.all():
                recommended_count = Match.objects.filter(job_ref=job, is_recommended=True).count()
                if recommended_count:
                    Notification.objects.create(
                        recipient=owner,
                        notification_type='matches_found',
                        title=f"{job.course.name} JD candidates ready",
                        message=(
                            f"{job.course.name} JD has {job.openings} openings. "
                            f"Top {recommended_count} matching candidates have been identified and are ready for review."
                        ),
                        payload={'job_id': job.id, 'course_id': job.course_id, 'recommended_count': recommended_count},
                    )

    logger.info("✓ Matching engine finished successfully.")
    return True


def clear_embedding_cache():
    """Clear all embedding caches."""
    global _skill_embedding_cache, _trainee_embedding_cache
    _skill_embedding_cache.clear()
    _trainee_embedding_cache.clear()
    logger.info("Embedding caches cleared.")