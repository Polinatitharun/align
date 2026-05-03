from rest_framework import serializers
from .models import (
    User, UserInfo, ProfileRecord, Strength, Weakness, Job, Match,
    Recommendation, InterviewLock, InterviewFeedback,
    ManagerChatSession, ManagerChatMessage, TraineeSelfAssessment
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

# ---------- Custom JWT with time‑based access check ----------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Try email login
        login_value = attrs.get(self.username_field)
        try:
            user = User.objects.get(email=login_value)
            attrs[self.username_field] = user.username
        except User.DoesNotExist:
            pass

        data = super().validate(attrs)
        user = self.user

        # Time‑based access for interviewers
        if user.role == 'interviewer':
            from django.utils import timezone
            now = timezone.now()
            if user.access_start and now < user.access_start:
                raise serializers.ValidationError("Your access has not started yet.")
            if user.access_end and now > user.access_end:
                raise serializers.ValidationError("Your access has expired.")
        return data


# ---------- User Serializers ----------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active',
                  'access_start', 'access_end']


class AddUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role',
                  'access_start', 'access_end']
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class EditUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'is_active',
                  'access_start', 'access_end']


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
    class Meta:
        model = UserInfo
        fields = '__all__'


class ProfileRecordSerializer(serializers.ModelSerializer):
    userInfo = UserInfoSerializer()
    strengths = StrengthSerializer(many=True, required=False)
    weaknesses = WeaknessSerializer(many=True, required=False)

    class Meta:
        model = ProfileRecord
        fields = ['id', 'external_id', 'upskillCourses', 'certificates', 'userInfo',
                  'batchRank', 'groupRank', 'dpi', 'batch_name', 'strengths', 'weaknesses',
                  'created_at', 'updated_at']

    def create(self, validated_data):
        user_info_data = validated_data.pop('userInfo')
        strengths_data = validated_data.pop('strengths', [])
        weaknesses_data = validated_data.pop('weaknesses', [])

        user_id = user_info_data.get('userId')
        if user_id:
            user_info, _ = UserInfo.objects.update_or_create(
                userId=user_id, defaults=user_info_data
            )
        else:
            user_info = UserInfo.objects.create(**user_info_data)

        profile = ProfileRecord.objects.create(userInfo=user_info, **validated_data)

        for s in strengths_data:
            Strength.objects.create(profile=profile, **s)
        for w in weaknesses_data:
            Weakness.objects.create(profile=profile, **w)

        return profile

    def update(self, instance, validated_data):
        user_info_data = validated_data.pop('userInfo', None)
        strengths_data = validated_data.pop('strengths', None)
        weaknesses_data = validated_data.pop('weaknesses', None)

        if user_info_data and instance.userInfo:
            for attr, val in user_info_data.items():
                setattr(instance.userInfo, attr, val)
            instance.userInfo.save()

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
    class Meta:
        model = Job
        fields = '__all__'


# ---------- Match Serializers ----------
class MatchListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = '__all__'


# ---------- Recommendation Serializers ----------
class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = '__all__'


# ---------- Interview Lock Serializers ----------
class InterviewLockSerializer(serializers.ModelSerializer):
    trainee_name = serializers.CharField(source='trainee.userInfo.name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)

    class Meta:
        model = InterviewLock
        fields = '__all__'


class InterviewLockCreateSerializer(serializers.Serializer):
    trainee_ids = serializers.ListField(child=serializers.CharField())
    job_id = serializers.IntegerField()
    interview_datetime = serializers.DateTimeField()
    comments = serializers.CharField(required=False, allow_blank=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)

    def to_internal_value(self, data):
        if isinstance(data.get('trainee_ids'), dict):
            data['trainee_ids'] = list(data['trainee_ids'].values())
        return super().to_internal_value(data)


# ---------- Interview Feedback Serializers ----------
class InterviewFeedbackSerializer(serializers.ModelSerializer):
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