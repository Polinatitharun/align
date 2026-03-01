from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator

class User(AbstractUser):
    ROLE_CHOICES = (
        ('trainee', 'Trainee'),
        ('ta', 'TA'),
        ('manager', 'Manager'),
        ('hr', 'HR'),
        ('admin', 'Admin'),
        ('interviewer','Interviewer')
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)




# models.py - Job Model
from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class Job(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('filled', 'Filled'),
        ('expired', 'Expired')
    ]
    
    title = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    location = models.JSONField()  # Store as JSON array
    openings = models.IntegerField(default=1)
    filled = models.IntegerField(default=0)
    matches = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    description = models.TextField()
    requirements = models.TextField()
    techSkills = models.JSONField(default=list)  # Store as JSON array
    softSkills = models.JSONField(default=list)  # Store as JSON array
    salary = models.CharField(max_length=100, blank=True, null=True)
    postedDate = models.DateField(auto_now_add=True)
    expiryDate = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=True, help_text="Public jobs are visible to associates")
    def __str__(self):
        return f"{self.title} - {self.department}"
    
    class Meta:
        ordering = ['-created_at']
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def available_openings(self):
        return self.openings - self.filled



class UserInfo(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True, blank=True)
    userId = models.CharField(max_length=64, unique=False)  # stored as string
    averageScore = models.FloatField(null=True, blank=True)
    employeeId = models.CharField(max_length=64, null=True, blank=True)
    isu = models.CharField(max_length=255, null=True, blank=True)
    isMapped = models.BooleanField(default = False)
    projectId = models.CharField(max_length=255, null=True, blank=True,default=None)
    projectName = models.CharField(max_length=255, null=True, blank=True,default=None)
    email = models.EmailField(null=True, blank=True)
    # link back to parent via OneToOne (enforced in ProfileRecord)
    # Created implicitly via OneToOne in ProfileRecord


class ProfileRecord(models.Model):
    id = models.BigAutoField(primary_key=True)

    # if your incoming JSON has "id" numeric as key, we can store it in a field
    external_id = models.IntegerField(null=True, blank=True, unique=True)

    upskillCourses = models.JSONField(null=True, blank=True)
    certificates = models.JSONField(null=True, blank=True)

    userInfo = models.OneToOneField(UserInfo, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)

    batchRank = models.CharField(max_length=32, null=True, blank=True)  # e.g., "482/565"
    groupRank = models.CharField(max_length=32, null=True, blank=True)  # e.g., "18/24"
    dpi = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0)])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Strength(models.Model):
    profile = models.ForeignKey(ProfileRecord, on_delete=models.CASCADE, related_name='strengths')
    courseName = models.CharField(max_length=255)
    avgScore = models.FloatField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['profile', 'courseName']),
        ]


class Weakness(models.Model):
    profile = models.ForeignKey(ProfileRecord, on_delete=models.CASCADE, related_name='weaknesses')
    courseName = models.CharField(max_length=255)
    avgScore = models.FloatField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['profile', 'courseName']),
        ]

class Recommendation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        ACCEPTED = 'Accepted', 'Accepted'
        REJECTED = 'Rejected', 'Rejected'
        CANCELLED = 'Cancelled', 'Cancelled'

    trainee_id = models.CharField(max_length=36)
    job_id = models.IntegerField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Recommendation #{self.pk} (trainee={self.trainee_id}, job={self.job_id}, status={self.status})"




class Match(models.Model):
    BUCKET_CHOICES = [
        ('PERFECT_MATCH', 'Perfect Match'),
        ('SKILLS_ONLY', 'Skills Only'),
        ('LOCATION_ONLY', 'Location Only'),
        ('NEARBY', 'Nearby'),
        ('NO_MATCH', 'No Match'),
    ]

    # --- Relationships (Foreign Keys) ---
    # We link to Job and ProfileRecord so Django knows the relationships
    job_ref = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='match_results')
    trainee_ref = models.ForeignKey(ProfileRecord, on_delete=models.CASCADE, related_name='job_matches')

    # --- Stored Details (Snapshot Fields as requested) ---
    # Data from UserInfo table
    trainee_name = models.CharField(max_length=255)       # Stores UserInfo.name
    trainee_location = models.CharField(max_length=255, null=True, blank=True) # Stores UserInfo.location
    trainee_id = models.CharField(max_length=64)          # Stores UserInfo.userId (or UserInfo.id)

    # Data from Job table
    job_id = models.IntegerField()                        # Explicitly storing Job ID
    job_title = models.CharField(max_length=200)          # Stores Job.title

    # --- Scoring & Classification ---
    skills_percentage = models.FloatField(default=0.0)    # Skills %
    location_percentage = models.FloatField(default=0.0)  # Location %
    total_percentage = models.FloatField(default=0.0)     # Total %
    
    bucket = models.CharField(max_length=50, choices=BUCKET_CHOICES, default='NO_MATCH')
    
    distance=models.FloatField(default=9999.0)
    matched_skills=models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures a trainee is not matched to the same job twice (optional but recommended)
        unique_together = ('job_ref', 'trainee_ref')
        ordering = ['-total_percentage']

    def __str__(self):
        return f"{self.trainee_name} -> {self.job_title} ({self.bucket})"

        # models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class InterviewLock(models.Model):
    STATUS_CHOICES = [
        ('locked', 'Locked for Interview'),
        ('selected', 'Selected'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    trainee = models.ForeignKey('ProfileRecord', on_delete=models.CASCADE, related_name='interview_locks')
    job = models.ForeignKey('Job', on_delete=models.CASCADE, related_name='interview_locks')
    locked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='locked_interviews')
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_interviews'
    )
    interview_datetime = models.DateTimeField()
    comments = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='locked')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('trainee', 'job')
        ordering = ['-created_at']


class InterviewFeedback(models.Model):
    lock = models.OneToOneField(
        InterviewLock,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    interviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='given_feedbacks'
    )
    feedback_date = models.DateTimeField(auto_now_add=True)

    questions_asked = models.PositiveIntegerField(default=0)
    questions_answered = models.PositiveIntegerField(default=0)
    attitude_rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text="Rating from 1 (poor) to 5 (excellent)"
    )
    behaviour_notes = models.TextField(blank=True)
    technical_skills_assessed = models.JSONField(default=list)
    strengths = models.TextField(blank=True)
    weaknesses = models.TextField(blank=True)
    upskill_needed = models.TextField(blank=True)
    overall_comments = models.TextField(blank=True)
    recommendation = models.CharField(
        max_length=10,
        choices=[('selected', 'Selected'), ('rejected', 'Rejected')]
    )

    def __str__(self):
        return f"Feedback for {self.lock.trainee.userInfo.name} - {self.recommendation}"