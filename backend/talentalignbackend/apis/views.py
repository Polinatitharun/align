import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.views import TokenObtainPairView
from .tokens import CustomTokenObtainPairSerializer



from .serializers import (
    UserSerializer,
    AddUserSerializer,
    EditUserSerializer,
    ResetPasswordSerializer,

)

User = get_user_model()


# 🔐 LOGIN
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# 👤 ADD SINGLE USER
class AddUserView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        # if request.user.role != 'admin':
        #     return Response({"error": "Permission denied"}, status=403)

        serializer = AddUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created"}, status=201)

        return Response(serializer.errors, status=400)


# 📁 BULK EXCEL UPLOAD
class UploadAddExcelView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({"error": f"Invalid Excel file: {str(e)}"}, status=400)

        created_users = []

        # Standardize column names (optional but good practice)
        df.columns = [c.lower().strip() for c in df.columns]

        # Ensure password column exists
        if 'password' not in df.columns:
            df['password'] = None
            
        # # Ensure name columns exist
        # if 'first_name' not in df.columns:
        #     df['first_name'] = ""
        # if 'last_name' not in df.columns:
        #     df['last_name'] = ""

        for _, row in df.iterrows():
            if User.objects.filter(username=row['username']).exists():
                continue

            # 1. Handle Password Logic
            password = row['password']
            if pd.isna(password) or str(password).strip() == "":
                password = "Tcs#12345"
            else:
                password = str(password)

            # 2. Handle Name Logic (Convert NaN to empty string)
            # first_name = row['first_name']
            # if pd.isna(first_name): 
            #     first_name = ""
            
            # last_name = row['last_name']
            # if pd.isna(last_name): 
            #     last_name = ""

            User.objects.create_user(
                username=row['username'],
                email=row['email'],
                password=password,
                # first_name=str(first_name),
                # last_name=str(last_name),
                role=row['role'],
                is_active=True
            )
            created_users.append(row['username'])

        return Response({"created_users": created_users}, status=201)


# 👁️ LIST USERS
class UserListView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


# ✏️ EDIT USER
class EditUserView(APIView):
    # permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Uses EditUserSerializer which now includes first_name and last_name
        serializer = EditUserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User updated", "data": serializer.data})

        return Response(serializer.errors, status=400)


# 🔁 ACTIVATE / DEACTIVATE USER
class ToggleUserStatusView(APIView):
    # permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        return Response({"status": "updated"})


# ❌ DELETE USER
class DeleteUserView(APIView):
    # permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        User.objects.filter(id=user_id).delete()
        return Response({"message": "User deleted"})


# 🔐 RESET PASSWORD
class ResetPasswordView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        serializer = ResetPasswordSerializer(data=request.data)

        if serializer.is_valid():
            user = User.objects.get(id=user_id)
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({"message": "Password reset successful"})

        return Response(serializer.errors, status=400)



class UploadBulkDeleteUsersView(APIView):
    # permission_classes = [IsAuthenticated]

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

        return Response({
            "deleted_users": deleted_users
        }, status=200)



class UploadBulkActivateUsersView(APIView):
    # permission_classes = [IsAuthenticated]

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

        return Response({
            "activated_users": activated_users
        }, status=200)



class UploadBulkDeactivateUsersView(APIView):
    # permission_classes = [IsAuthenticated]

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

        return Response({
            "deactivated_users": deactivated_users
        }, status=200)



# views.py - Job Management Views
import pandas as pd
import threading
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse
import json
from datetime import datetime
from django.core.exceptions import ValidationError

from .models import Job
from .serializers import JobSerializer


from .matching_engine import run_matching_logic

class JobListView(APIView):
    # permission_classes = [IsAuthenticated]
    
    def get(self, request):
        jobs = Job.objects.all()
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()

            t = threading.Thread(target=run_matching_logic, daemon=True)
            t.start()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobDetailView(APIView):
    # permission_classes = [IsAuthenticated]
    
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
        return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, pk):
        job = self.get_object(pk)
        if job:
            serializer = JobSerializer(job, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        job = self.get_object(pk)
        if job:
            job.delete()
            return Response({"message": "Job deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

class ToggleJobStatusView(APIView):
    # permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            job.status = 'inactive' if job.status == 'active' else 'active'
            job.save()
            serializer = JobSerializer(job)
            return Response(serializer.data)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

# class UploadExcelView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         file = request.FILES.get('file')
#         if not file:
#             return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Read Excel file
#             df = pd.read_excel(file)
#             created_jobs = []
#             errors = []
            
#             # Process each row
#             for index, row in df.iterrows():
#                 try:
#                     # Parse location (comma-separated string to list)
#                     location_str = str(row.get('Location', ''))
#                     locations = [loc.strip() for loc in location_str.split(',') if loc.strip()]
                    
#                     # Parse skills (comma-separated strings to lists)
#                     tech_skills_str = str(row.get('Tech Skills', ''))
#                     tech_skills = [skill.strip() for skill in tech_skills_str.split(',') if skill.strip()]
                    
#                     soft_skills_str = str(row.get('Soft Skills', ''))
#                     soft_skills = [skill.strip() for skill in soft_skills_str.split(',') if skill.strip()]
                    
#                     # Create job data dictionary
#                     job_data = {
#                         'title': str(row.get('Title', '')).strip(),
#                         'department': str(row.get('Department', '')).strip(),
#                         'location': locations,
#                         'openings': int(row.get('Openings', 1)),
#                         'requirements': str(row.get('Requirements', '')).strip(),
#                         'techSkills': tech_skills,
#                         'softSkills': soft_skills,
#                         'description': str(row.get('Description', '')).strip(),
#                         'expiryDate': str(row.get('Expiry Date', '')).strip(),
#                         'status': 'active',
#                         'filled': 0,
#                         'matches': 0,
#                         'postedDate': datetime.now().strftime('%Y-%m-%d')
#                     }
                    
#                     # Validate and create job
#                     serializer = JobSerializer(data=job_data)
#                     if serializer.is_valid():
#                         job = serializer.save()
#                         created_jobs.append(job.title)
#                     else:
#                         errors.append(f"Row {index + 2}: {serializer.errors}")
                        
#                 except Exception as e:
#                     errors.append(f"Row {index + 2}: {str(e)}")
            
#             response_data = {
#                 "message": f"Successfully processed {len(created_jobs)} jobs",
#                 "created_jobs": created_jobs
#             }
            
#             if errors:
#                 response_data["errors"] = errors[:10]  # Show first 10 errors
            
#             return Response(response_data, status=status.HTTP_201_CREATED)
            
#         except Exception as e:
#             return Response({"error": f"Error processing file: {str(e)}"}, 
#                           status=status.HTTP_400_BAD_REQUEST)


class UploadExcelView(APIView):
    # permission_classes = [IsAuthenticated]
    
    def post(self, request):
        file = request.FILES.get('excel_file')  # Changed from 'file' to 'excel_file'
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check file extension
        if not file.name.endswith(('.xlsx', '.xls', '.csv')):
            return Response({"error": "Invalid file type. Please upload Excel files (.xlsx, .xls, .csv)"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Read Excel file
            df = pd.read_excel(file)
            created_jobs = []
            errors = []
            
            # Required columns
            required_columns = [
                'Title', 'Department', 'Location', 'Openings', 
                'Requirements', 'Tech Skills', 'Soft Skills', 
                'Description', 'Expiry Date'
            ]
            
            # Check if all required columns exist
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return Response({
                    "error": f"Missing required columns in Excel: {', '.join(missing_columns)}",
                    "expected_columns": required_columns,
                    "found_columns": list(df.columns)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process each row
            for index, row in df.iterrows():
                try:
                    # Skip empty rows
                    if pd.isna(row.get('Title')):
                        continue
                    
                    # Parse location (comma-separated string to list)
                    location_str = str(row.get('Location', ''))
                    locations = [loc.strip() for loc in location_str.split(',') if loc.strip()]
                    
                    # Parse skills (comma-separated strings to lists)
                    tech_skills_str = str(row.get('Tech Skills', ''))
                    tech_skills = [skill.strip() for skill in tech_skills_str.split(',') if skill.strip()]
                    
                    soft_skills_str = str(row.get('Soft Skills', ''))
                    soft_skills = [skill.strip() for skill in soft_skills_str.split(',') if skill.strip()]
                    
                    # Convert openings to integer
                    openings = row.get('Openings', 1)
                    try:
                        openings = int(openings)
                    except (ValueError, TypeError):
                        openings = 1
                    
                    # Handle expiry date
                    expiry_date = row.get('Expiry Date', '')
                    if pd.isna(expiry_date):
                        expiry_date = ''
                    else:
                        # Convert to string if it's a date/datetime
                        if isinstance(expiry_date, (pd.Timestamp, datetime)):
                            expiry_date = expiry_date.strftime('%Y-%m-%d')
                        else:
                            expiry_date = str(expiry_date).strip()
                    
                    # Create job data dictionary
                    job_data = {
                        'title': str(row.get('Title', '')).strip(),
                        'department': str(row.get('Department', '')).strip(),
                        'location': locations,
                        'openings': openings,
                        'requirements': str(row.get('Requirements', '')).strip(),
                        'techSkills': tech_skills,
                        'softSkills': soft_skills,
                        'description': str(row.get('Description', '')).strip(),
                        'expiryDate': expiry_date,
                        'status': 'active',
                        'filled': 0,
                        'matches': 0,
                        'postedDate': datetime.now().strftime('%Y-%m-%d')
                    }
                    
                    # Validate and create job
                    serializer = JobSerializer(data=job_data)
                    if serializer.is_valid():
                        job = serializer.save()
                        created_jobs.append(job.title)
                    else:
                        errors.append(f"Row {index + 2}: {serializer.errors}")
                        
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")

            if created_jobs:
                print(f"Excel upload :{len(created_jobs)} jobs created. Starting matching engine..")
                threading.Thread(target=run_matching_logic).start()
            response_data = {
                "message": f"Successfully processed {len(created_jobs)} jobs",
                "created_jobs": len(created_jobs),
                "job_titles": created_jobs
            }
            
            if errors:
                response_data["errors"] = errors[:10]  # Show first 10 errors
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": f"Error processing file: {str(e)}"}, 
                          status=status.HTTP_400_BAD_REQUEST)
from rest_framework.parsers import MultiPartParser, FormParser
class UploadWordView(APIView):
    # permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        # For Word document processing, you might need to install python-docx
        # pip install python-docx
        from docx import Document
        
        file = request.FILES.get('wordFile')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Read Word document
            doc = Document(file)
            
            # Extract text from document
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            
            # Parse the document content
            # This is a simple parser - you might need to adjust based on your template
            content = '\n'.join(full_text)
            created_jobs = []
            
            # Simple parsing logic - adjust based on your Word template structure
            # Example format:
            # Job Title: Frontend Developer
            # Department: Technology
            # Locations: Hyderabad, Bangalore
            # ...
            
            job_data = self.parse_word_content(content)
            if job_data:
                serializer = JobSerializer(data=job_data)
                if serializer.is_valid():
                    job = serializer.save()
                    threading.Thread(target=run_matching_logic).start()

                    created_jobs.append(job.title)
                    return Response({
                        "message": "Job created successfully from Word document",
                        "created_jobs": created_jobs
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({"error": serializer.errors}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Could not parse Word document"}, 
                              status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": f"Error processing Word document: {str(e)}"}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    def parse_word_content(self, content):
        # Implement your parsing logic here
        # This is a basic example
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
                    job_data['techSkills'] = [skill.strip() for skill in value.split(',')]
                elif 'soft' in key and 'skill' in key:
                    job_data['softSkills'] = [skill.strip() for skill in value.split(',')]
                elif 'description' in key:
                    job_data['description'] = value
                elif 'expiry' in key or 'deadline' in key:
                    job_data['expiryDate'] = value
        
        # Add default values
        job_data.update({
            'status': 'active',
            'filled': 0,
            'matches': 0,
            'postedDate': datetime.now().strftime('%Y-%m-%d')
        })
        
        return job_data

class DownloadExcelTemplateView(APIView):
    # permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import io
        from openpyxl import Workbook
        
        # Create a new workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Job Template"
        
        # Add headers
        headers = [
            'Title',
            'Department', 
            'Location',
            'Openings',
            'Requirements',
            'Tech Skills',
            'Soft Skills',
            'Description',
            'Expiry Date'
        ]
        
        for col, header in enumerate(headers, 1):
            ws.cell(row=1, column=col, value=header)
        
        # Add sample data
        sample_data = [
            'Frontend Developer',
            'Technology',
            'Hyderabad,Bangalore',
            '3',
            '3+ years React experience, strong JavaScript fundamentals',
            'React,JavaScript,TypeScript,CSS,HTML5',
            'Communication,Teamwork,Problem Solving',
            'Develop and maintain responsive web applications using modern frontend technologies',
            '2024-03-15'
        ]
        
        for col, data in enumerate(sample_data, 1):
            ws.cell(row=2, column=col, value=data)
        
        # Create response
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="job_template.xlsx"'
        
        return response

class DownloadWordTemplateView(APIView):
    # permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from docx import Document
        from docx.shared import Inches
        import io
        
        # Create a new document
        doc = Document()
        
        # Add title
        doc.add_heading('Job Profile Template', 0)
        
        # Add instructions
        doc.add_paragraph('Instructions: Fill in the details below for each job position.')
        doc.add_paragraph('')
        
        # Add template fields
        doc.add_paragraph('Job Title: Enter Job Title')
        doc.add_paragraph('')

        doc.add_paragraph('Department: Enter Department')
        doc.add_paragraph('')

        doc.add_paragraph('Locations: Enter comma-separated locations, e.g., Hyderabad, Bangalore')
        doc.add_paragraph('')

        doc.add_paragraph('Openings: Enter number of openings')
        doc.add_paragraph('')

        doc.add_paragraph('Requirements and qualifications: your requirements...')
        doc.add_paragraph('')

        doc.add_paragraph('Tech Skill: Enter comma-separated skills (java, python)')
        # doc.add_paragraph('[List technical skills and qualifications, one per line]')
        doc.add_paragraph('')
        doc.add_paragraph('Soft Skills: Enter comma-separated skills')
        doc.add_paragraph('')

        # doc.add_paragraph('[List desired soft skills, one per line]')
        doc.add_paragraph('')
        doc.add_paragraph('Description: Your job description')
        doc.add_paragraph('')

        # doc.add_paragraph('[Describe the job role, responsibilities, and expectations]')
        
        doc.add_paragraph('Application Deadline: [YYYY-MM-DD]')
        
        # Save to buffer
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = 'attachment; filename="job_template.docx"'
        
        return response


from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ProfileRecord
from .serializers import ProfileRecordSerializer


class ProfileListCreateAPIView(APIView):
    """
    GET /api/profiles/      -> list all profiles
    POST /api/profiles/     -> create a single profile
    """

    def get(self, request, *args, **kwargs):
        qs = (
            ProfileRecord.objects
            .select_related('userInfo')
            .prefetch_related('strengths', 'weaknesses')
            .all()
        )
        serializer = ProfileRecordSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = ProfileRecordSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            # return serialized data (including nested userInfo/strengths/weaknesses)
            out = ProfileRecordSerializer(instance).data
            return Response(out, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileDetailAPIView(APIView):
    """
    GET    /api/profiles/<userId>/ -> retrieve by userId
    PUT    /api/profiles/<userId>/ -> full update by userId
    PATCH  /api/profiles/<userId>/ -> partial update by userId
    DELETE /api/profiles/<userId>/ -> delete by userId
    """

    def get_object(self, userId: str) -> ProfileRecord:
        # Changed from pk to userId
        return get_object_or_404(
            ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses'),
            userInfo__userId=userId
        )

    def get(self, request, userId: str, *args, **kwargs):  # Changed parameter
        instance = self.get_object(userId)
        serializer = ProfileRecordSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, userId: str, *args, **kwargs):  # Changed parameter
        instance = self.get_object(userId)
        serializer = ProfileRecordSerializer(instance, data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response(ProfileRecordSerializer(instance).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, userId: str, *args, **kwargs):  # Changed parameter
        instance = self.get_object(userId)
        serializer = ProfileRecordSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            instance = serializer.save()
            return Response(ProfileRecordSerializer(instance).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, userId: str, *args, **kwargs):  # Changed parameter
        instance = self.get_object(userId)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class BulkUploadProfilesAPIView(APIView):
    """
    POST /api/profiles/bulk-upload/ -> bulk create/update array of JSONs

    - Accepts a list of objects (your 100 JSONs).
    - Uses ProfileRecordSerializer's create() (with upsert by external_id if provided).
    """

    def post(self, request, *args, **kwargs):
        if not isinstance(request.data, list):
            return Response({"detail": "Expected a list of JSON objects."}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        errors = []
        outputs = []

        for idx, payload in enumerate(request.data):
            serializer = ProfileRecordSerializer(data=payload)
            if serializer.is_valid():
                instance = serializer.save()
                outputs.append(ProfileRecordSerializer(instance).data)
                created_count += 1
            else:
                errors.append({"index": idx, "errors": serializer.errors})

        resp = {
            "created": created_count,
            "failed": len(errors),
            "errors": errors,
            "records": outputs,  # optional: return created/updated records
        }
        status_code = status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS
        return Response(resp, status=status_code)


from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserInfo

# Import BOTH serializers
from .serializers import UserInfoSerializer, UserInfoMappingSerializer  # Add UserInfoMappingSerializer
from django.shortcuts import get_object_or_404
from django.http import Http404  # Add this import

class UserInfoMappingUpdateAPIView(APIView):
    """
    PATCH /api/userinfo/<userId>/update-mapping/ -> update isMapped, projectId, projectName
    """
    
    def get_object(self, userId: str):
        # Get the FIRST UserInfo by userId (handle duplicates)
        try:
            return UserInfo.objects.filter(userId=userId).first()
        except UserInfo.DoesNotExist:
            raise Http404("No UserInfo matches the given query.")
    
    def patch(self, request, userId: str, *args, **kwargs):
        instance = self.get_object(userId)
        
        if not instance:
            return Response(
                {"detail": "UserInfo not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Use the NEW UserInfoMappingSerializer
        serializer = UserInfoMappingSerializer(instance, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserInfoDetailAPIView(APIView):
    """
    GET /api/userinfo/<userId>/ -> get user info details including mapping fields
    """
    
    def get_object(self, userId: str):
        # Get the FIRST UserInfo by userId (handle duplicates)
        try:
            return UserInfo.objects.filter(userId=userId).first()
        except UserInfo.DoesNotExist:
            raise Http404("No UserInfo matches the given query.")
    
    def get(self, request, userId: str, *args, **kwargs):
        instance = self.get_object(userId)
        
        if not instance:
            return Response(
                {"detail": "UserInfo not found."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Use the REGULAR UserInfoSerializer for GET
        serializer = UserInfoSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserInfoDetailAPIView(APIView):
    """
    GET /api/userinfo/<userId>/ -> get user info details including mapping fields
    """
    
    def get(self, request, userId: str, *args, **kwargs):
        instance = get_object_or_404(UserInfo, userId=userId)
        # Use the REGULAR UserInfoSerializer for GET (not UserInfoMappingSerializer)
        serializer = UserInfoSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)



from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import Recommendation
from .serializers import RecommendationSerializer

@api_view(['GET', 'POST'])
def recommendation_list_create(request):
    
    # GET  /api/recommendations/          -> list all (supports ?traineeId=1&jobId=1)
    # POST /api/recommendations/          -> create
    
    if request.method == 'GET':
        qs = Recommendation.objects.all()

        trainee_id = request.query_params.get('traineeId')
        job_id = request.query_params.get('jobId')
        if trainee_id is not None:
            qs = qs.filter(trainee_id=trainee_id)
        if job_id is not None:
            qs = qs.filter(job_id=job_id)

        serializer = RecommendationSerializer(qs, many=True)
        return Response(serializer.data, status=http_status.HTTP_200_OK)

    # POST
    serializer = RecommendationSerializer(data=request.data)
    if serializer.is_valid():
        obj = serializer.save()
        return Response(RecommendationSerializer(obj).data, status=http_status.HTTP_201_CREATED)
    return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def recommendation_detail(request, pk: int):
    
    # GET    /api/recommendations/{id}/   -> retrieve
    # PUT    /api/recommendations/{id}/   -> full update (replace all writable fields)
    # PATCH  /api/recommendations/{id}/   -> partial update (e.g., only status)
    # DELETE /api/recommendations/{id}/   -> delete
    
    instance = get_object_or_404(Recommendation, pk=pk)

    if request.method == 'GET':
        serializer = RecommendationSerializer(instance)
        return Response(serializer.data, status=http_status.HTTP_200_OK)

    if request.method == 'PUT':
        serializer = RecommendationSerializer(instance, data=request.data)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(RecommendationSerializer(obj).data, status=http_status.HTTP_200_OK)
        return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)

    if request.method == 'PATCH':
        serializer = RecommendationSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(RecommendationSerializer(obj).data, status=http_status.HTTP_200_OK)
        return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)

    # DELETE
    instance.delete()
    return Response(status=http_status.HTTP_204_NO_CONTENT)







# #llm

# import os
# import re
# import faiss
# import numpy as np
# from math import radians, cos, sin, asin, sqrt
# from django.shortcuts import get_object_or_404
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status

# # Import your models and serializers
# from .models import Job, ProfileRecord, UserInfo, Strength, Weakness, Match
# from .serializers import MatchSerializer

# # ---- 1. Libraries from your snippet ----
# from langchain_ollama import ChatOllama
# from sentence_transformers import SentenceTransformer

# # ---- 2. Global Configurations & Models ----
# # Adjust this path if necessary, but kept as per your request
# LOCAL_MODEL_PATH = r"C:\Users\2940005\Desktop\all_mini_llm\all-MiniLM-L6-v2"

# # Global City Coordinates
# city_geo = {
#     "Chennai": (13.0827, 80.2707),
#     "Bangalore": (12.9716, 77.5946),
#     "Hyderabad": (17.3850, 78.4867),
#     "Pune": (18.5204, 73.8567),
#     "Mumbai": (19.0760, 72.8777),
# }

# # Initialize LLM (Global to avoid reloading per request)
# try:
#     llm = ChatOllama(base_url="http://172.20.200.21:9007", model="mistral-nemo:latest", temperature=0.3)
# except Exception as e:
#     print(f"⚠️ LLM Init Error: {e}")
#     llm = None

# def load_embed_model():
#     try:
#         if os.path.exists(LOCAL_MODEL_PATH):
#             print(f"📂 Loading local model: {LOCAL_MODEL_PATH}")
#             return SentenceTransformer(LOCAL_MODEL_PATH)
#         else:
#             print("🌐 Local model not found. Downloading 'all-MiniLM-L6-v2'...")
#             return SentenceTransformer("all-MiniLM-L6-v2")
#     except Exception as e:
#         print(f"⚠️ Embed Model Error: {e}. Retrying with default name...")
#         return SentenceTransformer("all-MiniLM-L6-v2")

# # Load Embed Model Globally
# embed_model = load_embed_model()

# # ---- 3. Helper Functions (Your Logic) ----

# def clean(txt: str) -> str:
#     if not txt: return ""
#     return re.sub(r"<think>.*?</think>", "", txt, flags=re.S).strip()

# def extract_trainee(trainee_data, jd_text):
#     # trainee_data is a dict representation of the ProfileRecord
#     p = f"Job:\n{jd_text}\n\nTrainee:\n{trainee_data}\nExtract ONLY relevant skills, soft skills & location."
#     if llm:
#         return clean(llm.invoke(p).content)
#     return str(trainee_data) # Fallback if LLM fails

# def extract_jd(jd_data):
#     # jd_data is a dict representation of the Job
#     p = f"JD JSON:\n{jd_data}\nExtract ONLY required skills, soft skills & preferred locations."
#     if llm:
#         return clean(llm.invoke(p).content)
#     return str(jd_data)

# def geo_distance(c1, c2):
#     # Simple safety check to ensure keys exist
#     if c1 not in city_geo or c2 not in city_geo:
#         return 9999
    
#     lat1, lon1 = city_geo[c1]
#     lat2, lon2 = city_geo[c2]
#     R = 6371
#     dlat = radians(lat2 - lat1)
#     dlon = radians(lon2 - lon1)
#     a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
#     return round(2 * R * asin(sqrt(a)), 1)

# def compute_score(t_dict, jd_dict, dist):
#     skill_total = 0
#     count = 0
    
#     # Logic to compare strengths/weaknesses with JD techSkills
#     # Flatten strengths and weaknesses from the dictionary structure
#     trainee_courses = t_dict.get("strengths", []) + t_dict.get("weaknesses", [])
    
#     for s in jd_dict.get("techSkills", []):
#         for x in trainee_courses:
#             # Handle case where x might be a dict or object
#             c_name = x.get("courseName", "") if isinstance(x, dict) else ""
#             c_score = x.get("avgScore", 0) if isinstance(x, dict) else 0
            
#             if c_name.lower() == s.lower():
#                 skill_total += c_score
#                 count += 1
                
#     skill_pct = round((skill_total / max(count, 1)) * 0.7, 2)
    
#     # Distance Logic
#     loc_pct = 30 if dist == 0 else 15 if dist <= 600 else 0
    
#     total = round(skill_pct + loc_pct, 2)

#     # Bucket Assignment (Mapped to your Model Choices)
#     # Model Choices: PERFECT_MATCH, SKILLS_ONLY, LOCATION_ONLY, NEARBY, NO_MATCH
#     if skill_pct >= 45 and dist == 0:
#         bucket = "PERFECT_MATCH"  # Was BEST FIT
#     elif skill_pct >= 45 and dist <= 600:
#         bucket = "SKILLS_ONLY"    # Was SKILL FIT
#     elif dist <= 600:
#         bucket = "LOCATION_ONLY"  # Was LOCATION FIT
#     else:
#         bucket = "NO_MATCH"
        
#     return skill_pct, loc_pct, total, bucket

# # ---- 4. The API View ----

# class RunMatchingEngineView(APIView):
    
#     def post(self, request, *args, **kwargs):
#         updates_made = False

#         # A. Fetch Data from DB
#         active_jobs = Job.objects.filter(status='active')
#         trainees_db = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses').all()

#         if not active_jobs.exists() or not trainees_db.exists():
#             return Response({"message": "No active jobs or trainees to process."}, status=status.HTTP_200_OK)

#         # B. Iterate per Job (Your logic runs 1 JD vs Many Trainees)
#         for job in active_jobs:
            
#             # 1. Prepare Job Dictionary
#             jd_dict = {
#                 "title": job.title,
#                 "techSkills": job.techSkills,
#                 "location": job.location if isinstance(job.location, list) else [job.location],
#                 # Add other fields if needed by extract_jd
#             }

#             # 2. Identify Trainees that DO NOT have a match for this job yet
#             # We filter OUT trainees who already have a Match record for this specific Job ID
#             existing_trainee_ids = Match.objects.filter(job_ref=job).values_list('trainee_ref_id', flat=True)
#             new_trainees_db = [t for t in trainees_db if t.id not in existing_trainee_ids]

#             if not new_trainees_db:
#                 continue # Skip this job, all matches exist

#             # 3. Convert DB Objects to List of Dicts for your Engine
#             trainees_list_dicts = []
#             for t in new_trainees_db:
#                 # Construct dict matching your logic's expectation
#                 t_info = {
#                     "name": t.userInfo.name if t.userInfo else "Unknown",
#                     "location": t.userInfo.location if t.userInfo else "",
#                     "id": t.id
#                 }
                
#                 # Convert Strength/Weakness QuerySets to list of dicts
#                 strengths = [{"courseName": s.courseName, "avgScore": s.avgScore} for s in t.strengths.all()]
#                 weaknesses = [{"courseName": w.courseName, "avgScore": w.avgScore} for w in t.weaknesses.all()]
                
#                 trainees_list_dicts.append({
#                     "userInfo": t_info,
#                     "strengths": strengths,
#                     "weaknesses": weaknesses,
#                     "db_obj": t # Keep reference to actual DB object for saving later
#                 })

#             # 4. Run Vector Engine (Your Logic adapted)
#             # a) Extract Semantic Text
#             semantic_profiles = [extract_trainee(t, str(jd_dict)) for t in trainees_list_dicts]
#             jd_semantic = extract_jd(str(jd_dict))

#             # b) Embed
#             if not semantic_profiles: continue 
            
#             vecs = embed_model.encode(semantic_profiles)
#             jd_vec = embed_model.encode([jd_semantic]) # Encode expects list

#             # c) FAISS
#             faiss.normalize_L2(vecs)
#             faiss.normalize_L2(jd_vec)
            
#             d = vecs.shape[1]
#             index = faiss.IndexFlatIP(d)
#             index.add(vecs)
            
#             # Search all new trainees (k = len(new_trainees)) to ensure everyone gets a bucket
#             k = len(trainees_list_dicts) 
#             D, I = index.search(jd_vec, k) 

#             # 5. Process Results & Save to DB
#             for idx in I[0]:
#                 if idx == -1: continue # FAISS padding

#                 t_data = trainees_list_dicts[int(idx)]
#                 trainee_db_obj = t_data['db_obj']
                
#                 # Distance Calc
#                 loc = t_data["userInfo"].get("location")
#                 jd_locs = jd_dict.get("location", [])
                
#                 dists = [
#                     geo_distance(loc, l) if loc in city_geo and l in city_geo else 9999
#                     for l in jd_locs
#                 ]
#                 dist = min(dists) if dists else 9999

#                 # Compute Score
#                 s, l, tot, b = compute_score(t_data, jd_dict, dist)

#                 # Save to Match Table
#                 # We use get_or_create just in case, but our filter logic above should prevent dupes
#                 match, created = Match.objects.get_or_create(
#                     job_ref=job,
#                     trainee_ref=trainee_db_obj,
#                     defaults={
#                         # Snapshot fields handled by Serializer usually, 
#                         # but here we save model directly for speed/custom logic
#                         "trainee_name": t_data["userInfo"]["name"],
#                         "trainee_location": loc,
#                         "trainee_id": t_data["userInfo"].get("id"), # or userId from UserInfo
#                         "job_id": job.id,
#                         "job_title": job.title,
#                         "skills_percentage": s,
#                         "location_percentage": l,
#                         "total_percentage": tot,
#                         "bucket": b
#                     }
#                 )
                
#                 if created:
#                     updates_made = True

#         # C. Final Response
#         if updates_made:
#             return Response({"message": "Matching run successfully. New matches created."}, status=status.HTTP_201_CREATED)
#         else:
#             return Response({"message": "Already updated"}, status=status.HTTP_200_OK)

# Optional: The Manual Trigger API (reusing the function)
class RunMatchingEngineView(APIView):
    def post(self, request):
        # Run in foreground here if you want to see the result immediately
        result = run_matching_logic()
        if result:
            return Response({"message": "Matching run successfully."}, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "Already updated"}, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Job, Match
from .serializers import MatchListSerializer

class JobMatchListView(APIView):
    """
    GET /api/matches/<job_id>/
    Returns all trainees for a specific job, grouped by their classification bucket.
    """
    
    def get(self, request, job_id):
        # 1. Verify Job Exists
        job = get_object_or_404(Job, id=job_id)

        # 2. Fetch all matches for this specific Job
        matches = Match.objects.filter(job_ref=job)
        
        # 3. Prepare Response Structure
        response_data = {
            "job_title": job.title,
            "job_id": job.id,
            "total_matches": matches.count(),
            # Separate lists for each category
            "perfect_match": [],      # Both Skills & Location
            "skills_only": [],        # Skills Only
            "location_only": [],      # Location Only
            "nearby": [],             # Proximal Distance
            "no_match": []            # No Match
        }

        # 4. Serialize and Categorize
        for match in matches:
            serializer = MatchListSerializer(match)
            data = serializer.data
            bucket = match.bucket

            # Route data to the correct list based on bucket value
            if bucket == 'PERFECT_MATCH':
                response_data["perfect_match"].append(data)
            elif bucket == 'SKILLS_ONLY':
                response_data["skills_only"].append(data)
            elif bucket == 'LOCATION_ONLY':
                response_data["location_only"].append(data)
            elif bucket == 'NEARBY':
                response_data["nearby"].append(data)
            else:
                response_data["no_match"].append(data)

        return Response(response_data, status=status.HTTP_200_OK)


# retrieve traineee with matched jobs
class TraineeMatchListView(APIView):
    """
    GET /api/trainee-matches/<trainee_id>/
    Returns all JOBS a specific trainee matches with, grouped by bucket.
    """
    
    def get(self, request, trainee_id):
        # 1. Verify Trainee Exists
        trainee = get_object_or_404(ProfileRecord, id=trainee_id)
        
        # 2. Fetch matches for this Trainee
        matches = Match.objects.filter(trainee_ref=trainee)
        
        # 3. Prepare Response Structure
        response_data = {
            "trainee_name": trainee.userInfo.name if trainee.userInfo else "Unknown",
            "trainee_id": trainee.id,
            "total_matches": matches.count(),
            "perfect_match": [],
            "skills_only": [],
            "location_only": [],
            "nearby": [],
            "no_match": [] 
        }

        # 4. Loop & Serialize
        for match in matches:
            # We construct a custom dict to include Job Details clearly
            match_data = {
                "match_id": match.id,
                "job_id": match.job_ref.id,
                "job_title": match.job_ref.title,
                "job_location": match.job_ref.location,
                "posted_date": match.job_ref.postedDate,
                
                # Match Details
                "bucket": match.bucket,
                "total_percentage": match.total_percentage,
                "skills_percentage": match.skills_percentage,
                "location_percentage": match.location_percentage,
                "distance": match.distance,
                "matched_skills": match.matched_skills
            }

            # --- FILTERING LOGIC (Same as before) ---
            # Hide distance if not 'NEARBY'
            if match.bucket != 'NEARBY':
                match_data.pop('distance', None)
            
            # Hide matched_skills if 'NO_MATCH'
            if match.bucket == 'NO_MATCH':
                match_data.pop('matched_skills', None)
            # ----------------------------------------

            # 5. Categorize
            bucket = match.bucket
            if bucket == 'PERFECT_MATCH':
                response_data["perfect_match"].append(match_data)
            elif bucket == 'SKILLS_ONLY':
                response_data["skills_only"].append(match_data)
            elif bucket == 'LOCATION_ONLY':
                response_data["location_only"].append(match_data)
            elif bucket == 'NEARBY':
                response_data["nearby"].append(match_data)
            else:
                response_data["no_match"].append(match_data)

        return Response(response_data, status=status.HTTP_200_OK)


# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models as django_models
from .models import Job, InterviewLock
from .serializers import JobSerializer, InterviewLockSerializer, InterviewLockCreateSerializer

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


class InterviewLockViewSet(viewsets.ModelViewSet):
    queryset = InterviewLock.objects.all()
    serializer_class = InterviewLockSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter by job, trainee, status if query params present
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
        """Create interview locks for multiple trainees at once."""
        serializer = InterviewLockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        trainee_ids = data['trainee_ids']
        job_id = data['job_id']
        interview_datetime = data['interview_datetime']
        comments = data.get('comments', '')

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        locks = []
        for tid in trainee_ids:
            # Ensure trainee exists (optional)
            lock, created = InterviewLock.objects.get_or_create(
                trainee_id=tid,
                job_id=job_id,
                defaults={
                    'locked_by': request.user,
                    'interview_datetime': interview_datetime,
                    'comments': comments,
                }
            )
            if not created:
                # If lock already exists, you may want to update or skip
                # Here we skip, but you could update the datetime/comments
                continue
            locks.append(lock)

        output_serializer = InterviewLockSerializer(locks, many=True)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Aggregated stats for interview locks dashboard."""
        total_locked = InterviewLock.objects.filter(status='locked').count()
        total_selected = InterviewLock.objects.filter(status='selected').count()
        total_rejected = InterviewLock.objects.filter(status='rejected').count()
        by_job = InterviewLock.objects.values('job__title').annotate(
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
        """Export all locks as CSV."""
        import csv
        from django.http import HttpResponse
        locks = self.get_queryset().select_related('trainee__userInfo', 'job', 'locked_by')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="interview_locks.csv"'
        writer = csv.writer(response)
        writer.writerow(['Trainee Name', 'Job Title', 'Interview DateTime', 'Status', 'Comments', 'Locked By', 'Created At'])
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

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = InterviewLockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        trainee_ids = data['trainee_ids']
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

        locks = []
        for tid in trainee_ids:
            lock, created = InterviewLock.objects.get_or_create(
                trainee_id=tid,
                job_id=job_id,
                defaults={
                    'locked_by': request.user,
                    'interview_datetime': interview_datetime,
                    'comments': comments,
                    'assigned_to': assigned_to,
                }
            )
            if not created:
                # optionally update existing lock
                continue
            locks.append(lock)

        output_serializer = self.get_serializer(locks, many=True)
        return Response(output_serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        """Submit feedback for a locked interview and update its status."""
        lock = self.get_object()
        if lock.status != 'locked':
            return Response({'error': 'Feedback can only be submitted for locked interviews.'}, status=400)
        if hasattr(lock, 'feedback'):
            return Response({'error': 'Feedback already exists for this interview.'}, status=400)

        # Validate input data (use a FeedbackSerializer)
        feedback_serializer = InterviewFeedbackSerializer(data=request.data)
        feedback_serializer.is_valid(raise_exception=True)

        # Save feedback, linking to lock and current user
        feedback_serializer.save(
            lock=lock,
            interviewer=request.user
        )

        # Update lock status based on recommendation
        recommendation = feedback_serializer.validated_data.get('recommendation')
        if recommendation == 'selected':
            lock.status = 'selected'
        elif recommendation == 'rejected':
            lock.status = 'rejected'
        lock.save()

        return Response(feedback_serializer.data, status=201)

    # Optional: get locks assigned to current interviewer
    @action(detail=False, methods=['get'])
    def my_assigned(self, request):
        """Return locks assigned to the logged-in interviewer."""
        if "a"!="a":
            return Response({'error': 'Only interviewers can access this.'}, status=403)
        qs = self.get_queryset().filter(assigned_to=request.user, status='locked')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)