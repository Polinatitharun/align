import pandas as pd
import threading
import json
import re
import requests
import csv
import logging
from datetime import datetime
from io import BytesIO
from docx import Document
from openpyxl import Workbook
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db import models as django_models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import viewsets
from rest_framework.decorators import action
from .models import (
    User, Job, UserInfo, ProfileRecord, Strength, Weakness,
    Recommendation, Match, InterviewLock, InterviewFeedback
)
from .serializers import (
    UserSerializer, AddUserSerializer, EditUserSerializer, ResetPasswordSerializer,
    JobSerializer, ProfileRecordSerializer, UserInfoSerializer, UserInfoMappingSerializer,
    RecommendationSerializer, MatchListSerializer, InterviewLockSerializer,
    InterviewLockCreateSerializer, InterviewFeedbackSerializer,
    ManagerChatSessionSerializer, ManagerChatMessageSerializer   # ensure these exist
)
from .tokens import CustomTokenObtainPairSerializer
from .matching_engine import run_matching_logic, llm, clean

logger = logging.getLogger(__name__)

# ---------- Helper to get trainee profile from request user ----------
def get_trainee_profile(user):
    try:
        user_info = UserInfo.objects.get(email=user.email)
    except UserInfo.DoesNotExist:
        try:
            user_info = UserInfo.objects.get(employeeId=user.username)
        except UserInfo.DoesNotExist:
            return None
    try:
        profile = ProfileRecord.objects.get(userInfo=user_info)
        return profile
    except ProfileRecord.DoesNotExist:
        return None

# ---------- Token Login ----------
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# ---------- User Management ----------
class AddUserView(APIView):
    def post(self, request):
        serializer = AddUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created"}, status=201)
        return Response(serializer.errors, status=400)

class UploadAddExcelView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({"error": f"Invalid Excel file: {str(e)}"}, status=400)

        created_users = []
        df.columns = [c.lower().strip() for c in df.columns]
        if 'password' not in df.columns:
            df['password'] = None

        for _, row in df.iterrows():
            if User.objects.filter(username=row['username']).exists():
                continue
            password = row['password']
            if pd.isna(password) or str(password).strip() == "":
                password = "Tcs#12345"
            else:
                password = str(password)
            User.objects.create_user(
                username=row['username'],
                email=row['email'],
                password=password,
                role=row['role'],
                is_active=True
            )
            created_users.append(row['username'])
        return Response({"created_users": created_users}, status=201)

class UserListView(APIView):
    def get(self, request):
        users = User.objects.all()
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class EditUserView(APIView):
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        serializer = EditUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User updated", "data": serializer.data})
        return Response(serializer.errors, status=400)

class ToggleUserStatusView(APIView):
    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        user.is_active = not user.is_active
        user.save()
        return Response({"status": "updated"})

class DeleteUserView(APIView):
    def delete(self, request, user_id):
        User.objects.filter(id=user_id).delete()
        return Response({"message": "User deleted"})

class ResetPasswordView(APIView):
    def post(self, request, user_id):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = get_object_or_404(User, id=user_id)
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({"message": "Password reset successful"})
        return Response(serializer.errors, status=400)

class UploadBulkDeleteUsersView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        df = pd.read_excel(file)
        deleted_users = []
        for _, row in df.iterrows():
            try:
                user = User.objects.get(username=row["username"])
                user.delete()
                deleted_users.append(row["username"])
            except User.DoesNotExist:
                continue
        return Response({"deleted_users": deleted_users}, status=200)

class UploadBulkActivateUsersView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        df = pd.read_excel(file)
        activated_users = []
        for _, row in df.iterrows():
            try:
                user = User.objects.get(username=row["username"])
                user.is_active = True
                user.save()
                activated_users.append(row["username"])
            except User.DoesNotExist:
                continue
        return Response({"activated_users": activated_users}, status=200)

class UploadBulkDeactivateUsersView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        df = pd.read_excel(file)
        deactivated_users = []
        for _, row in df.iterrows():
            try:
                user = User.objects.get(username=row["username"])
                user.is_active = False
                user.save()
                deactivated_users.append(row["username"])
            except User.DoesNotExist:
                continue
        return Response({"deactivated_users": deactivated_users}, status=200)

# ---------- Job Management ----------
class JobListView(APIView):
    def get(self, request):
        jobs = Job.objects.all()
        batch = request.query_params.get('batch')
        if batch:
            jobs = jobs.filter(batch_name=batch)
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            job = serializer.save()
            threading.Thread(target=run_matching_logic, args=(job.id,), daemon=True).start()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class JobDetailView(APIView):
    def get_object(self, pk):
        try:
            return Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return None

    def get(self, request, pk):
        job = self.get_object(pk)
        if job:
            serializer = JobSerializer(job)
            return Response(serializer.data)
        return Response({"error": "Job not found"}, status=404)

    def put(self, request, pk):
        job = self.get_object(pk)
        if job:
            serializer = JobSerializer(job, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        return Response({"error": "Job not found"}, status=404)

    def delete(self, request, pk):
        job = self.get_object(pk)
        if job:
            job.delete()
            return Response({"message": "Job deleted successfully"}, status=204)
        return Response({"error": "Job not found"}, status=404)

class ToggleJobStatusView(APIView):
    def patch(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        job.status = 'inactive' if job.status == 'active' else 'active'
        job.save()
        serializer = JobSerializer(job)
        return Response(serializer.data)

class UploadExcelView(APIView):
    def post(self, request):
        file = request.FILES.get('excel_file')
        batch_name = request.data.get('batch_name')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        if not file.name.endswith(('.xlsx', '.xls', '.csv')):
            return Response({"error": "Invalid file type"}, status=400)

        try:
            df = pd.read_excel(file)
            created_jobs = []
            errors = []
            required_columns = ['Title','Department','Location','Openings','Requirements','Tech Skills','Soft Skills','Description','Expiry Date']
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                return Response({"error": f"Missing columns: {missing}"}, status=400)

            for index, row in df.iterrows():
                if pd.isna(row.get('Title')):
                    continue
                try:
                    locations = [loc.strip() for loc in str(row['Location']).split(',') if loc.strip()]
                    tech_skills = [skill.strip() for skill in str(row['Tech Skills']).split(',') if skill.strip()]
                    soft_skills = [skill.strip() for skill in str(row['Soft Skills']).split(',') if skill.strip()]
                    openings = int(row['Openings']) if not pd.isna(row['Openings']) else 1
                    expiry = row['Expiry Date']
                    if pd.isna(expiry):
                        expiry = ''
                    elif isinstance(expiry, (pd.Timestamp, datetime)):
                        expiry = expiry.strftime('%Y-%m-%d')
                    else:
                        expiry = str(expiry).strip()

                    job_data = {
                        'title': str(row['Title']).strip(),
                        'department': str(row['Department']).strip(),
                        'location': locations,
                        'openings': openings,
                        'requirements': str(row['Requirements']).strip(),
                        'techSkills': tech_skills,
                        'softSkills': soft_skills,
                        'description': str(row['Description']).strip(),
                        'expiryDate': expiry,
                        'status': 'active',
                        'filled': 0,
                        'matches': 0,
                        'postedDate': datetime.now().strftime('%Y-%m-%d'),
                        'batch_name': batch_name,
                    }
                    serializer = JobSerializer(data=job_data)
                    if serializer.is_valid():
                        job = serializer.save()
                        created_jobs.append(job.title)
                        threading.Thread(target=run_matching_logic, args=(job.id,), daemon=True).start()
                    else:
                        errors.append(f"Row {index+2}: {serializer.errors}")
                except Exception as e:
                    errors.append(f"Row {index+2}: {str(e)}")

            response = {"message": f"Processed {len(created_jobs)} jobs", "created_jobs": created_jobs}
            if errors:
                response["errors"] = errors[:10]
            return Response(response, status=201)
        except Exception as e:
            return Response({"error": f"Error processing file: {str(e)}"}, status=400)

class UploadWordView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file = request.FILES.get('wordFile')
        batch_name = request.data.get('batch_name')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        try:
            doc = Document(file)
            content = '\n'.join([para.text for para in doc.paragraphs])
            job_data = self.parse_word_content(content)
            if job_data:
                job_data['batch_name'] = batch_name
                serializer = JobSerializer(data=job_data)
                if serializer.is_valid():
                    job = serializer.save()
                    threading.Thread(target=run_matching_logic, args=(job.id,), daemon=True).start()
                    return Response({"message": "Job created", "job": job.title}, status=201)
                return Response(serializer.errors, status=400)
            return Response({"error": "Could not parse Word document"}, status=400)
        except Exception as e:
            return Response({"error": f"Error processing Word: {str(e)}"}, status=400)

    def parse_word_content(self, content):
        lines = content.split('\n')
        job_data = {}
        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()
                if 'job title' in key:
                    job_data['title'] = value
                elif 'department' in key:
                    job_data['department'] = value
                elif 'location' in key:
                    job_data['location'] = [loc.strip() for loc in value.split(',')]
                elif 'openings' in key:
                    job_data['openings'] = int(value) if value.isdigit() else 1
                elif 'requirements' in key:
                    job_data['requirements'] = value
                elif 'tech' in key and 'skill' in key:
                    job_data['techSkills'] = [s.strip() for s in value.split(',')]
                elif 'soft' in key and 'skill' in key:
                    job_data['softSkills'] = [s.strip() for s in value.split(',')]
                elif 'description' in key:
                    job_data['description'] = value
                elif 'expiry' in key or 'deadline' in key:
                    job_data['expiryDate'] = value
        job_data.update({
            'status': 'active',
            'filled': 0,
            'matches': 0,
            'postedDate': datetime.now().strftime('%Y-%m-%d')
        })
        return job_data

class DownloadExcelTemplateView(APIView):
    def get(self, request):
        wb = Workbook()
        ws = wb.active
        ws.title = "Job Template"
        headers = ['Title','Department','Location','Openings','Requirements','Tech Skills','Soft Skills','Description','Expiry Date']
        for col, h in enumerate(headers, 1):
            ws.cell(row=1, column=col, value=h)
        sample = ['Frontend Developer','Technology','Hyderabad,Bangalore','3','3+ years React','React,JavaScript','Communication,Teamwork','Develop web apps','2024-03-15']
        for col, val in enumerate(sample, 1):
            ws.cell(row=2, column=col, value=val)
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="job_template.xlsx"'
        return response

class DownloadWordTemplateView(APIView):
    def get(self, request):
        doc = Document()
        doc.add_heading('Job Profile Template', 0)
        doc.add_paragraph('Job Title: ')
        doc.add_paragraph('Department: ')
        doc.add_paragraph('Locations: (comma separated)')
        doc.add_paragraph('Openings: ')
        doc.add_paragraph('Requirements: ')
        doc.add_paragraph('Tech Skills: (comma separated)')
        doc.add_paragraph('Soft Skills: (comma separated)')
        doc.add_paragraph('Description: ')
        doc.add_paragraph('Expiry Date: (YYYY-MM-DD)')
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response['Content-Disposition'] = 'attachment; filename="job_template.docx"'
        return response

# ---------- Profile Management ----------
class ProfileListCreateAPIView(APIView):
    def get(self, request):
        qs = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths','weaknesses').all()
        batch = request.query_params.get('batch')
        if batch:
            qs = qs.filter(batch_name=batch)
        serializer = ProfileRecordSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProfileRecordSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            user_info = instance.userInfo
            if user_info.employeeId:
                emp_id = str(user_info.employeeId)
                user, created = User.objects.get_or_create(
                    username=emp_id,
                    defaults={
                        'email': f"{emp_id}@tcs.com",
                        'first_name': user_info.name.split()[0] if user_info.name else '',
                        'last_name': ' '.join(user_info.name.split()[1:]) if user_info.name and len(user_info.name.split()) > 1 else '',
                        'role': 'trainee',
                        'is_active': True,
                    }
                )
                if created:
                    user.set_password('Tcs#12345')
                    user.save()
            return Response(ProfileRecordSerializer(instance).data, status=201)
        return Response(serializer.errors, status=400)

class ProfileDetailAPIView(APIView):
    def get_object(self, userId):
        return get_object_or_404(
            ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths','weaknesses'),
            userInfo__userId=userId
        )

    def get(self, request, userId):
        instance = self.get_object(userId)
        serializer = ProfileRecordSerializer(instance)
        return Response(serializer.data)

    def put(self, request, userId):
        instance = self.get_object(userId)
        serializer = ProfileRecordSerializer(instance, data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response(ProfileRecordSerializer(instance).data)
        return Response(serializer.errors, status=400)

    def patch(self, request, userId):
        instance = self.get_object(userId)
        serializer = ProfileRecordSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            instance = serializer.save()
            return Response(ProfileRecordSerializer(instance).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, userId):
        instance = self.get_object(userId)
        instance.delete()
        return Response(status=204)

class BulkUploadProfilesAPIView(APIView):
    def post(self, request):
        if not isinstance(request.data, list):
            return Response({"detail": "Expected a list of JSON objects."}, status=400)

        created_count = 0
        errors = []
        outputs = []

        for idx, payload in enumerate(request.data):
            serializer = ProfileRecordSerializer(data=payload)
            if serializer.is_valid():
                instance = serializer.save()
                user_info = instance.userInfo
                if user_info.employeeId:
                    emp_id = str(user_info.employeeId)
                    user, created = User.objects.get_or_create(
                        username=emp_id,
                        defaults={
                            'email': f"{emp_id}@tcs.com",
                            'first_name': user_info.name.split()[0] if user_info.name else '',
                            'last_name': ' '.join(user_info.name.split()[1:]) if user_info.name and len(user_info.name.split()) > 1 else '',
                            'role': 'trainee',
                            'is_active': True,
                        }
                    )
                    if created:
                        user.set_password('Tcs#12345')
                        user.save()
                outputs.append(ProfileRecordSerializer(instance).data)
                created_count += 1
            else:
                errors.append({"index": idx, "errors": serializer.errors})

        resp = {"created": created_count, "failed": len(errors), "errors": errors, "records": outputs}
        status_code = 201 if not errors else 207
        return Response(resp, status=status_code)

class UserInfoMappingUpdateAPIView(APIView):
    def patch(self, request, userId):
        instance = get_object_or_404(UserInfo, userId=userId)
        serializer = UserInfoMappingSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class UserInfoDetailAPIView(APIView):
    def get(self, request, userId):
        instance = get_object_or_404(UserInfo, userId=userId)
        serializer = UserInfoSerializer(instance)
        return Response(serializer.data)

# ---------- Recommendations ----------
@api_view(['GET', 'POST'])
def recommendation_list_create(request):
    if request.method == 'GET':
        qs = Recommendation.objects.all()
        trainee_id = request.query_params.get('traineeId')
        job_id = request.query_params.get('jobId')
        if trainee_id:
            qs = qs.filter(trainee_id=trainee_id)
        if job_id:
            qs = qs.filter(job_id=job_id)
        serializer = RecommendationSerializer(qs, many=True)
        return Response(serializer.data)
    serializer = RecommendationSerializer(data=request.data)
    if serializer.is_valid():
        obj = serializer.save()
        return Response(RecommendationSerializer(obj).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def recommendation_detail(request, pk):
    instance = get_object_or_404(Recommendation, pk=pk)
    if request.method == 'GET':
        serializer = RecommendationSerializer(instance)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = RecommendationSerializer(instance, data=request.data)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(RecommendationSerializer(obj).data)
        return Response(serializer.errors, status=400)
    elif request.method == 'PATCH':
        serializer = RecommendationSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(RecommendationSerializer(obj).data)
        return Response(serializer.errors, status=400)
    else:  # DELETE
        instance.delete()
        return Response(status=204)

# ---------- Matching Engine Trigger ----------
class RunMatchingEngineView(APIView):
    def post(self, request):
        job_id = request.data.get('job_id')
        if job_id:
            try:
                job_id = int(job_id)
            except ValueError:
                return Response({"error": "Invalid job_id"}, status=400)
        result = run_matching_logic(job_id=job_id)
        if result:
            return Response({"message": "Matching run successfully."}, status=201)
        else:
            return Response({"message": "Already updated"}, status=200)

# ---------- Job Matches ----------
class JobMatchListView(APIView):
    def get(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        batch = request.query_params.get('batch')
        if batch and job.batch_name != batch:
            return Response({
                "job_title": job.title,
                "job_id": job.id,
                "total_matches": 0,
                "perfect_match": [],
                "skills_only": [],
                "location_only": [],
                "nearby": [],
                "no_match": []
            })

        global_excluded = InterviewLock.objects.filter(status__in=['locked','selected']).values_list('trainee_id', flat=True).distinct()
        rejected_for_job = InterviewLock.objects.filter(job_id=job_id, status='rejected').values_list('trainee_id', flat=True).distinct()
        all_excluded = list(global_excluded) + list(rejected_for_job)
        matches = Match.objects.filter(job_ref=job).exclude(trainee_ref_id__in=all_excluded)

        response = {
            "job_title": job.title,
            "job_id": job.id,
            "total_matches": matches.count(),
            "perfect_match": [],
            "skills_only": [],
            "location_only": [],
            "nearby": [],
            "no_match": []
        }
        for match in matches:
            data = MatchListSerializer(match).data
            bucket = match.bucket
            if bucket == 'PERFECT_MATCH':
                response["perfect_match"].append(data)
            elif bucket == 'SKILLS_ONLY':
                response["skills_only"].append(data)
            elif bucket == 'LOCATION_ONLY':
                response["location_only"].append(data)
            elif bucket == 'NEARBY':
                response["nearby"].append(data)
            else:
                response["no_match"].append(data)
        return Response(response)

class TraineeMatchListView(APIView):
    def get(self, request, trainee_id):
        trainee = get_object_or_404(ProfileRecord, id=trainee_id)
        batch = request.query_params.get('batch')
        matches = Match.objects.filter(trainee_ref=trainee)
        if batch:
            matches = matches.filter(job_ref__batch_name=batch)

        response = {
            "trainee_name": trainee.userInfo.name if trainee.userInfo else "Unknown",
            "trainee_id": trainee.id,
            "total_matches": matches.count(),
            "perfect_match": [],
            "skills_only": [],
            "location_only": [],
            "nearby": [],
            "no_match": []
        }
        for match in matches:
            data = {
                "match_id": match.id,
                "job_id": match.job_ref.id,
                "job_title": match.job_ref.title,
                "job_location": match.job_ref.location,
                "posted_date": match.job_ref.postedDate,
                "bucket": match.bucket,
                "total_percentage": match.total_percentage,
                "skills_percentage": match.skills_percentage,
                "location_percentage": match.location_percentage,
                "distance": match.distance if match.bucket == 'NEARBY' else None,
                "matched_skills": match.matched_skills if match.bucket != 'NO_MATCH' else None
            }
            bucket = match.bucket
            if bucket == 'PERFECT_MATCH':
                response["perfect_match"].append(data)
            elif bucket == 'SKILLS_ONLY':
                response["skills_only"].append(data)
            elif bucket == 'LOCATION_ONLY':
                response["location_only"].append(data)
            elif bucket == 'NEARBY':
                response["nearby"].append(data)
            else:
                response["no_match"].append(data)
        return Response(response)

# ---------- Interview Locks ----------
class InterviewLockViewSet(viewsets.ModelViewSet):
    queryset = InterviewLock.objects.all()
    serializer_class = InterviewLockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        batch = self.request.query_params.get('batch')
        if batch:
            qs = qs.filter(job__batch_name=batch) | qs.filter(trainee__batch_name=batch)
        job_id = self.request.query_params.get('job')
        trainee_id = self.request.query_params.get('trainee')
        status_filter = self.request.query_params.get('status')
        if job_id:
            qs = qs.filter(job_id=job_id)
        if trainee_id:
            qs = qs.filter(trainee_id=trainee_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = InterviewLockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        trainee_user_ids = data['trainee_ids']
        job_id = data['job_id']
        interview_datetime = data['interview_datetime']
        comments = data.get('comments', '')
        assigned_to_id = data.get('assigned_to')

        assigned_to = None
        if assigned_to_id:
            try:
                assigned_to = User.objects.get(id=assigned_to_id)
            except User.DoesNotExist:
                return Response({'error': 'Assigned user not found'}, status=400)

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=404)

        profiles = ProfileRecord.objects.filter(
            userInfo__userId__in=trainee_user_ids
        ).select_related('userInfo')
        userid_to_profid = {p.userInfo.userId: p.id for p in profiles}

        locks = []
        for user_id in trainee_user_ids:
            prof_id = userid_to_profid.get(user_id)
            if not prof_id:
                continue
            lock, created = InterviewLock.objects.get_or_create(
                trainee_id=prof_id,
                job_id=job_id,
                defaults={
                    'locked_by': request.user,
                    'interview_datetime': interview_datetime,
                    'comments': comments,
                    'assigned_to': assigned_to,
                }
            )
            if created:
                locks.append(lock)

        output_serializer = self.get_serializer(locks, many=True)
        return Response(output_serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        batch = request.query_params.get('batch')
        qs = InterviewLock.objects.all()
        if batch:
            qs = qs.filter(job__batch_name=batch) | qs.filter(trainee__batch_name=batch)
        total_locked = qs.filter(status='locked').count()
        total_selected = qs.filter(status='selected').count()
        total_rejected = qs.filter(status='rejected').count()
        by_job = qs.values('job__title').annotate(
            locked=django_models.Count('id', filter=django_models.Q(status='locked')),
            selected=django_models.Count('id', filter=django_models.Q(status='selected')),
            rejected=django_models.Count('id', filter=django_models.Q(status='rejected')),
        )
        return Response({
            'total_locked': total_locked,
            'total_selected': total_selected,
            'total_rejected': total_rejected,
            'by_job': by_job,
        })

    @action(detail=False, methods=['get'])
    def report(self, request):
        locks = self.get_queryset().select_related('trainee__userInfo', 'job', 'locked_by')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="interview_locks.csv"'
        writer = csv.writer(response)
        writer.writerow(['Trainee Name','Job Title','Interview DateTime','Status','Comments','Locked By','Created At'])
        for lock in locks:
            writer.writerow([
                lock.trainee.userInfo.name,
                lock.job.title,
                lock.interview_datetime,
                lock.status,
                lock.comments,
                lock.locked_by.username if lock.locked_by else '',
                lock.created_at,
            ])
        return response

    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        lock = self.get_object()
        if lock.status != 'locked':
            return Response({'error': 'Feedback can only be submitted for locked interviews.'}, status=400)
        if hasattr(lock, 'feedback'):
            return Response({'error': 'Feedback already exists for this interview.'}, status=400)

        feedback_serializer = InterviewFeedbackSerializer(data=request.data)
        feedback_serializer.is_valid(raise_exception=True)
        feedback_serializer.save(lock=lock, interviewer=request.user)

        recommendation = feedback_serializer.validated_data.get('recommendation')
        if recommendation == 'selected':
            lock.status = 'selected'
        elif recommendation == 'rejected':
            lock.status = 'rejected'
        lock.save()
        return Response(feedback_serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def my_assigned(self, request):
        if request.user.role != 'interviewer':
            return Response({'error': 'Access denied.'}, status=403)
        qs = self.get_queryset().filter(assigned_to=request.user, status='locked')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

# ---------- Reports ----------
class MappedTraineesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        batch = request.query_params.get('batch')
        mapped = UserInfo.objects.filter(isMapped=True).select_related('profile')
        if batch:
            mapped = mapped.filter(profile__batch_name=batch)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="mapped_trainees.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name','Email','Location','Project ID','Project Name','Score'])
        for info in mapped:
            writer.writerow([
                info.name,
                info.employeeId or '',
                info.location or '',
                info.projectId or '',
                info.projectName or '',
                info.averageScore or '',
            ])
        return response

class UnmappedTraineesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        batch = request.query_params.get('batch')
        unmapped = UserInfo.objects.filter(isMapped=False).select_related('profile')
        if batch:
            unmapped = unmapped.filter(profile__batch_name=batch)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="unmapped_trainees.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name','Email','Location','Average Score'])
        for info in unmapped:
            writer.writerow([
                info.name,
                info.employeeId or '',
                info.location or '',
                info.averageScore or '',
            ])
        return response

class OpenPoolReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Exists, OuterRef
        batch = request.query_params.get('batch')
        unmapped = UserInfo.objects.filter(isMapped=False)
        if batch:
            unmapped = unmapped.filter(profile__batch_name=batch)
        has_match = Match.objects.filter(trainee_ref__userInfo=OuterRef('pk'))
        open_pool = unmapped.annotate(has_match=Exists(has_match)).filter(has_match=False)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="open_pool_trainees.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name','Email','Location','Average Score'])
        for info in open_pool:
            writer.writerow([
                info.name,
                info.employeeId or '',
                info.location or '',
                info.averageScore or '',
            ])
        return response

# ---------- Deco Integration ----------
_deco_tokens = {}

class DecoLoginView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=400)

        deco_login_url = "https://deco.example.com/api/auth/login"
        try:
            resp = requests.post(deco_login_url, json={"username": username, "password": password})
            if resp.status_code == 200:
                token = resp.json().get('token')
                _deco_tokens[request.user.id] = token
                return Response({"success": True, "token": token})
            else:
                return Response({"error": "Invalid credentials"}, status=401)
        except Exception as e:
            logger.error(f"Deco login error: {e}")
            return Response({"error": "Could not connect to Deco"}, status=503)

class DecoStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = _deco_tokens.get(request.user.id)
        if not token:
            return Response({"error": "Not logged in to Deco"}, status=401)
        deco_status_url = "https://deco.example.com/api/health"
        try:
            resp = requests.get(deco_status_url, headers={"Authorization": f"Bearer {token}"}, timeout=5)
            if resp.status_code == 200:
                available = resp.json().get('available', False)
                return Response({"available": available})
            else:
                return Response({"available": False})
        except Exception as e:
            logger.error(f"Deco status error: {e}")
            return Response({"available": False})

class DecoFetchTraineesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, batch):
        token = _deco_tokens.get(request.user.id)
        if not token:
            return Response({"error": "Not logged in to Deco"}, status=401)

        deco_trainees_url = f"https://deco.example.com/api/alltraineesprofilesfromdeco/batch={batch}"
        try:
            resp = requests.get(deco_trainees_url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code != 200:
                return Response({"error": "Failed to fetch trainees from Deco"}, status=resp.status_code)

            data = resp.json()
            trainees_data = data.get('data', [])

            stored_count = 0
            errors = []

            for item in trainees_data:
                try:
                    external_id = item.get('id')
                    upskillCourses = item.get('upskillCourses')
                    certificates = item.get('certificates')
                    user_info_data = item.get('userInfo', {})
                    strengths_data = item.get('strengths', [])
                    weaknesses_data = item.get('weaknesses', [])
                    batchRank = item.get('batchRank')
                    groupRank = item.get('groupRank')
                    dpi = item.get('dpi')
                    batch_name = item.get('batchName')

                    name = user_info_data.get('name')
                    location = user_info_data.get('location')
                    user_id = user_info_data.get('userId')
                    avg_score = user_info_data.get('averageScore')
                    employee_id = user_info_data.get('employeeId')
                    isu = user_info_data.get('isu')

                    if not employee_id or not user_id:
                        errors.append({"item": user_id or employee_id or "unknown", "error": "Missing employeeId or userId"})
                        continue

                    employee_id = str(employee_id)
                    user_id = str(user_id)

                    user, created = User.objects.update_or_create(
                        username=employee_id,
                        defaults={
                            'email': f"{employee_id}@tcs.com",
                            'first_name': name.split()[0] if name else '',
                            'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else '',
                            'role': 'trainee',
                            'is_active': True,
                        }
                    )
                    if created:
                        user.set_password('Tcs#12345')
                        user.save()

                    user_info, _ = UserInfo.objects.update_or_create(
                        userId=user_id,
                        defaults={
                            'name': name or '',
                            'location': location,
                            'averageScore': avg_score,
                            'employeeId': employee_id,
                            'isu': isu,
                        }
                    )

                    profile, _ = ProfileRecord.objects.update_or_create(
                        external_id=external_id,
                        defaults={
                            'userInfo': user_info,
                            'upskillCourses': upskillCourses,
                            'certificates': certificates,
                            'batchRank': batchRank,
                            'groupRank': groupRank,
                            'dpi': dpi,
                            'batch_name': batch_name,
                        }
                    )

                    if strengths_data:
                        profile.strengths.all().delete()
                        for s in strengths_data:
                            Strength.objects.create(profile=profile, courseName=s.get('courseName'), avgScore=s.get('avgScore'))

                    if weaknesses_data:
                        profile.weaknesses.all().delete()
                        for w in weaknesses_data:
                            Weakness.objects.create(profile=profile, courseName=w.get('courseName'), avgScore=w.get('avgScore'))

                    stored_count += 1
                except Exception as e:
                    errors.append({"item": item.get('id'), "error": str(e)})

            return Response({"message": f"Stored {stored_count} trainees", "errors": errors}, status=201)

        except Exception as e:
            logger.error(f"Deco fetch trainees error: {e}")
            return Response({"error": str(e)}, status=500)

# ---------- Associate Views ----------
class AssociateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'trainee':
            return Response({"error": "Access denied"}, status=403)
        profile = get_trainee_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)
        serializer = ProfileRecordSerializer(profile)
        return Response(serializer.data)

class PublicJobsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = Job.objects.filter(status='active', is_public=True)
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)

class AISuggestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({"error": "job_id required"}, status=400)

        profile = get_trainee_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)

        job = get_object_or_404(Job, id=job_id, status='active', is_public=True)

        strengths = [s.courseName for s in profile.strengths.all()]
        weaknesses = [w.courseName for w in profile.weaknesses.all()]

        prompt = f"""
        You are a career advisor. Based on the trainee's profile and the job description below, provide a short, actionable suggestion (max 150 words) on how the trainee can improve their chances of getting this job.

        Trainee Profile:
        - Name: {profile.userInfo.name}
        - Current skills: {', '.join(strengths) if strengths else 'None listed'}
        - Areas needing improvement: {', '.join(weaknesses) if weaknesses else 'None listed'}
        - Average score: {profile.userInfo.averageScore}%

        Job Details:
        - Title: {job.title}
        - Department: {job.department}
        - Required tech skills: {', '.join(job.techSkills)}
        - Required soft skills: {', '.join(job.softSkills)}
        - Description: {job.description}

        Suggestion:
        """
        try:
            suggestion = clean(llm.invoke(prompt).content)
        except Exception as e:
            suggestion = "Unable to generate suggestion at this time."
        return Response({"suggestion": suggestion})

class InterviewQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({"error": "job_id required"}, status=400)

        job = get_object_or_404(Job, id=job_id, status='active', is_public=True)

        prompt = f"""
        Generate interview questions and answers for a {job.title} position.
        The job requires these technical skills: {', '.join(job.techSkills)}.
        Soft skills: {', '.join(job.softSkills)}.

        For each difficulty level (low, medium, high), provide 3 questions with concise answers.
        Output in JSON format exactly like this:
        {{
        "low": [{{"question": "...", "answer": "..."}}, ...],
        "medium": [...],
        "high": [...]
        }}
        Do not include any other text.
        """
        try:
            response_text = clean(llm.invoke(prompt).content)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                qa_data = json.loads(json_match.group())
            else:
                qa_data = {"error": "Could not parse response"}
        except Exception as e:
            qa_data = {"error": "Failed to generate questions"}
        return Response(qa_data)

class CareerPathView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_trainee_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)

        strengths = [s.courseName for s in profile.strengths.all()]
        weaknesses = [w.courseName for w in profile.weaknesses.all()]

        prompt = f"""
        You are an AI career coach. Based on the trainee's profile below, generate a detailed career roadmap.
        Include short-term (1-2 years) and long-term (3-5 years) roles, skills to develop, relevant certifications, and overall advice.
        Output in JSON format exactly like this:
        {{
        "short_term": {{
            "roles": ["Role1", "Role2"],
            "skills_to_develop": ["Skill1", "Skill2"],
            "certifications": ["Cert1", "Cert2"],
            "advice": "Short paragraph."
        }},
        "long_term": {{
            "roles": ["RoleA", "RoleB"],
            "skills_to_develop": ["SkillA", "SkillB"],
            "certifications": ["CertA", "CertB"],
            "advice": "Short paragraph."
        }},
        "overall_advice": "Overall advice paragraph."
        }}

        Trainee Profile:
        - Current skills: {', '.join(strengths) if strengths else 'None listed'}
        - Areas needing improvement: {', '.join(weaknesses) if weaknesses else 'None listed'}
        - Average score: {profile.userInfo.averageScore}%
        - Current role: Trainee
        """
        try:
            response_text = clean(llm.invoke(prompt).content)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                career_data = json.loads(json_match.group())
            else:
                career_data = {"error": "Could not parse response"}
        except Exception as e:
            career_data = {"error": "Failed to generate career path"}
        return Response(career_data)

def get_similar_selected_projects(profile, limit=5):
    my_strengths = set(profile.strengths.values_list('courseName', flat=True))
    selected_locks = InterviewLock.objects.filter(status='selected').select_related('trainee','job').prefetch_related('trainee__strengths')
    scored_jobs = {}
    for lock in selected_locks:
        if lock.trainee == profile:
            continue
        other_strengths = set(lock.trainee.strengths.values_list('courseName', flat=True))
        overlap = len(my_strengths & other_strengths)
        if overlap > 0:
            job = lock.job
            if job.id not in scored_jobs:
                scored_jobs[job.id] = {'job': job, 'score': overlap, 'count': 1}
            else:
                scored_jobs[job.id]['score'] += overlap
                scored_jobs[job.id]['count'] += 1
    sorted_jobs = sorted(scored_jobs.values(), key=lambda x: x['score'], reverse=True)
    return [item['job'] for item in sorted_jobs[:limit]]

class AssociateDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'trainee':
            return Response({"error": "Access denied"}, status=403)

        profile = get_trainee_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)

        profile_data = ProfileRecordSerializer(profile).data

        matches = Match.objects.filter(trainee_ref=profile).select_related('job_ref')[:5]
        skill_gaps = []
        for match in matches:
            job = match.job_ref
            required = set(job.techSkills)
            trainee_skills = set(profile.strengths.values_list('courseName', flat=True))
            missing = list(required - trainee_skills)
            skill_gaps.append({
                'job_id': job.id,
                'job_title': job.title,
                'match_percentage': match.total_percentage,
                'missing_skills': missing,
                'has_all_skills': len(missing) == 0
            })

        similar_projects = get_similar_selected_projects(profile)
        similar_projects_data = JobSerializer(similar_projects, many=True).data

        strengths = [s.courseName for s in profile.strengths.all()]
        weaknesses = [w.courseName for w in profile.weaknesses.all()]
        prompt = f"Based on trainee's strengths ({', '.join(strengths)}) and weaknesses ({', '.join(weaknesses)}), provide brief career advice (max 100 words) and suggest 2-3 courses to upskill."
        try:
            advice = clean(llm.invoke(prompt).content)
        except:
            advice = "Focus on improving your weak areas and leverage your strengths."

        return Response({
            'profile': profile_data,
            'skill_gaps': skill_gaps,
            'similar_projects': similar_projects_data,
            'advice': advice
        })

class PeerComparisonView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_trainee_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)

        if not profile.batch_name:
            return Response({"message": "Batch information not available"})

        same_batch = ProfileRecord.objects.filter(batch_name=profile.batch_name).exclude(id=profile.id)
        total = same_batch.count()
        if total == 0:
            return Response({"message": "No peers in same batch"})

        my_score = profile.userInfo.averageScore
        higher_count = ProfileRecord.objects.filter(
            batch_name=profile.batch_name,
            userInfo__averageScore__gt=my_score
        ).count()
        rank = higher_count + 1

        return Response({
            'batch': profile.batch_name,
            'total_in_batch': total,
            'your_rank': rank,
            'top_percentile': round((rank / total) * 100, 1) if total else 0
        })

# ---------- JobViewSet (for visibility) ----------
class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    @action(detail=True, methods=['patch'])
    def set_visibility(self, request, pk=None):
        job = self.get_object()
        is_public = request.data.get('is_public')
        if is_public is not None:
            job.is_public = is_public
            job.save()
            return Response({'status': 'visibility updated'})
        return Response({'error': 'is_public field required'}, status=status.HTTP_400_BAD_REQUEST)

# ---------- Create Interviewer ----------
class CreateInterviewerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['hr', 'admin']:
            return Response({"error": "Permission denied"}, status=403)

        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=400)

        email = request.data.get('email', f"{username}@tcs.com")
        if not email.endswith('@tcs.com'):
            return Response({"error": "Email must be @tcs.com"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='interviewer',
            is_active=True
        )
        return Response({"message": "Interviewer created", "user_id": user.id}, status=201)

# ==================== Manager Chatbot ====================
from .models import ManagerChatSession, ManagerChatMessage
from .serializers import ManagerChatSessionSerializer, ManagerChatMessageSerializer
import requests
import json

def build_manager_chat_context(batch=None):
    jobs = Job.objects.filter(status='active')
    trainees = ProfileRecord.objects.select_related('userInfo')
    if batch:
        jobs = jobs.filter(batch_name=batch)
        trainees = trainees.filter(batch_name=batch)

    total_trainees = trainees.count()
    mapped = trainees.filter(userInfo__isMapped=True).count()
    active_jobs_count = jobs.count()
    
    top_jobs = jobs[:5]
    job_summaries = []
    for job in top_jobs:
        skills = (job.techSkills or [])[:2]
        job_summaries.append(f"- {job.title} ({job.openings} openings, skills: {', '.join(skills)})")
    
    demand_map = {}
    for job in jobs:
        for skill in (job.techSkills or []) + (job.softSkills or []):
            demand_map[skill] = demand_map.get(skill, 0) + 1
    supply_map = {}
    for trainee in trainees.prefetch_related('strengths'):
        for strength in trainee.strengths.all():
            skill = strength.courseName
            supply_map[skill] = supply_map.get(skill, 0) + 1
    
    gaps = []
    for skill, demand in demand_map.items():
        supply = supply_map.get(skill, 0)
        if demand > supply:
            gaps.append((skill, demand - supply))
    gaps.sort(key=lambda x: x[1], reverse=True)
    top_gaps = gaps[:3]
    gap_str = ", ".join([f"{s} (gap {g})" for s, g in top_gaps]) if top_gaps else "none"
    
    context = f"""Batch: {batch if batch else 'All'}. Trainees: {total_trainees} (mapped: {mapped}). Active jobs: {active_jobs_count}.
Sample jobs: {'; '.join(job_summaries) if job_summaries else 'none'}.
Top skill gaps: {gap_str}."""
    
    return context

def call_ollama_with_context(context, conversation_history, user_query):
    # Very compact prompt
    prompt = f"Data: {context[:800]}\nUser: {user_query}\nAnswer briefly:"
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3",               # use a fast, small model
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "max_tokens": 100,
                }
            },
            timeout=20
        )
        if response.status_code == 200:
            return response.json().get("response", "")
    except Exception as e:
        logger.error(f"Ollama call failed: {e}")
    
    # Fallback: simple rule-based answers
    q = user_query.lower()
    if "skill gap" in q:
        return "Skill gaps are shown in the Skill Gaps tab. Top gaps: " + context.split("Top skill gaps:")[-1].split(".")[0]
    if "mapped" in q:
        return f"Currently, {context.split('mapped:')[1].split('.')[0] if 'mapped:' in context else 'some'} trainees are mapped."
    if "job" in q:
        return f"Active jobs: {context.split('Active jobs:')[1].split('.')[0] if 'Active jobs:' in context else 'several'}."
    return "I'm currently processing your request. For detailed analytics, please check the respective dashboard tabs."

class ManagerChatContextView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        batch = request.query_params.get('batch', '')
        context = build_manager_chat_context(batch)
        return Response({"context": context})

class ManagerChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ManagerChatSessionSerializer

    def get_queryset(self):
        return ManagerChatSession.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        session = self.get_object()
        user_msg = request.data.get('message')
        if not user_msg:
            return Response({'error': 'Message required'}, status=400)

        # Save user message
        user_msg_obj = ManagerChatMessage.objects.create(
            session=session, role='user', content=user_msg
        )

        # Build context with batch filter
        batch = request.data.get('batch', '')
        context = build_manager_chat_context(batch)

        # Get conversation history
        history = list(session.messages.values('role', 'content'))

        # Get bot reply
        bot_reply = call_ollama_with_context(context, history, user_msg)

        # Save bot message
        bot_msg_obj = ManagerChatMessage.objects.create(
            session=session, role='assistant', content=bot_reply
        )

        session.save()
        return Response({
            'user_message': ManagerChatMessageSerializer(user_msg_obj).data,
            'bot_reply': ManagerChatMessageSerializer(bot_msg_obj).data
        })