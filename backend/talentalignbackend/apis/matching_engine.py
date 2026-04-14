# apis/matching_engine.py

import logging
import threading
from math import radians, cos, sin, asin, sqrt
from django.db import transaction
from .models import Job, ProfileRecord, Match

# ---------- LLM Setup ----------
try:
    from langchain_community.llms import Ollama
    llm = Ollama(model="llama3")  # or "mistral", "gemma", etc.
except ImportError:
    # Fallback if langchain is not installed
    llm = None
    logging.warning("LangChain not installed. AI features will be limited.")

def clean(text):
    """Strip whitespace and remove extra newlines."""
    return text.strip() if text else ""

logger = logging.getLogger(__name__)

# ---------- Haversine Distance ----------
def haversine(lon1, lat1, lon2, lat2):
    """Calculate the great-circle distance between two points in kilometers."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Earth radius in km
    return c * r

# ---------- Geocoding (mock) ----------
def geocode_city(city_name):
    """Return (lat, lon) for known Indian cities. Extend as needed."""
    coords = {
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
    return coords.get(city_name.lower(), (None, None))

# ---------- Matching Engine ----------
def run_matching_logic(job_id=None):
    """
    Run matching for a specific job or all active jobs.
    - Only considers trainees from the job's batch (if batch_name is set).
    - Uses update_or_create to avoid duplicate entries.
    """
    if job_id:
        jobs = Job.objects.filter(id=job_id, status='active')
    else:
        jobs = Job.objects.filter(status='active')

    if not jobs.exists():
        logger.info("No active jobs to match.")
        return False

    for job in jobs:
        logger.info(f"Processing job: {job.title} (Batch: {job.batch_name or 'None'})")

        # Filter trainees by job's batch
        trainees = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses')
        if job.batch_name:
            trainees = trainees.filter(batch_name=job.batch_name)
            logger.info(f"  Filtered trainees to batch: {job.batch_name}")

        if not trainees.exists():
            logger.info(f"  No trainees found in this batch.")
            continue

        job_locations = job.location if isinstance(job.location, list) else [job.location]
        job_coords_list = [geocode_city(loc) for loc in job_locations]
        job_coords_list = [c for c in job_coords_list if c[0] is not None]

        job_tech_skills = set(job.techSkills or [])
        job_soft_skills = set(job.softSkills or [])

        for trainee in trainees:
            trainee_location = trainee.userInfo.location if trainee.userInfo else None
            trainee_skills = set(s.courseName for s in trainee.strengths.all())

            # Skill match
            if job_tech_skills:
                matched_skills = job_tech_skills.intersection(trainee_skills)
                skills_percentage = (len(matched_skills) / len(job_tech_skills)) * 100
            else:
                matched_skills = set()
                skills_percentage = 0.0

            # Location match
            trainee_coords = geocode_city(trainee_location) if trainee_location else (None, None)
            location_percentage = 0.0
            distance = 9999.0
            if trainee_coords[0] is not None and job_coords_list:
                min_dist = min(haversine(jc[1], jc[0], trainee_coords[1], trainee_coords[0]) for jc in job_coords_list)
                distance = min_dist
                if min_dist <= 50:
                    location_percentage = 100.0
                elif min_dist <= 200:
                    location_percentage = 80 + (200 - min_dist) / 150 * 20
                elif min_dist <= 500:
                    location_percentage = 50 + (500 - min_dist) / 300 * 30
                else:
                    location_percentage = 0.0

            total_percentage = (skills_percentage + location_percentage) / 2

            # Bucket assignment
            if skills_percentage >= 80 and location_percentage >= 80:
                bucket = 'PERFECT_MATCH'
            elif skills_percentage >= 50 and location_percentage < 50:
                bucket = 'SKILLS_ONLY'
            elif location_percentage >= 50 and skills_percentage < 50:
                bucket = 'LOCATION_ONLY'
            elif 30 <= location_percentage < 50:
                bucket = 'NEARBY'
            else:
                bucket = 'NO_MATCH'

            # Create or update match record
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
                        'skills_percentage': skills_percentage,
                        'location_percentage': location_percentage,
                        'total_percentage': total_percentage,
                        'bucket': bucket,
                        'distance': distance,
                        'matched_skills': list(matched_skills),
                    }
                )
                action = "Created" if created else "Updated"
                logger.info(f"   👤 {trainee.userInfo.name} -> {bucket} (skills: {skills_percentage:.1f}%, loc: {location_percentage:.1f}%) [{action}]")

        # Update job's match count
        job.matches = Match.objects.filter(job_ref=job).count()
        job.save(update_fields=['matches'])

    logger.info("Matching engine finished.")
    return True