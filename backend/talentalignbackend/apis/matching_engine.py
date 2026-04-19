# apis/matching_engine.py
"""
Matching Engine for Talent Align

Calculates match percentages between jobs and trainees based on:
- Skills overlap (percentage of required tech skills the trainee possesses).
- Geographic proximity (distance from trainee's city to the closest job location).

Results are stored in the Match model. The engine respects batch boundaries:
a job only matches with trainees from the same batch (if batch_name is set).
"""

import logging
import time
import requests
from math import radians, cos, sin, asin, sqrt
from django.db import transaction
from django.core.cache import cache
from .models import Job, ProfileRecord, Match

# ---------- LLM Setup (for other AI features, not used in matching) ----------
try:
    from langchain_ollama import Ollama
    llm = Ollama(model="llama3")
except ImportError:
    llm = None
    logging.warning("LangChain not installed. AI features will be limited.")

def clean(text):
    """Strip whitespace and remove extra newlines."""
    return text.strip() if text else ""

logger = logging.getLogger(__name__)

# ---------- Haversine Distance ----------
def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great-circle distance between two points on Earth (in kilometers).
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Earth's radius in km
    return c * r

# ---------- Real Geocoding with Caching ----------
def geocode_city(city_name):
    """
    Convert a city name to (latitude, longitude) using Nominatim (OpenStreetMap).
    Results are cached in Django's cache for 30 days to avoid hitting API limits.
    Falls back to hardcoded coordinates for common Indian cities if the API fails.
    """
    if not city_name:
        return None, None

    city_key = city_name.lower().strip()
    cache_key = f"geocode_{city_key}"

    # Try cache first
    cached = cache.get(cache_key)
    if cached:
        logger.debug(f"Cache hit for {city_name}")
        return cached

    # Nominatim request (be polite: 1 request per second, identify your app)
    headers = {'User-Agent': 'TalentAlign/1.0 (tharunpolinati@gmail.com)'}
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': city_name,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'in'   # optionally restrict to India
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                # Cache for 30 days (in seconds)
                cache.set(cache_key, (lat, lon), 60 * 60 * 24 * 30)
                time.sleep(1)  # respect Nominatim's usage policy
                logger.debug(f"Geocoded {city_name} -> ({lat}, {lon})")
                return lat, lon
            else:
                logger.warning(f"No geocoding results for {city_name}")
        else:
            logger.error(f"Nominatim error {response.status_code} for {city_name}")
    except Exception as e:
        logger.exception(f"Geocoding exception for {city_name}: {e}")

    # Fallback to hardcoded coordinates for major Indian cities
    fallback_coords = {
        'mumbai': (19.0760, 72.8777),
        'delhi': (28.6139, 77.2090),
        'bangalore': (12.9716, 77.5946),
        'hyderabad': (17.3850, 78.4867),
        'chennai': (13.0827, 80.2707),
        'pune': (18.5204, 73.8567),
        'ahmedabad': (23.0225, 72.5714),
        'kolkata': (22.5726, 88.3639),
        'nagpur': (21.1458, 79.0882),
        'lucknow': (26.8467, 80.9462),
        'kochi': (9.9312, 76.2673),
    }
    coords = fallback_coords.get(city_key, (None, None))
    if coords[0]:
        # Cache fallback for a shorter time (7 days)
        cache.set(cache_key, coords, 60 * 60 * 24 * 7)
        logger.info(f"Using fallback coordinates for {city_name}")
    return coords

# ---------- Location Percentage Calculation ----------
def calculate_location_percentage(distance_km):
    """
    Convert distance (km) to a location match percentage.
    - <= 50 km  -> 100%
    - 50-200 km -> 80-99% (linear)
    - 200-500 km -> 50-79% (linear)
    - 500-800 km -> 0-49% (linear)
    - > 800 km   -> 0%
    """
    if distance_km <= 50:
        return 100.0
    elif distance_km <= 200:
        # Scale from 80% at 200 km to 99% at 50 km
        return 80 + (200 - distance_km) / 150 * 20
    elif distance_km <= 500:
        # Scale from 50% at 500 km to 79% at 200 km
        return 50 + (500 - distance_km) / 300 * 30
    elif distance_km <= 800:
        # Scale from 0% at 800 km to 49% at 500 km
        return max(0, 50 - (distance_km - 500) / 300 * 50)
    else:
        return 0.0

# ---------- Matching Engine ----------
def run_matching_logic(job_id=None):
    """
    Main entry point for the matching engine.
    If job_id is provided, matches only that job (if active).
    Otherwise, matches all active jobs.

    For each job:
      - Only considers trainees from the same batch (if job.batch_name is set).
      - For each trainee:
          * Skills % = (matched tech skills / total required tech skills) * 100
          * Location % = based on distance to the closest job location.
          * Total % = average of skills and location.
          * Bucket assigned based on skills and location thresholds.
          * Match record is created or updated (update_or_create).
      - Updates job.matches count.
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

    for job in jobs:
        logger.info(f"Processing job: {job.title} (Batch: {job.batch_name or 'None'})")

        # Filter trainees by job's batch (if specified)
        trainees = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths')
        if job.batch_name:
            trainees = trainees.filter(batch_name=job.batch_name)
            logger.info(f"  Filtered to batch '{job.batch_name}': {trainees.count()} trainees")

        if not trainees.exists():
            logger.info(f"  No trainees found in this batch.")
            continue

        job_locations = job.location if isinstance(job.location, list) else [job.location]
        job_tech_skills = set(job.techSkills or [])

        for trainee in trainees:
            trainee_location = trainee.userInfo.location if trainee.userInfo else None
            trainee_skills = set(s.courseName for s in trainee.strengths.all())

            # ----- 1. Skills Match -----
            if job_tech_skills:
                matched_skills = job_tech_skills.intersection(trainee_skills)
                skills_percentage = (len(matched_skills) / len(job_tech_skills)) * 100
            else:
                matched_skills = set()
                skills_percentage = 0.0

            # ----- 2. Location Match (find closest job location) -----
            trainee_coords = geocode_city(trainee_location) if trainee_location else (None, None)
            best_distance = 9999.0
            best_location = None
            best_location_percentage = 0.0

            if trainee_coords[0] is not None:
                for loc in job_locations:
                    job_coords = geocode_city(loc)
                    if job_coords[0] is not None:
                        dist = haversine(job_coords[1], job_coords[0], trainee_coords[1], trainee_coords[0])
                        loc_perc = calculate_location_percentage(dist)
                        if dist < best_distance:
                            best_distance = dist
                            best_location = loc
                            best_location_percentage = loc_perc

            # If no coordinates could be resolved, distance remains 9999.0 and location % = 0
            if best_location is None:
                best_distance = 9999.0
                best_location_percentage = 0.0

            # ----- 3. Total Percentage -----
            total_percentage = (skills_percentage + best_location_percentage) / 2

            # ----- 4. Bucket Assignment -----
            if skills_percentage >= 80 and best_location_percentage >= 80:
                bucket = 'PERFECT_MATCH'
            elif skills_percentage >= 50:
                bucket = 'SKILLS_ONLY'
            elif best_location_percentage >= 50:
                bucket = 'LOCATION_ONLY'
            elif best_location_percentage >= 30:
                bucket = 'NEARBY'
            else:
                bucket = 'NO_MATCH'

            # ----- 5. Save / Update Match Record -----
            with transaction.atomic():
                match, created = Match.objects.update_or_create(
                    job_ref=job,
                    trainee_ref=trainee,
                    defaults={
                        'trainee_name': trainee.userInfo.name if trainee.userInfo else '',
                        'trainee_location': trainee_location or '',
                        'trainee_id': trainee.userInfo.userId if trainee.userInfo else '',
                        'job_id': job.id,
                        'job_title': job.title,
                        'skills_percentage': round(skills_percentage, 2),
                        'location_percentage': round(best_location_percentage, 2),
                        'total_percentage': round(total_percentage, 2),
                        'bucket': bucket,
                        'distance': round(best_distance, 2),
                        'matched_skills': list(matched_skills),
                        'matched_location': best_location,   # <-- new field
                    }
                )
                action = "Created" if created else "Updated"
                logger.info(
                    f"   👤 {trainee.userInfo.name} -> {bucket} "
                    f"(skills: {skills_percentage:.1f}%, loc: {best_location_percentage:.1f}% "
                    f"from {best_location or 'unknown'}) [{action}]"
                )

        # Update the job's match count
        job.matches = Match.objects.filter(job_ref=job).count()
        job.save(update_fields=['matches'])
        logger.info(f"  Job '{job.title}' now has {job.matches} total matches.")

    logger.info("Matching engine finished.")
    return True