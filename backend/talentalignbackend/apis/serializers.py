from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'is_active',
            'date_joined'
        ]
    

class AddUserSerializer(serializers.ModelSerializer):
    # password = serializers.CharField(write_only=True,required=False)
#     first_name = serializers.CharField(allow_blank=True,required=False)
#     last_name = serializers.CharField(allow_blank=True,required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        # password=validated_data.pop('password','Tcs#1234')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            is_active=True
        )
        return user


class EditUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']

class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6)


class ExcelUserRowSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()
    role = serializers.ChoiceField(
        choices=['trainee', 'ta', 'manager', 'hr', 'admin']
    )





# serializers.py - Job Serializer
from rest_framework import serializers
from .models import Job
from django.contrib.auth import get_user_model

User = get_user_model()

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'department',
            'location',
            'openings',
            'filled',
            'matches',
            'status',
            'description',
            'requirements',
            'techSkills',
            'softSkills',
            'salary',
            'postedDate',
            'expiryDate',
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def create(self, validated_data):
        # Set the created_by user from request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        # Ensure location, techSkills, and softSkills are lists
        for field in ['location', 'techSkills', 'softSkills']:
            if field in validated_data and not isinstance(validated_data[field], list):
                if isinstance(validated_data[field], str):
                    validated_data[field] = [item.strip() for item in validated_data[field].split(',') if item.strip()]
                else:
                    validated_data[field] = []
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Ensure location, techSkills, and softSkills are lists
        for field in ['location', 'techSkills', 'softSkills']:
            if field in validated_data and not isinstance(validated_data[field], list):
                if isinstance(validated_data[field], str):
                    validated_data[field] = [item.strip() for item in validated_data[field].split(',') if item.strip()]
        
        return super().update(instance, validated_data)

from rest_framework import serializers
from .models import ProfileRecord, UserInfo, Strength, Weakness

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInfo
        fields = ['name', 'location', 'userId', 'averageScore', 'employeeId', 'isu','isMapped','projectId','projectName']
        read_only_fields = ['isMapped','projectId','projectName']

class StrengthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Strength
        fields = ['courseName', 'avgScore']


class WeaknessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Weakness
        fields = ['courseName', 'avgScore']


class ProfileRecordSerializer(serializers.ModelSerializer):
    userInfo = UserInfoSerializer(required=False, allow_null=True)
    strengths = StrengthSerializer(many=True, required=False)
    weaknesses = WeaknessSerializer(many=True, required=False)

    # map incoming "id" into external_id, while returning both
    id = serializers.IntegerField(source='external_id', required=False)

    class Meta:
        model = ProfileRecord
        fields = [
            'id',                # maps to external_id internally
            'upskillCourses',
            'certificates',
            'userInfo',
            'strengths',
            'weaknesses',
            'batchRank',
            'groupRank',
            'dpi',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        strengths_data = validated_data.pop('strengths', [])
        weaknesses_data = validated_data.pop('weaknesses', [])
        user_info_data = validated_data.pop('userInfo', None)

        # handle external id
        external_id = validated_data.pop('external_id', None)

        # create or get profile by external_id if provided (idempotent upsert)
        if external_id is not None:
            profile, _created = ProfileRecord.objects.update_or_create(
                external_id=external_id,
                defaults=validated_data
            )
        else:
            profile = ProfileRecord.objects.create(**validated_data)

        # userInfo
        if user_info_data:
            ui = UserInfo.objects.create(**user_info_data)
            profile.userInfo = ui
            profile.save()
        else:
            profile.userInfo = None
            profile.save()

        # strengths & weaknesses
        Strength.objects.filter(profile=profile).delete()
        Weakness.objects.filter(profile=profile).delete()

        Strength.objects.bulk_create([
            Strength(profile=profile, **s) for s in strengths_data
        ])
        Weakness.objects.bulk_create([
            Weakness(profile=profile, **w) for w in weaknesses_data
        ])

        return profile

    def update(self, instance, validated_data):
        strengths_data = validated_data.pop('strengths', None)
        weaknesses_data = validated_data.pop('weaknesses', None)
        user_info_data = validated_data.pop('userInfo', None)

        # update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # update userInfo
        if user_info_data is not None:
            if instance.userInfo:
                for attr, value in user_info_data.items():
                    setattr(instance.userInfo, attr, value)
                instance.userInfo.save()
            else:
                instance.userInfo = UserInfo.objects.create(**user_info_data)
                instance.save()

        # replace lists if provided
        if strengths_data is not None:
            Strength.objects.filter(profile=instance).delete()
            Strength.objects.bulk_create([
                Strength(profile=instance, **s) for s in strengths_data
            ])

        if weaknesses_data is not None:
            Weakness.objects.filter(profile=instance).delete()
            Weakness.objects.bulk_create([
                Weakness(profile=instance, **w) for w in weaknesses_data
            ])

        return instance


class ProfileRecordListSerializer(ProfileRecordSerializer):
    """Same as detail; kept for future custom list fields if needed."""
    pass


# Bulk serializer for uploading an array of JSONs at once
class BulkProfileRecordsSerializer(serializers.ListSerializer):
    child = ProfileRecordSerializer()

    def create(self, validated_data):
        # Create each record using ProfileRecordSerializer's create
        created = []
        for item in validated_data:
            created.append(self.child.create(item))
        return created


from .models import Recommendation

# Map various inputs (case-insensitive; includes "accepeted" typo) to valid choices.
_STATUS_MAP = {
    'pending': Recommendation.Status.PENDING,
    'accepted': Recommendation.Status.ACCEPTED,
    'accepeted': Recommendation.Status.ACCEPTED,  # typo handled
    'rejected': Recommendation.Status.REJECTED,
    'cancelled': Recommendation.Status.CANCELLED,
    'canceled': Recommendation.Status.CANCELLED,  # US spelling also allowed
}

class RecommendationSerializer(serializers.ModelSerializer):
    # Map JSON keys to model fields
    traineeId = serializers.CharField(source='trainee_id')
    jobId     = serializers.IntegerField(source='job_id')

    # Status choice with custom validation/normalization
    status = serializers.CharField()

    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Recommendation
        fields = ('id', 'traineeId', 'jobId', 'status', 'createdAt', 'updatedAt')

    def validate_status(self, value: str):
        normalized = (value or '').strip().lower()
        if normalized in _STATUS_MAP:
            return _STATUS_MAP[normalized]
        allowed = ', '.join([c for c in Recommendation.Status.values])
        raise serializers.ValidationError(f"Invalid status '{value}'. Allowed: {allowed}")

    def to_representation(self, instance):
        # Keep output exactly as requested (title-case values)
        data = super().to_representation(instance)
        # Ensure status is title-cased from DB value
        data['status'] = instance.status
        return data

    def create(self, validated_data):
        # validated_data keys are model field names because of source='...'
        return Recommendation.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance





from rest_framework import serializers
from .models import Match, Job, ProfileRecord, UserInfo

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = [
            'id', 
            'job_ref', 
            'trainee_ref',
            'trainee_name', 
            'trainee_location', 
            'trainee_id', 
            'job_id', 
            'job_title', 
            'skills_percentage', 
            'location_percentage', 
            'total_percentage', 
            'bucket',
            'distance',
            'matched_skills',
            'created_at'
        ]
        # These fields are read-only because they are auto-populated from the relations
        read_only_fields = [
            'trainee_name', 
            'trainee_location', 
            'trainee_id', 
            'job_id', 
            'job_title'
        ]

    def create(self, validated_data):
        # 1. Get the Job and Trainee instances from the validated data
        job_instance = validated_data.get('job_ref')
        trainee_instance = validated_data.get('trainee_ref')

        # 2. Auto-populate Job details
        validated_data['job_id'] = job_instance.id
        validated_data['job_title'] = job_instance.title

        # 3. Auto-populate Trainee details (fetching from the linked UserInfo)
        # Note: We access .userInfo because ProfileRecord has a OneToOne to UserInfo
        if trainee_instance.userInfo:
            validated_data['trainee_name'] = trainee_instance.userInfo.name
            validated_data['trainee_location'] = trainee_instance.userInfo.location
            validated_data['trainee_id'] = trainee_instance.userInfo.userId
        else:
            # Fallback if UserInfo is missing
            validated_data['trainee_name'] = "Unknown"
            validated_data['trainee_location'] = "Unknown"
            validated_data['trainee_id'] = str(trainee_instance.external_id)

        # 4. Create and return the Match object
        return super().create(validated_data)


#getting trainee

class MatchListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = [
            'id', 
            'trainee_name', 
            'trainee_location', 
            'trainee_id', 
            'skills_percentage', 
            'location_percentage', 
            'total_percentage', 
            'bucket',

            'distance',
            'matched_skills',
            'created_at'
        ]



# ... ALL YOUR EXISTING SERIALIZERS ABOVE ...

# KEEP all of these existing serializers:
# - UserInfoSerializer (with updated fields)
# - StrengthSerializer
# - WeaknessSerializer
# - ProfileRecordSerializer
# - ProfileRecordListSerializer
# - BulkProfileRecordsSerializer
# - RecommendationSerializer
# - MatchSerializer
# - MatchListSerializer

# ADD this NEW serializer at the END:
class UserInfoMappingSerializer(serializers.ModelSerializer):
    """Serializer specifically for updating mapping fields"""
    class Meta:
        model = UserInfo
        fields = ['isMapped', 'projectId', 'projectName']


# serializers.py
from rest_framework import serializers
from .models import Job, InterviewLock

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'

class InterviewLockSerializer(serializers.ModelSerializer):
    trainee_name = serializers.CharField(source='trainee.userInfo.name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.username', read_only=True)

    class Meta:
        model = InterviewLock
        fields = '__all__'

class InterviewLockCreateSerializer(serializers.Serializer):
    """For creating multiple locks at once"""
    trainee_ids = serializers.ListField(child=serializers.IntegerField())
    job_id = serializers.IntegerField()
    interview_datetime = serializers.DateTimeField()
    comments = serializers.CharField(required=False, allow_blank=True)

