from rest_framework import serializers
from .models import (
    User, Course, Batch, UserInfo, ProfileRecord, Strength, Weakness, Job, Match,
    Recommendation, InterviewLock, InterviewFeedback,
    ManagerChatSession, ManagerChatMessage, TraineeSelfAssessment,
    Notification, AuditLog, Consent
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

# ---------- Custom JWT with time‑based access check ----------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        login_value = attrs.get(self.username_field)
        try:
            user = User.objects.get(email=login_value)
            attrs[self.username_field] = user.username
        except User.DoesNotExist:
            pass

        data = super().validate(attrs)
        user = self.user

        if user.role == 'interviewer':
            from django.utils import timezone
            now = timezone.now()
            if user.access_start and now < user.access_start:
                raise serializers.ValidationError("Your access has not started yet.")
            if user.access_end and now > user.access_end:
                raise serializers.ValidationError("Your access has expired.")
        return data


# ---------- Batch & Course Serializers ----------
class CourseSerializer(serializers.ModelSerializer):
    owners = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='course_owner'), many=True)

    class Meta:
        model = Course
        fields = '__all__'


class BatchSerializer(serializers.ModelSerializer):
    batch_uuid = serializers.CharField(required=False, validators=[])
    batchUuid = serializers.CharField(source='batch_uuid', read_only=True)
    batchName = serializers.CharField(source='batch_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    trainees_count = serializers.SerializerMethodField()
    jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = '__all__'
        extra_kwargs = {
            'batch_uuid': {'validators': []}
        }

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'batchUuid' in data_copy and 'batch_uuid' not in data_copy:
            data_copy['batch_uuid'] = data_copy.get('batchUuid')
        if 'batchName' in data_copy and 'batch_name' not in data_copy:
            data_copy['batch_name'] = data_copy.get('batchName')
        if 'startDate' in data_copy and 'start_date' not in data_copy:
            data_copy['start_date'] = data_copy.get('startDate')
        if 'endDate' in data_copy and 'end_date' not in data_copy:
            data_copy['end_date'] = data_copy.get('endDate')
        return super().to_internal_value(data_copy)

    def get_trainees_count(self, obj):
        return obj.profiles.count() if hasattr(obj, 'profiles') else 0

    def get_jobs_count(self, obj):
        return obj.jobs.count() if hasattr(obj, 'jobs') else 0


class UserSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active',
                  'course', 'course_name', 'access_start', 'access_end']


class AddUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role',
                  'course', 'access_start', 'access_end']
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class EditUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'is_active',
                  'course', 'access_start', 'access_end']


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)


# ---------- Trainee Profile Serializers ----------
class StrengthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Strength
        fields = ['courseName', 'avgScore']


class WeaknessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Weakness
        fields = ['courseName', 'avgScore']


class UserInfoSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    batch_name = serializers.CharField(source='batch.batch_name', read_only=True)
    batch_uuid = serializers.CharField(source='batch.batch_uuid', read_only=True)
    batchUuid = serializers.CharField(source='batch.batch_uuid', read_only=True)
    batch_id = serializers.IntegerField(source='batch.id', read_only=True)
    name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    userId = serializers.CharField(required=True, validators=[])
    location = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    employeeId = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    isu = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    averageScore = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = UserInfo
        fields = '__all__'
        extra_kwargs = {
            'userId': {'validators': []}
        }


class ProfileRecordSerializer(serializers.ModelSerializer):
    userInfo = UserInfoSerializer(required=False, allow_null=True)
    strengths = StrengthSerializer(many=True, required=False)
    weaknesses = WeaknessSerializer(many=True, required=False)
    external_id = serializers.IntegerField(required=False, allow_null=True, validators=[])
    groupName = serializers.CharField(source='group_name', required=False, allow_null=True, allow_blank=True)
    batchName = serializers.CharField(source='batch_name', read_only=True)
    batch_name = serializers.CharField(read_only=True)
    batch_uuid = serializers.CharField(read_only=True)
    batchUuid = serializers.CharField(source='batch_uuid', read_only=True)
    batch_id = serializers.IntegerField(source='batch.id', read_only=True)

    class Meta:
        model = ProfileRecord
        fields = ['id', 'external_id', 'upskillCourses', 'certificates', 'userInfo',
                  'batchRank', 'groupRank', 'dpi', 'batch', 'batch_id', 'batch_name', 'batch_uuid', 'batchUuid', 'group_name',
                  'groupName', 'batchName', 'strengths', 'weaknesses',
                  'created_at', 'updated_at']
        extra_kwargs = {
            'external_id': {'validators': []}
        }

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'external_id' not in data_copy and 'externalId' in data_copy:
            data_copy['external_id'] = data_copy.get('externalId')
        if 'groupName' in data_copy and 'group_name' not in data_copy:
            data_copy['group_name'] = data_copy.get('groupName')
        if 'batch' not in data_copy or not data_copy.get('batch'):
            raw_uuid = data_copy.get('batch_uuid') or data_copy.get('batchUuid')
            raw_batch = data_copy.get('batchName') or data_copy.get('batch_name') or data_copy.get('batch_id') or raw_uuid
            if raw_batch or raw_uuid:
                from .models import Batch
                b = None
                if raw_uuid:
                    b = Batch.objects.filter(batch_uuid=str(raw_uuid).strip()).first()
                if not b and raw_batch:
                    raw_str = str(raw_batch).strip()
                    if raw_str and raw_str.lower() not in ('none', 'null', 'undefined', 'all'):
                        b = Batch.objects.filter(batch_uuid=raw_str).first()
                        if not b and raw_str.isdigit():
                            b = Batch.objects.filter(id=int(raw_str)).first()
                        if not b:
                            b = Batch.objects.filter(batch_name__iexact=raw_str).first()
                        if not b:
                            name_to_use = str(raw_batch).strip() if raw_batch else str(raw_uuid).strip()
                            if raw_uuid:
                                b = Batch.objects.create(batch_uuid=str(raw_uuid).strip(), batch_name=name_to_use)
                            else:
                                b = Batch.objects.create(batch_name=name_to_use)
                if b:
                    data_copy['batch'] = b.id
        return super().to_internal_value(data_copy)

    def create(self, validated_data):
        user_info_data = validated_data.pop('userInfo', None)
        strengths_data = validated_data.pop('strengths', [])
        weaknesses_data = validated_data.pop('weaknesses', [])
        external_id = validated_data.pop('external_id', None)
        batch = validated_data.get('batch')

        user_info = None
        if user_info_data:
            if batch and 'batch' not in user_info_data:
                user_info_data['batch'] = batch
            user_id = user_info_data.get('userId')
            if user_id:
                user_info, _ = UserInfo.objects.update_or_create(
                    userId=user_id, defaults=user_info_data
                )
            else:
                user_info = UserInfo.objects.create(**user_info_data)

        # Profile is uniquely owned by its UserInfo
        profile = None
        if user_info:
            profile = ProfileRecord.objects.filter(userInfo=user_info).first()

        # Handle external_id safely without colliding across users
        if external_id is not None:
            existing_with_ext = ProfileRecord.objects.filter(external_id=external_id).first()
            if not existing_with_ext or (profile and existing_with_ext.id == profile.id):
                validated_data['external_id'] = external_id

        if profile:
            for attr, val in validated_data.items():
                setattr(profile, attr, val)
            if user_info:
                profile.userInfo = user_info
            profile.save()
        else:
            profile = ProfileRecord.objects.create(userInfo=user_info, **validated_data)

        if strengths_data is not None:
            profile.strengths.all().delete()
            for s in strengths_data:
                Strength.objects.create(profile=profile, **s)

        if weaknesses_data is not None:
            profile.weaknesses.all().delete()
            for w in weaknesses_data:
                Weakness.objects.create(profile=profile, **w)

        return profile

    def update(self, instance, validated_data):
        user_info_data = validated_data.pop('userInfo', None)
        strengths_data = validated_data.pop('strengths', None)
        weaknesses_data = validated_data.pop('weaknesses', None)

        if user_info_data:
            if instance.userInfo:
                for attr, val in user_info_data.items():
                    setattr(instance.userInfo, attr, val)
                instance.userInfo.save()
            else:
                user_id = user_info_data.get('userId')
                if user_id:
                    user_info, _ = UserInfo.objects.update_or_create(userId=user_id, defaults=user_info_data)
                    instance.userInfo = user_info

        if strengths_data is not None:
            instance.strengths.all().delete()
            for s in strengths_data:
                Strength.objects.create(profile=instance, **s)

        if weaknesses_data is not None:
            instance.weaknesses.all().delete()
            for w in weaknesses_data:
                Weakness.objects.create(profile=instance, **w)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        return instance


# ---------- Job Serializers ----------
class JobSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source='bg', read_only=True)
    techSkills = serializers.SerializerMethodField()
    softSkills = serializers.SerializerMethodField()
    remaining_count = serializers.IntegerField(read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    batch_name = serializers.CharField(source='batch.batch_name', read_only=True)
    batch_uuid = serializers.CharField(source='batch.batch_uuid', read_only=True)
    batchUuid = serializers.CharField(source='batch.batch_uuid', read_only=True)
    batch_id = serializers.IntegerField(source='batch.id', read_only=True)

    class Meta:
        model = Job
        fields = '__all__'

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'batch' not in data_copy or not data_copy.get('batch'):
            raw_uuid = data_copy.get('batch_uuid') or data_copy.get('batchUuid')
            raw_batch = data_copy.get('batchName') or data_copy.get('batch_name') or data_copy.get('batch_id') or raw_uuid
            if raw_batch or raw_uuid:
                from .models import Batch
                b = None
                if raw_uuid:
                    b = Batch.objects.filter(batch_uuid=str(raw_uuid).strip()).first()
                if not b and raw_batch:
                    raw_str = str(raw_batch).strip()
                    if raw_str and raw_str.lower() not in ('none', 'null', 'undefined', 'all'):
                        b = Batch.objects.filter(batch_uuid=raw_str).first()
                        if not b and raw_str.isdigit():
                            b = Batch.objects.filter(id=int(raw_str)).first()
                        if not b:
                            b = Batch.objects.filter(batch_name__iexact=raw_str).first()
                        if not b:
                            name_to_use = str(raw_batch).strip() if raw_batch else str(raw_uuid).strip()
                            if raw_uuid:
                                b = Batch.objects.create(batch_uuid=str(raw_uuid).strip(), batch_name=name_to_use)
                            else:
                                b = Batch.objects.create(batch_name=name_to_use)
                if b:
                    data_copy['batch'] = b.id
        return super().to_internal_value(data_copy)

    def validate_stream(self, value):
        if value:
            from .stream_constants import normalize_to_standard_stream
            return normalize_to_standard_stream(value)
        return value

    def get_techSkills(self, obj):
        skills = getattr(obj, 'skills', '') or ''
        return [skill.strip() for skill in skills.split(',') if skill.strip()]

    def get_softSkills(self, obj):
        return []


# ---------- Match Serializers ----------
class MatchListSerializer(serializers.ModelSerializer):
    dpi = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    preferred_locations = serializers.SerializerMethodField()
    consent_status = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    groupName = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = '__all__'

    def get_dpi(self, obj):
        return getattr(obj.trainee_ref, 'dpi', None) if obj.trainee_ref else None

    def get_group_name(self, obj):
        return getattr(obj.trainee_ref, 'group_name', '') if obj.trainee_ref else ''

    def get_groupName(self, obj):
        return getattr(obj.trainee_ref, 'group_name', '') if obj.trainee_ref else ''

    def get_employee_id(self, obj):
        if obj.trainee_ref and obj.trainee_ref.userInfo:
            return obj.trainee_ref.userInfo.employeeId or obj.trainee_ref.userInfo.userId
        return ''

    def get_email(self, obj):
        if obj.trainee_ref and obj.trainee_ref.userInfo:
            return obj.trainee_ref.userInfo.email or ''
        return ''

    def get_preferred_locations(self, obj):
        if not obj.trainee_ref or not obj.trainee_ref.userInfo:
            return []
        u = obj.trainee_ref.userInfo
        locs = []
        for l in [u.preferred_location_1, u.preferred_location_2, u.preferred_location_3, getattr(u, 'preferred_city', None), getattr(u, 'preferred_state', None)]:
            if l and str(l).strip() and str(l).strip() not in locs:
                locs.append(str(l).strip())
        return locs

    def get_consent_status(self, obj):
        if not obj.trainee_ref:
            return None
        consent = Consent.objects.filter(trainee=obj.trainee_ref, job_id=obj.job_id).first()
        return consent.status if consent else None


class ConsentSerializer(serializers.ModelSerializer):
    trainee_name = serializers.CharField(source='trainee.userInfo.name', read_only=True)
    employee_id = serializers.CharField(source='trainee.userInfo.employeeId', read_only=True)
    batch_name = serializers.CharField(source='trainee.batch_name', read_only=True, default='')
    batch_uuid = serializers.CharField(source='trainee.batch_uuid', read_only=True, default='')
    batchUuid = serializers.CharField(source='trainee.batch_uuid', read_only=True, default='')
    group_name = serializers.CharField(source='trainee.group_name', read_only=True, default='')
    groupName = serializers.CharField(source='trainee.group_name', read_only=True, default='')
    job_title = serializers.CharField(source='job.project_name', read_only=True)
    demand_id = serializers.CharField(source='job.demand_id', read_only=True)
    rgs_id = serializers.CharField(source='job.rgs_id', read_only=True)
    sent_by_username = serializers.CharField(source='sent_by.username', read_only=True)

    class Meta:
        model = Consent
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


# ---------- Recommendation Serializers ----------
class RecommendationSerializer(serializers.ModelSerializer):
    trainee_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    demand_id = serializers.SerializerMethodField()
    trainee_employee_id = serializers.SerializerMethodField()
    trainee_email = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    groupName = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = '__all__'

    def get_trainee_name(self, obj):
        try:
            user_info = UserInfo.objects.get(userId=obj.trainee_id)
            return user_info.name
        except UserInfo.DoesNotExist:
            return None

    def get_job_title(self, obj):
        try:
            job = Job.objects.get(id=obj.job_id)
            return job.project_name
        except Job.DoesNotExist:
            return None

    def get_demand_id(self, obj):
        try:
            job = Job.objects.get(id=obj.job_id)
            return job.demand_id
        except Job.DoesNotExist:
            return None

    def get_trainee_employee_id(self, obj):
        try:
            user_info = UserInfo.objects.get(userId=obj.trainee_id)
            return user_info.employeeId
        except UserInfo.DoesNotExist:
            return None

    def get_trainee_email(self, obj):
        try:
            user_info = UserInfo.objects.get(userId=obj.trainee_id)
            if user_info.employeeId and not user_info.email:
                return f"{user_info.employeeId}@tcs.com"
            return user_info.email
        except UserInfo.DoesNotExist:
            return None

    def get_group_name(self, obj):
        try:
            profile = ProfileRecord.objects.get(userInfo__userId=obj.trainee_id)
            return profile.group_name or ''
        except (ProfileRecord.DoesNotExist, ProfileRecord.MultipleObjectsReturned):
            return ''

    def get_groupName(self, obj):
        return self.get_group_name(obj)


# ---------- Interview Lock Serializers ----------
class InterviewLockSerializer(serializers.ModelSerializer):
    trainee_name = serializers.CharField(source='trainee.userInfo.name', read_only=True)
    job_title = serializers.CharField(source='job.project_name', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    batch_name = serializers.CharField(source='trainee.batch_name', read_only=True, default='')
    batch_uuid = serializers.CharField(source='trainee.batch_uuid', read_only=True, default='')
    batchUuid = serializers.CharField(source='trainee.batch_uuid', read_only=True, default='')
    group_name = serializers.CharField(source='trainee.group_name', read_only=True, default='')
    groupName = serializers.CharField(source='trainee.group_name', read_only=True, default='')
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = InterviewLock
        fields = '__all__'

    def get_feedback(self, obj):
        if hasattr(obj, 'feedback'):
            return InterviewFeedbackSerializer(obj.feedback).data
        return None


class InterviewLockCreateSerializer(serializers.Serializer):
    trainee_ids = serializers.ListField(child=serializers.CharField())
    job_id = serializers.IntegerField()
    interview_datetime = serializers.DateTimeField(required=False, allow_null=True)
    comments = serializers.CharField(required=False, allow_blank=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)

    def to_internal_value(self, data):
        if isinstance(data.get('trainee_ids'), dict):
            data['trainee_ids'] = list(data['trainee_ids'].values())
        return super().to_internal_value(data)


class InterviewUnlockSerializer(serializers.Serializer):
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    job_id = serializers.IntegerField(required=False, allow_null=True)
    interview_datetime = serializers.DateTimeField(required=False)
    comments = serializers.CharField(required=False, allow_blank=True)
    reopen = serializers.BooleanField(default=True)


# ---------- Interview Feedback Serializers ----------
class InterviewFeedbackSerializer(serializers.ModelSerializer):
    interviewer_name = serializers.CharField(source='interviewer.username', read_only=True)
    trainee_name = serializers.CharField(source='lock.trainee.userInfo.name', read_only=True)
    job_title = serializers.CharField(source='lock.job.project_name', read_only=True)
    interview_date = serializers.DateTimeField(source='lock.interview_datetime', read_only=True)

    class Meta:
        model = InterviewFeedback
        fields = '__all__'
        read_only_fields = ('lock', 'interviewer', 'feedback_date')


# ---------- UserInfo Mapping Serializer ----------
class UserInfoMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInfo
        fields = ['isMapped', 'projectId', 'projectName']


# ---------- Manager Chat Serializers ----------
class ManagerChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerChatMessage
        fields = ['id', 'role', 'content', 'timestamp']


class ManagerChatSessionSerializer(serializers.ModelSerializer):
    messages = ManagerChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ManagerChatSession
        fields = ['id', 'session_key', 'created_at', 'updated_at', 'messages']


# ---------- Trainee Self Assessment Serializer ----------
class TraineeSelfAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraineeSelfAssessment
        fields = ['id', 'questions_asked', 'technical_percentage', 'theoretical_percentage', 'question_list', 'submitted_at']
        read_only_fields = ['id', 'submitted_at']


# ---------- Consent Serializers ----------
class ConsentSerializer(serializers.ModelSerializer):
    trainee_name = serializers.SerializerMethodField()
    trainee_employee_id = serializers.SerializerMethodField()
    trainee_email = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.project_name', read_only=True)
    job_location = serializers.CharField(source='job.location', read_only=True)
    job_skills = serializers.CharField(source='job.skills', read_only=True)
    job_openings = serializers.IntegerField(source='job.openings', read_only=True)
    job_stream = serializers.CharField(source='job.stream', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Consent
        fields = [
            'id', 'trainee', 'job', 'status', 'remarks',
            'sent_by', 'sent_at', 'responded_at', 'updated_at',
            'trainee_name', 'trainee_employee_id', 'trainee_email',
            'job_title', 'job_location', 'job_skills', 'job_openings', 'job_stream',
            'sent_by_name',
        ]
        read_only_fields = ['id', 'sent_at', 'responded_at', 'updated_at']

    def get_trainee_name(self, obj):
        return obj.trainee.userInfo.name if obj.trainee and obj.trainee.userInfo else None

    def get_trainee_employee_id(self, obj):
        return obj.trainee.userInfo.employeeId if obj.trainee and obj.trainee.userInfo else None

    def get_trainee_email(self, obj):
        if obj.trainee and obj.trainee.userInfo:
            return obj.trainee.userInfo.email
        return None