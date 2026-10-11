# # accounts/tokens.py
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)
#         token['role'] = user.role
#         token['username'] = user.username
#         return token

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate, get_user_model

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # We define email field explicitly to override the default 'username' requirement
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['emai'] = user.email
        return token
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # 1. Find the user by email
            user_obj = User.objects.filter(email=email).first()

            if user_obj:
                # 2. If user exists, authenticate using their 'username' and the provided password
                # (Django's authenticate function usually requires the username field)
                user = authenticate(
                    request=self.context.get('request'),
                    username=user_obj.username, 
                    password=password
                )
            else:
                user = None
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        # 3. Handle authentication failure
        if not user:
            raise serializers.ValidationError('Unable to log in with provided credentials.')

        # 4. Generate the token
        refresh = self.get_token(user)

        # 5. Return the standard token data plus your custom user details
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'email': user.email,
            'role': user.role,  # Make sure 'role' exists on your User model
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }

        return data
