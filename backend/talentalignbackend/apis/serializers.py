

from rest_framework import serializers
from .models import User, UserInfo, ProfileRecord, Strength, Weakness, Job, Match, Recommendation, InterviewLock, InterviewFeedback

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']

# tokens.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Try to find user by email first
        login_value = attrs.get(self.username_field)
        try:
            user = User.objects.get(email=login_value)
            attrs[self.username_field] = user.username
        except User.DoesNotExist:
            # Not an email, keep as username
            pass
        return super().validate(attrs)

class AddUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class EditUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'is_active']

class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

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

# class ProfileRecordSerializer(serializers.ModelSerializer):
#     userInfo = UserInfoSerializer()
#     strengths = StrengthSerializer(many=True, read_only=True)
#     weaknesses = WeaknessSerializer(many=True, read_only=True)

#     class Meta:
#         model = ProfileRecord
#         fields = ['id', 'external_id', 'upskillCourses', 'certificates', 'userInfo',
#                   'batchRank', 'groupRank', 'dpi', 'batch_name', 'strengths', 'weaknesses',
#                   'created_at', 'updated_at']

#     def create(self, validated_data):
#         user_info_data = validated_data.pop('userInfo')
#         # Create or update UserInfo (upsert by userId if provided)
#         user_id = user_info_data.get('userId')
#         if user_id:
#             user_info, _ = UserInfo.objects.update_or_create(
#                 userId=user_id,
#                 defaults=user_info_data
#             )
#         else:
#             user_info = UserInfo.objects.create(**user_info_data)


    #     # Create ProfileRecord
    #     profile = ProfileRecord.objects.create(userInfo=user_info, **validated_data)
    #     return profile

    # def update(self, instance, validated_data):
    #     user_info_data = validated_data.pop('userInfo', None)
    #     if user_info_data and instance.userInfo:
    #         for attr, val in user_info_data.items():
    #             setattr(instance.userInfo, attr, val)
    #         instance.userInfo.save()
    #     return super().update(instance, validated_data)

class ProfileRecordSerializer(serializers.ModelSerializer):
    userInfo = UserInfoSerializer()
    strengths = StrengthSerializer(many=True, required=False)   # removed read_only
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

        # Create/update UserInfo
        user_id = user_info_data.get('userId')
        if user_id:
            user_info, _ = UserInfo.objects.update_or_create(
                userId=user_id,
                defaults=user_info_data
            )
        else:
            user_info = UserInfo.objects.create(**user_info_data)

        # Create ProfileRecord
        profile = ProfileRecord.objects.create(userInfo=user_info, **validated_data)

        # Create strengths
        for s in strengths_data:
            Strength.objects.create(profile=profile, **s)

        # Create weaknesses
        for w in weaknesses_data:
            Weakness.objects.create(profile=profile, **w)

        return profile

    def update(self, instance, validated_data):
        user_info_data = validated_data.pop('userInfo', None)
        strengths_data = validated_data.pop('strengths', None)
        weaknesses_data = validated_data.pop('weaknesses', None)

        # Update UserInfo if present
        if user_info_data and instance.userInfo:
            for attr, val in user_info_data.items():
                setattr(instance.userInfo, attr, val)
            instance.userInfo.save()

        # Replace strengths
        if strengths_data is not None:
            instance.strengths.all().delete()
            for s in strengths_data:
                Strength.objects.create(profile=instance, **s)

        # Replace weaknesses
        if weaknesses_data is not None:
            instance.weaknesses.all().delete()
            for w in weaknesses_data:
                Weakness.objects.create(profile=instance, **w)

        # Update other fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        return instance

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'

class MatchListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = '__all__'

class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = '__all__'

class InterviewLockSerializer(serializers.ModelSerializer):
    trainee_name = serializers.CharField(source='trainee.userInfo.name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)

    class Meta:
        model = InterviewLock
        fields = '__all__'# or list explicitly + the above
# class InterviewLockCreateSerializer(serializers.Serializer):
#     trainee_ids = serializers.ListField(child=serializers.IntegerField())
#     job_id = serializers.IntegerField()
#     interview_datetime = serializers.DateTimeField()
#     comments = serializers.CharField(required=False, allow_blank=True)
#     assigned_to = serializers.IntegerField(required=False, allow_null=True)

class InterviewLockCreateSerializer(serializers.Serializer):
    trainee_ids = serializers.ListField(child=serializers.CharField())   # was IntegerField
    job_id = serializers.IntegerField()
    interview_datetime = serializers.DateTimeField()
    comments = serializers.CharField(required=False, allow_blank=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)

    def to_internal_value(self, data):
        # If trainee_ids is a dict (e.g., {"0": 123, "1": 456}), extract its values as a list
        if isinstance(data.get('trainee_ids'), dict):
            data['trainee_ids'] = list(data['trainee_ids'].values())
        return super().to_internal_value(data)

class InterviewFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewFeedback
        fields = '__all__'

# Mapping serializer for UserInfo updates
class UserInfoMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInfo
        fields = ['isMapped', 'projectId', 'projectName']



from .models import ManagerChatSession, ManagerChatMessage

class ManagerChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerChatMessage
        fields = ['id', 'role', 'content', 'timestamp']

class ManagerChatSessionSerializer(serializers.ModelSerializer):
    messages = ManagerChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ManagerChatSession
        fields = ['id', 'session_key', 'created_at', 'updated_at', 'messages']