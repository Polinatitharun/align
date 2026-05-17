# views.py – Complete with all new bulk operations, updated job upload, and HR summary report

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
from openpyxl.chart import BarChart, Reference
from openpyxl.utils import get_column_letter
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
    ManagerChatSessionSerializer, ManagerChatMessageSerializer,TraineeSelfAssessmentSerializer
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
            # Normalize column names to lower case
            df.columns = [c.strip() for c in df.columns]
            required = ['demand id', 'location', 'skills', 'openings']
            missing = [c for c in required if c not in [x.lower() for x in df.columns]]
            if missing:
                return Response({"error": f"Missing required columns: {missing}"}, status=400)

            created_jobs = []
            errors = []
            for idx, row in df.iterrows():
                if pd.isna(row.get('Demand ID')) or pd.isna(row.get('Location')) or pd.isna(row.get('Skills')) or pd.isna(row.get('Openings')):
                    continue
                try:
                    # Required fields
                    project_name = str(row.get('Project Name', '')).strip() or 'Unnamed Project'
                    location = str(row['Location']).strip()
                    demand_id = str(row['Demand ID']).strip()
                    skills = str(row['Skills']).strip()
                    openings = int(row['Openings'])

                    # Optional fields
                    bg = str(row.get('BG', '')).strip() or None
                    isu_hsu = str(row.get('ISU/HSU', '')).strip() or None
                    stream = str(row.get('Stream', '')).strip() or None
                    role = str(row.get('Role', '')).strip() or None
                    spoc_name = str(row.get('Project SPOC Name', '')).strip() or None
                    spoc_emp_id = str(row.get('Project SPOC Emp ID', '')).strip() or None
                    rmg_head = str(row.get('RMG Head', '')).strip() or None

                    job_data = {
                        'project_name': project_name,
                        'location': location,
                        'demand_id': demand_id,
                        'skills': skills,
                        'openings': openings,
                        'bg': bg,
                        'isu_hsu': isu_hsu,
                        'stream': stream,
                        'role': role,
                        'spoc_name': spoc_name,
                        'spoc_emp_id': spoc_emp_id,
                        'rmg_head': rmg_head,
                        'status': 'active',
                        'filled': 0,
                        'matches': 0,
                        'postedDate': datetime.now().strftime('%Y-%m-%d'),
                        'batch_name': batch_name,
                    }
                    serializer = JobSerializer(data=job_data)
                    if serializer.is_valid():
                        job = serializer.save()
                        created_jobs.append(job.project_name)
                        threading.Thread(target=run_matching_logic, args=(job.id,), daemon=True).start()
                    else:
                        errors.append(f"Row {idx+2}: {serializer.errors}")
                except Exception as e:
                    errors.append(f"Row {idx+2}: {str(e)}")

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
                    return Response({"message": "Job created", "job": job.project_name}, status=201)
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
                if 'project name' in key or 'job title' in key:
                    job_data['project_name'] = value
                elif 'location' in key:
                    job_data['location'] = value
                elif 'demand' in key and 'id' in key:
                    job_data['demand_id'] = value
                elif 'skill' in key:
                    job_data['skills'] = value
                elif 'openings' in key:
                    job_data['openings'] = int(value) if value.isdigit() else 1
                elif 'bg' in key:
                    job_data['bg'] = value
                elif 'isu' in key or 'hsu' in key:
                    job_data['isu_hsu'] = value
                elif 'stream' in key:
                    job_data['stream'] = value
                elif 'role' in key:
                    job_data['role'] = value
                elif 'spoc' in key and 'name' in key:
                    job_data['spoc_name'] = value
                elif 'spoc' in key and 'emp' in key:
                    job_data['spoc_emp_id'] = value
                elif 'rmg' in key and 'head' in key:
                    job_data['rmg_head'] = value
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
        headers = ['Location', 'BG', 'ISU/HSU', 'Project Name', 'Stream', 'Role', 'Project SPOC Name', 'Openings', 'Project SPOC Emp ID', 'RMG Head', 'Skills', 'Demand ID']
        for col, h in enumerate(headers, 1):
            ws.cell(row=1, column=col, value=h)
        sample = ['Hyderabad,Bangalore', 'Technology', 'ISU', 'Frontend Developer', 'Java', 'Developer', 'John Doe', '3', 'EMP001', 'Jane Smith', 'React,JavaScript', 'DEMAND001']
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
        doc.add_paragraph('Project Name: ')
        doc.add_paragraph('Location: ')
        doc.add_paragraph('Demand ID: ')
        doc.add_paragraph('Skills: (comma separated)')
        doc.add_paragraph('Openings: ')
        doc.add_paragraph('BG: ')
        doc.add_paragraph('ISU/HSU: ')
        doc.add_paragraph('Stream: ')
        doc.add_paragraph('Role: ')
        doc.add_paragraph('Project SPOC Name: ')
        doc.add_paragraph('Project SPOC Emp ID: ')
        doc.add_paragraph('RMG Head: ')
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
                "job_title": job.project_name,
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
            "job_title": job.project_name,
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
            bucket = normalize_bucket(match.bucket)
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


def normalize_bucket(bucket):
    if bucket == 'SKILLS_POTENTIAL':
        return 'SKILLS_ONLY'
    if bucket == 'RELOCATABLE':
        return 'NEARBY'
    return bucket


def normalize_matched_skills(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [skill.strip() for skill in value.split(',') if skill.strip()]
    return []

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
                "job_title": match.job_ref.project_name,
                "job_location": match.job_ref.location,
                "posted_date": match.job_ref.postedDate,
                "bucket": match.bucket,
                "total_percentage": match.total_percentage,
                "skills_percentage": match.skills_percentage,
                "location_percentage": match.location_percentage,
                "distance": match.distance if match.bucket == 'NEARBY' else None,
                "matched_skills": normalize_matched_skills(match.matched_skills) if normalize_bucket(match.bucket) != 'NO_MATCH' else None
            }
            bucket = normalize_bucket(match.bucket)
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
        by_job = qs.values('job__project_name').annotate(
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
                lock.job.project_name,
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


# apis/views.py

class TraineeSelfAssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Get the trainee profile for the logged-in user
        profile = get_trainee_profile(request.user)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)

        interview_lock_id = request.data.get('interview_lock_id')
        try:
            lock = InterviewLock.objects.get(id=interview_lock_id, trainee=profile)
        except InterviewLock.DoesNotExist:
            return Response({"error": "Invalid interview lock"}, status=400)

        if lock.status not in ['selected', 'rejected']:
            return Response({"error": "Assessment only allowed for completed interviews"}, status=400)

        if hasattr(lock, 'self_assessment'):
            return Response({"error": "Assessment already submitted"}, status=400)

        serializer = TraineeSelfAssessmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(interview_lock=lock)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)



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
        - Title: {job.project_name}
        - Required skills: {job.skills}

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
        Generate interview questions and answers for a {job.project_name} position.
        The job requires these skills: {job.skills}.

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
            required = set([skill.strip() for skill in job.skills.split(',') if skill.strip()])
            trainee_skills = set(profile.strengths.values_list('courseName', flat=True))
            missing = list(required - trainee_skills)
            skill_gaps.append({
                'job_id': job.id,
                'job_title': job.project_name,
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
        password = request.data.get('password', 'Tcs#12345')
        email = request.data.get('email', f"{username}@tcs.com")
        access_start = request.data.get('access_start')
        access_end = request.data.get('access_end')

        if not username:
            return Response({"error": "Username required"}, status=400)
        if not email.endswith('@tcs.com'):
            return Response({"error": "Email must be @tcs.com"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='interviewer',
            is_active=True,
            access_start=access_start,
            access_end=access_end,
        )
        return Response({"message": "Interviewer created", "user_id": user.id}, status=201)

# ==================== NEW BULK OPERATIONS ====================

# --- Bulk Interview Lock ---
class DownloadInterviewLockTemplateView(APIView):
    """Download Excel template for bulk interview lock"""
    def get(self, request):
        wb = Workbook()
        ws = wb.active
        ws.title = "Interview Lock Template"
        headers = ["Trainee Email/EmpID", "Interviewer Email/EmpID", "Job ID / Demand ID", "Interview DateTime", "Comments"]
        ws.append(headers)
        ws.column_dimensions['D'].width = 20
        ws.append(["emp001@tcs.com", "interviewer@tcs.com", "DEMAND001", "2025-05-15 14:00:00", "Sample comment"])
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="interview_lock_template.xlsx"'
        return response

def resolve_job_identifier(value, batch=None):
    if pd.isna(value):
        return None
    identifier = str(value).strip()
    if not identifier:
        return None

    filters = {}
    if batch:
        filters['batch_name'] = batch

    # Try numeric job primary key first, then Demand ID.
    try:
        return Job.objects.get(id=int(identifier), **filters)
    except (ValueError, Job.DoesNotExist):
        pass

    try:
        return Job.objects.get(demand_id=identifier, **filters)
    except Job.DoesNotExist:
        return None


class BulkInterviewLockView(APIView):
    """Bulk create interview locks from Excel upload"""
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({"error": f"Invalid Excel file: {str(e)}"}, status=400)

        df.columns = [c.strip().lower() for c in df.columns]
        col_map = {}
        for col in df.columns:
            if 'trainee' in col:
                col_map['trainee'] = col
            elif 'interviewer' in col:
                col_map['interviewer'] = col
            elif 'job' in col:
                col_map['job'] = col
            elif 'datetime' in col or 'date' in col:
                col_map['datetime'] = col
            elif 'comment' in col:
                col_map['comments'] = col
        if 'trainee' not in col_map or 'interviewer' not in col_map or 'job' not in col_map or 'datetime' not in col_map:
            return Response({"error": "Missing required columns"}, status=400)

        results = {'created': 0, 'errors': []}
        for idx, row in df.iterrows():
            try:
                trainee_identifier = str(row[col_map['trainee']]).strip()
                interviewer_identifier = str(row[col_map['interviewer']]).strip()
                job = resolve_job_identifier(row[col_map['job']])
                dt_str = str(row[col_map['datetime']]).strip()
                comments = str(row.get(col_map.get('comments', ''), '')).strip() if col_map.get('comments') in row else ''
                if not job:
                    results['errors'].append(f"Row {idx+2}: Job not found")
                    continue
                # Resolve trainee
                trainee_profile = None
                user_info = UserInfo.objects.filter(employeeId=trainee_identifier).first()
                if not user_info:
                    user_info = UserInfo.objects.filter(email=trainee_identifier).first()
                if user_info:
                    trainee_profile = user_info.profile
                if not trainee_profile:
                    results['errors'].append(f"Row {idx+2}: Trainee not found")
                    continue

                # Resolve interviewer
                interviewer_user = None
                try:
                    interviewer_user = User.objects.get(username=interviewer_identifier)
                except User.DoesNotExist:
                    try:
                        interviewer_user = User.objects.get(email=interviewer_identifier)
                    except User.DoesNotExist:
                        pass
                if not interviewer_user:
                    results['errors'].append(f"Row {idx+2}: Interviewer not found")
                    continue

                # Parse datetime
                try:
                    interview_dt = pd.to_datetime(dt_str).to_pydatetime()
                except:
                    results['errors'].append(f"Row {idx+2}: Invalid datetime format")
                    continue

                # Create lock
                lock, created = InterviewLock.objects.get_or_create(
                    trainee=trainee_profile,
                    job=job,
                    defaults={
                        'locked_by': request.user,
                        'interview_datetime': interview_dt,
                        'comments': comments,
                        'assigned_to': interviewer_user,
                    }
                )
                if created:
                    results['created'] += 1
                else:
                    results['errors'].append(f"Row {idx+2}: Already locked for this job")
            except Exception as e:
                results['errors'].append(f"Row {idx+2}: {str(e)}")

        return Response(results, status=201 if results['created'] > 0 else 400)

# --- Bulk Status Update ---
class DownloadStatusUpdateTemplateView(APIView):
    def get(self, request):
        wb = Workbook()
        ws = wb.active
        ws.title = "Status Update Template"
        ws.append(["Trainee Email/EmpID", "Job ID / Demand ID", "Status (selected/rejected)"])
        ws.append(["emp001@tcs.com", "DEMAND001", "selected"])
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="status_update_template.xlsx"'
        return response

class BulkStatusUpdateView(APIView):
    """Bulk update interview lock status with job openings validation"""
    
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        df.columns = [c.strip().lower() for c in df.columns]
        col_map = {}
        for col in df.columns:
            if 'trainee' in col:
                col_map['trainee'] = col
            elif 'job' in col:
                col_map['job'] = col
            elif 'status' in col:
                col_map['status'] = col
        
        if not all(k in col_map for k in ['trainee','job','status']):
            return Response({"error": "Missing required columns"}, status=400)

        # First, analyze all rows to calculate required openings per job
        job_selected_counts = {}
        row_details = []
        
        for idx, row in df.iterrows():
            try:
                trainee_id = str(row[col_map['trainee']]).strip()
                job = resolve_job_identifier(row[col_map['job']])
                new_status = str(row[col_map['status']]).strip().lower()
                
                if not job:
                    row_details.append({
                        'idx': idx,
                        'error': f"Job not found",
                        'trainee_id': trainee_id,
                        'job': None,
                        'status': new_status
                    })
                    continue
                    
                if new_status not in ['selected', 'rejected']:
                    row_details.append({
                        'idx': idx,
                        'error': f"Invalid status. Use 'selected' or 'rejected'",
                        'trainee_id': trainee_id,
                        'job': job,
                        'status': new_status
                    })
                    continue
                
                # Count selected status per job
                if new_status == 'selected':
                    job_selected_counts[job.id] = job_selected_counts.get(job.id, 0) + 1
                
                row_details.append({
                    'idx': idx,
                    'trainee_id': trainee_id,
                    'job': job,
                    'status': new_status,
                    'error': None
                })
                
            except Exception as e:
                row_details.append({
                    'idx': idx,
                    'error': str(e),
                    'trainee_id': None,
                    'job': None,
                    'status': None
                })
        
        # Validate job openings before processing
        openings_errors = []
        for job_id, selected_count in job_selected_counts.items():
            try:
                job = Job.objects.get(id=job_id)
                remaining_openings = job.openings - job.filled
                
                if selected_count > remaining_openings:
                    openings_errors.append(
                        f"Job '{job.project_name}' (ID: {job_id}) has only {remaining_openings} openings left, "
                        f"but you're trying to select {selected_count} candidates. Please reduce the number of selections or increase openings."
                    )
            except Job.DoesNotExist:
                openings_errors.append(f"Job ID {job_id} not found")
        
        if openings_errors:
            return Response({
                "error": "Openings validation failed",
                "details": openings_errors,
                "suggestion": "Please check your file and reduce the number of 'selected' entries for these jobs."
            }, status=400)
        
        # Process each row
        results = {'updated': 0, 'errors': [], 'openings_remaining': {}}
        
        for detail in row_details:
            if detail['error']:
                results['errors'].append(f"Row {detail['idx']+2}: {detail['error']}")
                continue
            
            try:
                trainee_id = detail['trainee_id']
                job = detail['job']
                new_status = detail['status']
                
                # Find trainee profile
                trainee_profile = None
                user_info = UserInfo.objects.filter(employeeId=trainee_id).first()
                if not user_info:
                    user_info = UserInfo.objects.filter(email=trainee_id).first()
                if user_info:
                    trainee_profile = user_info.profile
                
                if not trainee_profile:
                    results['errors'].append(f"Row {detail['idx']+2}: Trainee not found")
                    continue
                
                # Get existing lock
                lock = InterviewLock.objects.filter(trainee=trainee_profile, job=job).first()
                if not lock:
                    results['errors'].append(f"Row {detail['idx']+2}: No existing interview lock for this trainee and job")
                    continue
                
                if lock.status in ['selected', 'rejected']:
                    results['errors'].append(f"Row {detail['idx']+2}: Already finalised as {lock.status}")
                    continue
                
                # For selected status, verify openings again (double-check)
                if new_status == 'selected':
                    # Refresh job from database to get latest counts
                    job.refresh_from_db()
                    remaining_openings = job.openings - job.filled
                    
                    if remaining_openings <= 0:
                        results['errors'].append(
                            f"Row {detail['idx']+2}: Job '{job.project_name}' has no openings left. "
                            f"Cannot mark as 'selected'."
                        )
                        continue
                    
                    # Update the lock status
                    lock.status = new_status
                    lock.save()
                    
                    # Update job openings if not already mapped
                    # Check if trainee is already mapped to this job
                    if not (user_info and user_info.isMapped and user_info.projectId == str(job.id)):
                        # Check if trainee is mapped elsewhere
                        if user_info and user_info.isMapped:
                            results['errors'].append(
                                f"Row {detail['idx']+2}: Trainee '{trainee_profile.userInfo.name}' is already mapped to "
                                f"project '{user_info.projectName}'. Please unmap first."
                            )
                            continue
                        
                        # Mark as mapped
                        user_info.isMapped = True
                        user_info.projectId = str(job.id)
                        user_info.projectName = job.project_name
                        user_info.save()
                        
                        # Update job filled count
                        job.filled += 1
                        job.save()
                        
                        results['openings_remaining'][job.id] = job.openings - job.filled
                    
                    results['updated'] += 1
                    
                else:  # rejected status
                    lock.status = new_status
                    lock.save()
                    results['updated'] += 1
                    
            except Exception as e:
                results['errors'].append(f"Row {detail['idx']+2}: {str(e)}")
        
        # Add openings summary to response
        if results['openings_remaining']:
            openings_summary = []
            for job_id, remaining in results['openings_remaining'].items():
                try:
                    job = Job.objects.get(id=job_id)
                    openings_summary.append(f"{job.project_name}: {remaining} openings left")
                except:
                    pass
            results['openings_summary'] = openings_summary
        
        return Response(results, status=200 if results['updated'] > 0 else 400)
# --- Bulk Mapping ---
class DownloadBulkMappingTemplateView(APIView):
    def get(self, request):
        wb = Workbook()
        ws = wb.active
        ws.title = "Bulk Mapping Template"
        ws.append(["Trainee Email/EmpID", "Job ID / Demand ID"])
        ws.append(["emp001@tcs.com", "DEMAND001"])
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="bulk_mapping_template.xlsx"'
        return response

class BulkMappingView(APIView):
    """Bulk map trainees to jobs with proper openings validation"""
    
    def post(self, request):
        file = request.FILES.get('file')
        batch = request.data.get('batch', '')
        
        if not file:
            return Response({
                "success": False,
                "error": "No file uploaded",
                "message": "Please select an Excel file to upload"
            }, status=400)
        
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({
                "success": False,
                "error": "Invalid file format",
                "message": f"Could not read the Excel file: {str(e)}"
            }, status=400)

        df.columns = [c.strip().lower() for c in df.columns]
        col_map = {}
        for col in df.columns:
            if 'trainee' in col:
                col_map['trainee'] = col
            elif 'job' in col:
                col_map['job'] = col
        
        if not all(k in col_map for k in ['trainee','job']):
            return Response({
                "success": False,
                "error": "Missing required columns",
                "message": "Your Excel file must have 'Trainee' and 'Job' columns",
                "found_columns": list(df.columns)
            }, status=400)

        # First pass: count mappings per job
        job_mapping_counts = {}
        mapping_requests = []
        
        for idx, row in df.iterrows():
            trainee_id = str(row[col_map['trainee']]).strip()
            job = resolve_job_identifier(row[col_map['job']], batch=batch if batch else None)
            
            if not job:
                mapping_requests.append({
                    'idx': idx,
                    'error': f"Job '{row[col_map['job']]}' not found in batch '{batch or 'any'}'",
                    'trainee_id': trainee_id,
                    'job': None
                })
                continue
            
            mapping_requests.append({
                'idx': idx,
                'trainee_id': trainee_id,
                'job': job,
                'error': None
            })
            job_mapping_counts[job.id] = job_mapping_counts.get(job.id, 0) + 1
        
        # Validate openings for each job
        openings_errors = []
        for job_id, requested_count in job_mapping_counts.items():
            try:
                job = Job.objects.get(id=job_id)
                if batch and job.batch_name != batch:
                    openings_errors.append({
                        'job': job.project_name,
                        'message': f"Job '{job.project_name}' is not in batch '{batch}'"
                    })
                    continue
                
                remaining_openings = job.openings - job.filled
                if requested_count > remaining_openings:
                    openings_errors.append({
                        'job': job.project_name,
                        'openings_left': remaining_openings,
                        'requested': requested_count,
                        'message': f"Job '{job.project_name}' has only {remaining_openings} opening(s) left, but you're trying to map {requested_count} trainees. Please reduce to {remaining_openings} or fewer."
                    })
            except Job.DoesNotExist:
                openings_errors.append({
                    'job': f"ID {job_id}",
                    'message': f"Job with ID {job_id} not found"
                })
        
        if openings_errors:
            return Response({
                "success": False,
                "error": "Openings validation failed",
                "message": "Cannot process bulk mapping due to job opening constraints",
                "details": openings_errors,
                "suggestion": "Please check your file and reduce the number of mappings for the jobs listed above."
            }, status=400)
        
        # Process mappings
        results = {
            'mapped': 0, 
            'errors': [], 
            'warnings': [],
            'openings_remaining': {},
            'success': True,
            'message': ""
        }
        
        for req in mapping_requests:
            if req['error']:
                results['errors'].append({
                    'row': req['idx'] + 2,
                    'trainee': req['trainee_id'],
                    'message': req['error']
                })
                continue
            
            try:
                trainee_id = req['trainee_id']
                job = req['job']
                
                # Find trainee
                trainee_profile = None
                user_info = UserInfo.objects.filter(employeeId=trainee_id).first()
                if not user_info:
                    user_info = UserInfo.objects.filter(email=trainee_id).first()
                if user_info:
                    trainee_profile = user_info.profile
                
                if not trainee_profile:
                    results['errors'].append({
                        'row': req['idx'] + 2,
                        'trainee': trainee_id,
                        'message': f"Trainee '{trainee_id}' not found in system"
                    })
                    continue
                
                # Check if already mapped
                if user_info.isMapped:
                    results['errors'].append({
                        'row': req['idx'] + 2,
                        'trainee': user_info.name,
                        'current_project': user_info.projectName,
                        'message': f"Trainee '{user_info.name}' is already mapped to '{user_info.projectName}'. Please unmap first if you want to reassign."
                    })
                    continue
                
                # Refresh job to get latest counts
                job.refresh_from_db()
                remaining_openings = job.openings - job.filled
                
                if remaining_openings <= 0:
                    results['errors'].append({
                        'row': req['idx'] + 2,
                        'trainee': user_info.name if user_info else trainee_id,
                        'job': job.project_name,
                        'message': f"Job '{job.project_name}' has no openings left"
                    })
                    continue
                
                # Map the trainee
                user_info.isMapped = True
                user_info.projectId = str(job.id)
                user_info.projectName = job.project_name
                user_info.save()
                
                # Update job filled count
                job.filled += 1
                job.save()
                
                # Track remaining openings
                results['openings_remaining'][job.id] = {
                    'job_name': job.project_name,
                    'remaining': job.openings - job.filled
                }
                results['mapped'] += 1
                
                # Also create/update interview lock as selected
                lock, created = InterviewLock.objects.get_or_create(
                    trainee=trainee_profile,
                    job=job,
                    defaults={
                        'locked_by': request.user,
                        'interview_datetime': datetime.now(),
                        'status': 'selected',
                        'assigned_to': None,
                        'comments': 'Bulk mapped from Excel'
                    }
                )
                if not created and lock.status != 'selected':
                    lock.status = 'selected'
                    lock.save()
                    
            except Exception as e:
                results['errors'].append({
                    'row': req['idx'] + 2,
                    'trainee': trainee_id if 'trainee_id' in locals() else 'Unknown',
                    'message': str(e)
                })
        
        # Set appropriate message
        if results['mapped'] > 0 and len(results['errors']) == 0:
            results['message'] = f"✅ Successfully mapped {results['mapped']} trainee(s)"
        elif results['mapped'] > 0 and len(results['errors']) > 0:
            results['message'] = f"⚠️ Partially successful: Mapped {results['mapped']} trainee(s), but {len(results['errors'])} error(s) occurred"
            results['success'] = False
        else:
            results['message'] = f"❌ Failed to map any trainees. {len(results['errors'])} error(s) occurred"
            results['success'] = False
        
        # Add openings summary
        if results['openings_remaining']:
            openings_list = [f"{data['job_name']}: {data['remaining']} left" for data in results['openings_remaining'].values()]
            results['openings_summary'] = openings_list
        
        status_code = 200 if results['mapped'] > 0 else 400
        return Response(results, status=status_code)
# --- HR Summary Report (Excel with charts) ---
class HRSummaryReportView(APIView):
    """Generate a comprehensive Excel report for the selected batch with embedded charts."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        batch = request.query_params.get('batch', '')
        jobs = Job.objects.all()
        trainees = ProfileRecord.objects.select_related('userInfo').all()
        locks = InterviewLock.objects.select_related('trainee__userInfo', 'job').all()
        if batch:
            jobs = jobs.filter(batch_name=batch)
            trainees = trainees.filter(batch_name=batch)
            locks = locks.filter(job__batch_name=batch) | locks.filter(trainee__batch_name=batch)

        wb = Workbook()
        # Sheet 1: Overview Stats
        ws1 = wb.active
        ws1.title = "Overview"
        total_trainees = trainees.count()
        mapped = trainees.filter(userInfo__isMapped=True).count()
        unmapped = total_trainees - mapped
        active_jobs = jobs.filter(status='active').count()
        locked_count = locks.filter(status='locked').count()
        selected_count = locks.filter(status='selected').count()
        rejected_count = locks.filter(status='rejected').count()
        ws1.append(['HR Summary Report', f'Batch: {batch if batch else "All"}'])
        ws1.append([])
        ws1.append(['Metric', 'Value'])
        ws1.append(['Total Trainees', total_trainees])
        ws1.append(['Mapped Trainees', mapped])
        ws1.append(['Unmapped Trainees', unmapped])
        ws1.append(['Active Jobs', active_jobs])
        ws1.append(['Interview Locks', locked_count])
        ws1.append(['Selected', selected_count])
        ws1.append(['Rejected', rejected_count])

        # Sheet 2: Job Details
        ws2 = wb.create_sheet("Job Details")
        ws2.append(['Job Title', 'Demand ID', 'Department', 'Location', 'Openings', 'Filled', 'Status', 'Batch'])
        for job in jobs:
            ws2.append([job.project_name, job.demand_id or '', '', ', '.join(job.location) if job.location else '',
                        job.openings, job.filled, job.status, job.batch_name or ''])

        # Sheet 3: Trainee Status
        ws3 = wb.create_sheet("Trainee Status")
        ws3.append(['Name', 'Employee ID', 'Location', 'Batch', 'Mapped', 'Project'])
        for t in trainees:
            ws3.append([t.userInfo.name if t.userInfo else '', t.userInfo.employeeId if t.userInfo else '',
                        t.userInfo.location if t.userInfo else '', t.batch_name or '',
                        'Yes' if (t.userInfo and t.userInfo.isMapped) else 'No',
                        t.userInfo.projectName if t.userInfo else ''])

        # Sheet 4: Interview Locks
        ws4 = wb.create_sheet("Interview Locks")
        ws4.append(['Trainee', 'Job', 'Status', 'Interview DateTime', 'Interviewer'])
        for lock in locks:
            ws4.append([lock.trainee.userInfo.name if lock.trainee.userInfo else '',
                        lock.job.project_name, lock.status, lock.interview_datetime.strftime('%Y-%m-%d %H:%M'),
                        lock.assigned_to.username if lock.assigned_to else ''])

        # Sheet 5: Skills Demand
        ws5 = wb.create_sheet("Skills Demand")
        from collections import Counter
        skill_counter = Counter()
        for job in jobs:
            # Parse skills from comma-separated string
            skills_list = [skill.strip() for skill in (job.skills or '').split(',') if skill.strip()]
            for skill in skills_list:
                skill_counter[skill] += 1
        ws5.append(['Skill', 'Count'])
        for skill, count in skill_counter.most_common(20):
            ws5.append([skill, count])

        # Sheet 6: Chart
        chart_sheet = wb.create_sheet("Chart")
        chart = BarChart()
        chart.type = "col"
        chart.title = "Top Skills Demand"
        chart.y_axis.title = 'Number of Jobs'
        chart.x_axis.title = 'Skills'
        data = Reference(ws5, min_col=2, min_row=1, max_row=min(21, len(skill_counter)+1))
        cats = Reference(ws5, min_col=1, min_row=2, max_row=min(21, len(skill_counter)+1))
        chart.add_data(data, titles_from_data=True)
        chart.set_categories(cats)
        chart_sheet.add_chart(chart, "A1")

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="hr_summary_{batch or "all"}.xlsx"'
        return response

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
        skills = [skill.strip() for skill in job.skills.split(',') if skill.strip()][:2]
        job_summaries.append(f"- {job.project_name} ({job.openings} openings, skills: {', '.join(skills)})")
    
    demand_map = {}
    for job in jobs:
        for skill in [skill.strip() for skill in job.skills.split(',') if skill.strip()]:
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



# ---------- HR Summary PDF Report ----------
# ---------- HR Summary PDF Report - Enhanced Version (Fixed) ----------
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.ticker import MaxNLocator, PercentFormatter
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from collections import Counter
from django.db.models import Count, Q, Avg, Sum
from datetime import datetime, timedelta

class HRSummaryPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        batch = request.query_params.get('batch', '')
        
        # ==================== DATA COLLECTION ====================
        
        # Get all data with filters
        jobs = Job.objects.all()
        trainees = ProfileRecord.objects.select_related('userInfo').all()
        locks = InterviewLock.objects.select_related('trainee__userInfo', 'job').all()
        matches = Match.objects.select_related('job_ref', 'trainee_ref__userInfo').all()
        
        if batch:
            jobs = jobs.filter(batch_name=batch)
            trainees = trainees.filter(batch_name=batch)
            locks = locks.filter(Q(job__batch_name=batch) | Q(trainee__batch_name=batch))
            matches = matches.filter(Q(job_ref__batch_name=batch) | Q(trainee_ref__batch_name=batch))
        
        # Basic Statistics
        total_trainees = trainees.count()
        mapped_trainees = trainees.filter(userInfo__isMapped=True).count()
        unmapped_trainees = total_trainees - mapped_trainees
        total_jobs = jobs.count()
        active_jobs = jobs.filter(status='active').count()
        filled_jobs = jobs.filter(status='filled').count()
        inactive_jobs = jobs.filter(status='inactive').count()
        
        # Lock Statistics
        locked_count = locks.filter(status='locked').count()
        selected_count = locks.filter(status='selected').count()
        rejected_count = locks.filter(status='rejected').count()
        cancelled_count = locks.filter(status='cancelled').count()
        
        # Match Statistics
        total_matches = matches.count()
        perfect_matches = matches.filter(bucket='PERFECT_MATCH').count()
        skills_only_matches = matches.filter(bucket='SKILLS_ONLY').count()
        location_only_matches = matches.filter(bucket='LOCATION_ONLY').count()
        nearby_matches = matches.filter(bucket='NEARBY').count()
        no_matches = matches.filter(bucket='NO_MATCH').count()
        
        avg_match_percentage = matches.aggregate(Avg('total_percentage'))['total_percentage__avg'] or 0
        
        # Job-wise Statistics
        job_stats = []
        for job in jobs:
            job_matches = matches.filter(job_ref=job)
            job_locks = locks.filter(job=job)
            
            job_stats.append({
                'name': job.project_name,
                'batch': job.batch_name or 'N/A',
                'openings': job.openings,
                'filled': job.filled,
                'remaining': job.openings - job.filled,
                'fill_rate': (job.filled / job.openings * 100) if job.openings > 0 else 0,
                'total_matches': job_matches.count(),
                'perfect_matches': job_matches.filter(bucket='PERFECT_MATCH').count(),
                'selected': job_locks.filter(status='selected').count(),
                'rejected': job_locks.filter(status='rejected').count(),
                'status': job.status
            })
        
        # Batch-wise Statistics
        batch_names = trainees.values_list('batch_name', flat=True).distinct()
        if batch:
            batch_names = [batch]
        else:
            batch_names = [b for b in batch_names if b]
        
        batch_stats = []
        for batch_name in batch_names:
            if not batch_name:
                continue
                
            batch_trainees = trainees.filter(batch_name=batch_name)
            batch_jobs = jobs.filter(batch_name=batch_name)
            batch_matches = matches.filter(Q(job_ref__batch_name=batch_name) | Q(trainee_ref__batch_name=batch_name))
            batch_locks = locks.filter(Q(job__batch_name=batch_name) | Q(trainee__batch_name=batch_name))
            
            batch_stats.append({
                'name': batch_name,
                'trainee_count': batch_trainees.count(),
                'mapped_count': batch_trainees.filter(userInfo__isMapped=True).count(),
                'mapping_rate': (batch_trainees.filter(userInfo__isMapped=True).count() / batch_trainees.count() * 100) if batch_trainees.count() > 0 else 0,
                'job_count': batch_jobs.count(),
                'total_matches': batch_matches.count(),
                'selected_count': batch_locks.filter(status='selected').count(),
                'rejection_rate': (batch_locks.filter(status='rejected').count() / batch_locks.count() * 100) if batch_locks.count() > 0 else 0
            })
        
        # Skill Demand Analysis
        skill_counter = Counter()
        for job in jobs:
            skills_list = [skill.strip() for skill in (job.skills or '').split(',') if skill.strip()]
            for skill in skills_list:
                skill_counter[skill] += 1
        
        top_skills = skill_counter.most_common(15)
        
        # Trainee Skill Distribution
        trainee_skills = Counter()
        for trainee in trainees:
            for strength in trainee.strengths.all():
                trainee_skills[strength.courseName] += 1
        
        # Skill Gap Analysis
        skill_gaps = []
        for skill, demand_count in skill_counter.items():
            supply_count = trainee_skills.get(skill, 0)
            gap = demand_count - supply_count
            if gap > 0:
                skill_gaps.append({
                    'skill': skill,
                    'demand': demand_count,
                    'supply': supply_count,
                    'gap': gap,
                    'gap_percentage': (gap / demand_count * 100) if demand_count > 0 else 0
                })
        skill_gaps.sort(key=lambda x: x['gap'], reverse=True)
        top_skill_gaps = skill_gaps[:10]
        
        # Location Analysis
        location_counts = Counter()
        for trainee in trainees:
            if trainee.userInfo and trainee.userInfo.location:
                location_counts[trainee.userInfo.location.title()] += 1
        
        job_locations = Counter()
        for job in jobs:
            if job.location:
                if isinstance(job.location, list):
                    for loc in job.location:
                        job_locations[loc.title()] += 1
                else:
                    job_locations[job.location.title()] += 1
        
        # Monthly Trends (last 6 months) - Fixed version without updated_at
        today = datetime.now().date()
        six_months_ago = today - timedelta(days=180)
        
        monthly_locks = []
        monthly_matches = []
        monthly_mappings = []
        
        for i in range(6):
            month_start = (today.replace(day=1) - timedelta(days=30*i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            
            month_locks = locks.filter(created_at__date__gte=month_start, created_at__date__lt=month_end).count()
            month_matches = matches.filter(created_at__date__gte=month_start, created_at__date__lt=month_end).count()
            # For mappings, count trainees where isMapped became True during this period
            # Since we don't have updated_at, we'll use a different approach - count locks with status='selected'
            month_mappings = locks.filter(status='selected', created_at__date__gte=month_start, created_at__date__lt=month_end).count()
            
            monthly_locks.append(month_locks)
            monthly_matches.append(month_matches)
            monthly_mappings.append(month_mappings)
        
        months_labels = [(today - timedelta(days=30*i)).strftime('%b %Y') for i in range(5, -1, -1)]
        
        # ==================== CREATE CHARTS ====================
        chart_images = []
        
        # 1. Overall Status Dashboard Chart
        fig, axes = plt.subplots(2, 2, figsize=(10, 8))
        
        # Top-left: Trainee Status Pie
        axes[0, 0].pie([mapped_trainees, unmapped_trainees], 
                       labels=['Mapped', 'Unmapped'], 
                       autopct='%1.1f%%',
                       colors=['#10b981', '#ef4444'],
                       explode=(0.05, 0))
        axes[0, 0].set_title('Trainee Mapping Status', fontsize=12, fontweight='bold')
        
        # Top-right: Job Status Pie
        job_status_data = [active_jobs, filled_jobs, inactive_jobs]
        job_status_labels = ['Active', 'Filled', 'Inactive']
        # Filter out zero values
        filtered_data = [(job_status_labels[i], job_status_data[i]) for i in range(3) if job_status_data[i] > 0]
        if filtered_data:
            labels, values = zip(*filtered_data)
            axes[0, 1].pie(values, labels=labels, autopct='%1.1f%%',
                          colors=['#3b82f6', '#10b981', '#6b7280'])
        axes[0, 1].set_title('Job Status Distribution', fontsize=12, fontweight='bold')
        
        # Bottom-left: Interview Status Bar
        interview_data = [locked_count, selected_count, rejected_count, cancelled_count]
        interview_labels = ['Locked', 'Selected', 'Rejected', 'Cancelled']
        interview_colors = ['#fbbf24', '#10b981', '#ef4444', '#6b7280']
        bars = axes[1, 0].bar(interview_labels, interview_data, color=interview_colors)
        axes[1, 0].set_title('Interview Status Overview', fontsize=12, fontweight='bold')
        axes[1, 0].set_ylabel('Count')
        for bar, val in zip(bars, interview_data):
            if val > 0:
                axes[1, 0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, str(val), ha='center', va='bottom')
        
        # Bottom-right: Match Distribution
        match_data = [perfect_matches, skills_only_matches, location_only_matches, nearby_matches, no_matches]
        match_labels = ['Perfect', 'Skills Only', 'Location Only', 'Nearby', 'No Match']
        match_colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
        bars = axes[1, 1].bar(match_labels, match_data, color=match_colors)
        axes[1, 1].set_title('Match Distribution', fontsize=12, fontweight='bold')
        axes[1, 1].set_ylabel('Count')
        plt.setp(axes[1, 1].xaxis.get_majorticklabels(), rotation=45, ha='right')
        for bar, val in zip(bars, match_data):
            if val > 0:
                axes[1, 1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, str(val), ha='center', va='bottom')
        
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        chart_images.append(('dashboard_overview', buf))
        
        # 2. Top Skills Demand Chart
        if top_skills:
            fig, ax = plt.subplots(figsize=(10, 6))
            skills, counts = zip(*top_skills[:10])
            bars = ax.barh(skills, counts, color='#3b82f6')
            ax.set_xlabel('Number of Jobs', fontsize=11)
            ax.set_title('Top 10 Skills in Demand', fontsize=14, fontweight='bold')
            ax.invert_yaxis()
            for bar, val in zip(bars, counts):
                ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2, str(val), ha='left', va='center')
            plt.tight_layout()
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            chart_images.append(('top_skills_demand', buf))
        
        # 3. Skill Gaps Chart
        if top_skill_gaps:
            fig, ax = plt.subplots(figsize=(10, 6))
            gap_data = top_skill_gaps[:8]
            skills = [g['skill'] for g in gap_data]
            demands = [g['demand'] for g in gap_data]
            supplies = [g['supply'] for g in gap_data]
            
            x = np.arange(len(skills))
            width = 0.35
            
            bars1 = ax.bar(x - width/2, demands, width, label='Demand', color='#ef4444')
            bars2 = ax.bar(x + width/2, supplies, width, label='Supply', color='#10b981')
            
            ax.set_xlabel('Skills', fontsize=11)
            ax.set_ylabel('Count', fontsize=11)
            ax.set_title('Skill Gap Analysis (Demand vs Supply)', fontsize=14, fontweight='bold')
            ax.set_xticks(x)
            ax.set_xticklabels(skills, rotation=45, ha='right')
            ax.legend()
            
            plt.tight_layout()
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            chart_images.append(('skill_gaps', buf))
        
        # 4. Monthly Trends Line Chart
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.plot(months_labels, monthly_locks, marker='o', label='Interview Locks', linewidth=2, markersize=6, color='#fbbf24')
        ax.plot(months_labels, monthly_matches, marker='s', label='Matches Generated', linewidth=2, markersize=6, color='#3b82f6')
        ax.plot(months_labels, monthly_mappings, marker='^', label='Selected/Hired', linewidth=2, markersize=6, color='#10b981')
        ax.set_xlabel('Month', fontsize=11)
        ax.set_ylabel('Count', fontsize=11)
        ax.set_title('Monthly Activity Trends (Last 6 Months)', fontsize=14, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        chart_images.append(('monthly_trends', buf))
        
        # 5. Location Distribution
        if location_counts:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
            
            top_locations = location_counts.most_common(8)
            loc_names, loc_counts = zip(*top_locations)
            bars = ax1.bar(loc_names, loc_counts, color='#8b5cf6')
            ax1.set_title('Top Trainee Locations', fontsize=12, fontweight='bold')
            ax1.set_ylabel('Number of Trainees')
            plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha='right')
            for bar, val in zip(bars, loc_counts):
                ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, str(val), ha='center', va='bottom')
            
            top_job_locs = job_locations.most_common(8)
            if top_job_locs:
                loc_names2, loc_counts2 = zip(*top_job_locs)
                bars = ax2.bar(loc_names2, loc_counts2, color='#f59e0b')
                ax2.set_title('Top Job Locations', fontsize=12, fontweight='bold')
                ax2.set_ylabel('Number of Jobs')
                plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right')
                for bar, val in zip(bars, loc_counts2):
                    ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, str(val), ha='center', va='bottom')
            
            plt.tight_layout()
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            chart_images.append(('location_distribution', buf))
        
        # 6. Fill Rate Distribution
        if job_stats:
            fig, ax = plt.subplots(figsize=(10, 5))
            fill_rates = [j['fill_rate'] for j in job_stats if j['fill_rate'] > 0]
            if fill_rates:
                bins = [0, 20, 40, 60, 80, 100]
                ax.hist(fill_rates, bins=bins, color='#10b981', edgecolor='black', alpha=0.7)
                ax.set_xlabel('Fill Rate (%)', fontsize=11)
                ax.set_ylabel('Number of Jobs', fontsize=11)
                ax.set_title('Job Fill Rate Distribution', fontsize=14, fontweight='bold')
                ax.grid(True, alpha=0.3)
            plt.tight_layout()
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            chart_images.append(('fill_rate_distribution', buf))
        
        # 7. Batch Performance Comparison
        if batch_stats and len(batch_stats) > 1:
            fig, ax = plt.subplots(figsize=(12, 6))
            batch_names = [b['name'][:20] for b in batch_stats]
            mapping_rates = [b['mapping_rate'] for b in batch_stats]
            bars = ax.bar(batch_names, mapping_rates, color='#3b82f6')
            ax.set_xlabel('Batch', fontsize=11)
            ax.set_ylabel('Mapping Rate (%)', fontsize=11)
            ax.set_title('Batch-wise Trainee Mapping Performance', fontsize=14, fontweight='bold')
            ax.set_ylim(0, 100)
            plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
            for bar, val in zip(bars, mapping_rates):
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{val:.1f}%', ha='center', va='bottom')
            plt.tight_layout()
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            chart_images.append(('batch_performance', buf))
        
        # 8. Hiring Funnel Chart
        fig, ax = plt.subplots(figsize=(8, 6))
        funnel_stages = ['Total Matches', 'Interview Locks', 'Selected', 'Mapped']
        funnel_counts = [total_matches, locked_count, selected_count, mapped_trainees]
        bars = ax.barh(funnel_stages, funnel_counts, color=['#3b82f6', '#fbbf24', '#10b981', '#8b5cf6'])
        ax.set_xlabel('Count', fontsize=11)
        ax.set_title('Hiring Funnel (Match to Hire)', fontsize=14, fontweight='bold')
        for bar, val in zip(bars, funnel_counts):
            ax.text(bar.get_width() + 5, bar.get_y() + bar.get_height()/2, str(val), ha='left', va='center')
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        chart_images.append(('hiring_funnel', buf))
        
        # ==================== BUILD PDF ====================
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=18, spaceAfter=20, alignment=TA_CENTER)
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceAfter=12, textColor=colors.HexColor('#1e40af'))
        subheading_style = ParagraphStyle('SubHeading', parent=styles['Heading3'], fontSize=12, spaceAfter=8, textColor=colors.HexColor('#3b82f6'))
        normal_style = styles['Normal']
        
        # Cover Page
        elements.append(Paragraph("Talent Align - HR Analytics Report", title_style))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"<b>Batch:</b> {batch if batch else 'All Batches'}", normal_style))
        elements.append(Paragraph(f"<b>Generated On:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", normal_style))
        elements.append(Spacer(1, 30))
        
        # Executive Summary
        elements.append(PageBreak())
        elements.append(Paragraph("Executive Summary", heading_style))
        
        summary_box_data = [
            ['Total Trainees', str(total_trainees), 'Total Jobs', str(total_jobs)],
            ['Mapped Trainees', f"{mapped_trainees} ({mapped_trainees/total_trainees*100:.1f}%)" if total_trainees > 0 else '0', 'Active Jobs', str(active_jobs)],
            ['Unmapped Trainees', f"{unmapped_trainees} ({unmapped_trainees/total_trainees*100:.1f}%)" if total_trainees > 0 else '0', 'Fill Rate', f"{(filled_jobs/total_jobs*100):.1f}%" if total_jobs > 0 else '0%'],
            ['Total Matches', str(total_matches), 'Avg Match Score', f"{avg_match_percentage:.1f}%"],
            ['Selected Candidates', str(selected_count), 'Rejection Rate', f"{(rejected_count/locks.count()*100):.1f}%" if locks.count() > 0 else '0%'],
        ]
        
        summary_table = Table(summary_box_data, colWidths=[120, 100, 120, 100])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.Color(0.23, 0.44, 0.96)),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,1), (-1,-1), colors.Color(0.97, 0.97, 0.97)),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
        
        # All Charts
        for name, img_buf in chart_images:
            elements.append(KeepTogether([
                Paragraph(name.replace('_', ' ').title(), heading_style),
                Spacer(1, 6),
                RLImage(img_buf, width=500, height=350),
                Spacer(1, 15)
            ]))
        
        # Job-wise Detailed Table
        elements.append(PageBreak())
        elements.append(Paragraph("Job-wise Performance Analysis", heading_style))
        
        job_detail_data = [['Job Title', 'Batch', 'Openings', 'Filled', 'Remaining', 'Fill Rate', 'Matches', 'Selected', 'Rejected', 'Status']]
        for job in job_stats[:20]:
            job_detail_data.append([
                job['name'][:30], job['batch'], str(job['openings']), str(job['filled']), 
                str(job['remaining']), f"{job['fill_rate']:.1f}%", str(job['total_matches']),
                str(job['selected']), str(job['rejected']), job['status']
            ])
        
        job_table = Table(job_detail_data, colWidths=[100, 50, 50, 50, 50, 50, 50, 50, 50, 60])
        job_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.Color(0.23, 0.44, 0.96)),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.3, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(job_table)
        
        # Batch-wise Analysis
        if batch_stats:
            elements.append(PageBreak())
            elements.append(Paragraph("Batch-wise Performance Analysis", heading_style))
            
            batch_detail_data = [['Batch Name', 'Trainees', 'Mapped', 'Mapping Rate', 'Jobs', 'Matches', 'Selected', 'Rejection Rate']]
            for batch_stat in batch_stats:
                batch_detail_data.append([
                    batch_stat['name'], str(batch_stat['trainee_count']), str(batch_stat['mapped_count']),
                    f"{batch_stat['mapping_rate']:.1f}%", str(batch_stat['job_count']), str(batch_stat['total_matches']),
                    str(batch_stat['selected_count']), f"{batch_stat['rejection_rate']:.1f}%"
                ])
            
            batch_table = Table(batch_detail_data, colWidths=[100, 60, 60, 60, 50, 60, 60, 70])
            batch_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.Color(0.23, 0.44, 0.96)),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('GRID', (0,0), (-1,-1), 0.3, colors.grey),
            ]))
            elements.append(batch_table)
        
        # Skill Gap Analysis Table
        if top_skill_gaps:
            elements.append(PageBreak())
            elements.append(Paragraph("Critical Skill Gaps (Urgent Hiring Needs)", heading_style))
            
            skill_gap_data = [['Skill', 'Jobs Requiring', 'Available Trainees', 'Gap', 'Gap Percentage', 'Priority']]
            for gap in top_skill_gaps[:10]:
                priority = 'Critical' if gap['gap_percentage'] > 70 else 'High' if gap['gap_percentage'] > 50 else 'Medium' if gap['gap_percentage'] > 30 else 'Low'
                skill_gap_data.append([
                    gap['skill'], str(gap['demand']), str(gap['supply']), str(gap['gap']), 
                    f"{gap['gap_percentage']:.1f}%", priority
                ])
            
            skill_table = Table(skill_gap_data, colWidths=[120, 80, 80, 60, 70, 70])
            skill_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.Color(0.23, 0.44, 0.96)),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('GRID', (0,0), (-1,-1), 0.3, colors.grey),
            ]))
            elements.append(skill_table)
        
        # Top Performing Jobs
        elements.append(PageBreak())
        elements.append(Paragraph("Top 10 Jobs by Fill Rate", heading_style))
        
        top_jobs = sorted(job_stats, key=lambda x: x['fill_rate'], reverse=True)[:10]
        top_jobs_data = [['Rank', 'Job Title', 'Batch', 'Fill Rate', 'Openings', 'Filled', 'Matches']]
        for idx, job in enumerate(top_jobs, 1):
            top_jobs_data.append([
                str(idx), job['name'][:35], job['batch'], f"{job['fill_rate']:.1f}%",
                str(job['openings']), str(job['filled']), str(job['total_matches'])
            ])
        
        top_jobs_table = Table(top_jobs_data, colWidths=[40, 150, 60, 60, 50, 50, 60])
        top_jobs_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.Color(0.23, 0.44, 0.96)),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.3, colors.grey),
        ]))
        elements.append(top_jobs_table)
        
        # Recommendations Section
        elements.append(PageBreak())
        elements.append(Paragraph("Key Insights & Recommendations", heading_style))
        
        recommendations = []
        
        if unmapped_trainees > mapped_trainees:
            recommendations.append(f"• High number of unmapped trainees ({unmapped_trainees}). Focus on matching them with open positions.")
        
        if skill_gaps:
            top_gap = top_skill_gaps[0] if top_skill_gaps else None
            if top_gap:
                recommendations.append(f"• Critical skill gap detected for '{top_gap['skill']}' with {top_gap['gap']} unfilled positions. Consider upskilling programs.")
        
        if selected_count > 0 and locked_count > 0 and selected_count < locked_count * 0.3:
            recommendations.append("• Low conversion rate from interview locks to selections. Review interview process.")
        
        if avg_match_percentage < 50:
            recommendations.append("• Low average match percentage. Consider updating job requirements or trainee skill assessments.")
        
        for job in job_stats[:3]:
            if job['remaining'] > 0 and job['total_matches'] > 0:
                recommendations.append(f"• Job '{job['name']}' has {job['remaining']} openings with {job['total_matches']} matches. Prioritize mapping.")
        
        if not recommendations:
            recommendations.append("• All metrics are looking good! Continue with current strategy.")
        
        for rec in recommendations:
            elements.append(Paragraph(rec, normal_style))
            elements.append(Spacer(1, 6))
        
        # Footer
        elements.append(Spacer(1, 30))
        elements.append(Paragraph(f"<i>Report generated by Talent Align HR Analytics System on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</i>", normal_style))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f'hr_summary_{batch if batch else "all"}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
# Add this to your views.py - Cancel Selection/Rejection endpoint
class CancelCandidateSelectionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, lock_id):
        try:
            lock = InterviewLock.objects.get(id=lock_id)
        except InterviewLock.DoesNotExist:
            return Response({"error": "Lock not found"}, status=404)
        
        # Store original status for logging
        original_status = lock.status
        
        # Get the trainee and job
        trainee = lock.trainee
        job = lock.job
        user_info = trainee.userInfo
        
        # Check if trainee is mapped to this job
        is_mapped = (user_info.isMapped and user_info.projectId == str(job.id))
        
        # If status was 'selected' and trainee is mapped, restore job openings
        if lock.status == 'selected' and is_mapped:
            # Unmap the trainee
            user_info.isMapped = False
            user_info.projectId = ''
            user_info.projectName = ''
            user_info.save()
            
            # Restore job openings
            job.filled = max(0, job.filled - 1)
            if job.status == 'filled' or job.status == 'inactive':
                job.status = 'active'
            job.save()
        
        # Update lock status to 'cancelled'
        lock.status = 'cancelled'
        lock.save()
        
        # Log activity
        from django.core.cache import cache
        activity_key = f"recent_activity_{request.user.id}"
        activity_list = cache.get(activity_key, [])
        activity_list.insert(0, {
            'type': 'Cancelled',
            'trainee': user_info.name if user_info else 'Unknown',
            'job': job.project_name,
            'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'original_status': original_status
        })
        cache.set(activity_key, activity_list[:20], 3600)
        
        return Response({
            "message": f"Cancelled {original_status} for {user_info.name}",
            "job_restored": is_mapped and original_status == 'selected',
            "job_id": job.id,
            "job_openings_remaining": job.openings - job.filled
        }, status=200)