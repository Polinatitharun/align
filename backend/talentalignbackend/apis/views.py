# import pandas as pd
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.contrib.auth import get_user_model

# from rest_framework_simplejwt.views import TokenObtainPairView
# from .tokens import CustomTokenObtainPairSerializer



# from .serializers import (
#     UserSerializer,
#     AddUserSerializer,
#     EditUserSerializer,
#     ResetPasswordSerializer,

# )

# User = get_user_model()


# # 🔐 LOGIN
# class LoginView(TokenObtainPairView):
#     serializer_class = CustomTokenObtainPairSerializer


# # 👤 ADD SINGLE USER
# class AddUserView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def post(self, request):
#         # if request.user.role != 'admin':
#         #     return Response({"error": "Permission denied"}, status=403)

#         serializer = AddUserSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({"message": "User created"}, status=201)

#         return Response(serializer.errors, status=400)


# # 📁 BULK EXCEL UPLOAD
# class UploadAddExcelView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def post(self, request):
#         file = request.FILES.get("file")
#         if not file:
#             return Response({"error": "No file uploaded"}, status=400)

#         try:
#             df = pd.read_excel(file)
#         except Exception as e:
#             return Response({"error": f"Invalid Excel file: {str(e)}"}, status=400)

#         created_users = []

#         # Standardize column names (optional but good practice)
#         df.columns = [c.lower().strip() for c in df.columns]

#         # Ensure password column exists
#         if 'password' not in df.columns:
#             df['password'] = None
            
#         # # Ensure name columns exist
#         # if 'first_name' not in df.columns:
#         #     df['first_name'] = ""
#         # if 'last_name' not in df.columns:
#         #     df['last_name'] = ""

#         for _, row in df.iterrows():
#             if User.objects.filter(username=row['username']).exists():
#                 continue

#             # 1. Handle Password Logic
#             password = row['password']
#             if pd.isna(password) or str(password).strip() == "":
#                 password = "Tcs#12345"
#             else:
#                 password = str(password)

#             # 2. Handle Name Logic (Convert NaN to empty string)
#             # first_name = row['first_name']
#             # if pd.isna(first_name): 
#             #     first_name = ""
            
#             # last_name = row['last_name']
#             # if pd.isna(last_name): 
#             #     last_name = ""

#             User.objects.create_user(
#                 username=row['username'],
#                 email=row['email'],
#                 password=password,
#                 # first_name=str(first_name),
#                 # last_name=str(last_name),
#                 role=row['role'],
#                 is_active=True
#             )
#             created_users.append(row['username'])

#         return Response({"created_users": created_users}, status=201)


# # 👁️ LIST USERS
# # class UserListView(APIView):
# #     # permission_classes = [IsAuthenticated]

# #     def get(self, request):
# #         users = User.objects.all()
# #         serializer = UserSerializer(users, many=True)
# #         return Response(serializer.data)

# class UserListView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def get(self, request):
#         users = User.objects.all()
#         role = request.query_params.get('role')
#         if role:
#             users = users.filter(role=role)
#         serializer = UserSerializer(users, many=True)
#         return Response(serializer.data)

# # ✏️ EDIT USER  
# class EditUserView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def put(self, request, user_id):
#         try:
#             user = User.objects.get(id=user_id)
#         except User.DoesNotExist:
#             return Response({"error": "User not found"}, status=404)

#         # Uses EditUserSerializer which now includes first_name and last_name
#         serializer = EditUserSerializer(user, data=request.data, partial=True)

#         if serializer.is_valid():
#             serializer.save()
#             return Response({"message": "User updated", "data": serializer.data})

#         return Response(serializer.errors, status=400)


# # 🔁 ACTIVATE / DEACTIVATE USER
# class ToggleUserStatusView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def patch(self, request, user_id):
#         user = User.objects.get(id=user_id)
#         user.is_active = not user.is_active
#         user.save()
#         return Response({"status": "updated"})


# # ❌ DELETE USER
# class DeleteUserView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def delete(self, request, user_id):
#         User.objects.filter(id=user_id).delete()
#         return Response({"message": "User deleted"})


# # 🔐 RESET PASSWORD
# class ResetPasswordView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def post(self, request, user_id):
#         serializer = ResetPasswordSerializer(data=request.data)

#         if serializer.is_valid():
#             user = User.objects.get(id=user_id)
#             user.set_password(serializer.validated_data['password'])
#             user.save()
#             return Response({"message": "Password reset successful"})

#         return Response(serializer.errors, status=400)



# class UploadBulkDeleteUsersView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def post(self, request):
#         file = request.FILES.get("file")
#         if not file:
#             return Response({"error": "No file uploaded"}, status=400)

#         df = pd.read_excel(file)

#         deleted_users = []

#         for _, row in df.iterrows():
#             try:
#                 user = User.objects.get(username=row["username"])
#                 user.delete()
#                 deleted_users.append(row["username"])
#             except User.DoesNotExist:
#                 continue

#         return Response({
#             "deleted_users": deleted_users
#         }, status=200)



# class UploadBulkActivateUsersView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def post(self, request):
#         file = request.FILES.get("file")
#         if not file:
#             return Response({"error": "No file uploaded"}, status=400)

#         df = pd.read_excel(file)

#         activated_users = []

#         for _, row in df.iterrows():
#             try:
#                 user = User.objects.get(username=row["username"])
#                 user.is_active = True
#                 user.save()
#                 activated_users.append(row["username"])
#             except User.DoesNotExist:
#                 continue

#         return Response({
#             "activated_users": activated_users
#         }, status=200)



# class UploadBulkDeactivateUsersView(APIView):
#     # permission_classes = [IsAuthenticated]

#     def post(self, request):
#         file = request.FILES.get("file")
#         if not file:
#             return Response({"error": "No file uploaded"}, status=400)

#         df = pd.read_excel(file)

#         deactivated_users = []

#         for _, row in df.iterrows():
#             try:
#                 user = User.objects.get(username=row["username"])
#                 user.is_active = False
#                 user.save()
#                 deactivated_users.append(row["username"])
#             except User.DoesNotExist:
#                 continue

#         return Response({
#             "deactivated_users": deactivated_users
#         }, status=200)



# # views.py - Job Management Views
# import pandas as pd
# import threading
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework import status
# from django.http import HttpResponse
# import json
# from datetime import datetime
# from django.core.exceptions import ValidationError

# from .models import Job
# from .serializers import JobSerializer


# from .matching_engine import run_matching_logic

# class JobListView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         jobs = Job.objects.all()
#         serializer = JobSerializer(jobs, many=True)
#         return Response(serializer.data)
    
#     def post(self, request):
#         serializer = JobSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()

#             t = threading.Thread(target=run_matching_logic, daemon=True)
#             t.start()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class JobDetailView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def get_object(self, pk):
#         try:
#             return Job.objects.get(pk=pk)
#         except Job.DoesNotExist:
#             return None
    
#     def get(self, request, pk):
#         job = self.get_object(pk)
#         if job:
#             serializer = JobSerializer(job)
#             return Response(serializer.data)
#         return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
    
#     def put(self, request, pk):
#         job = self.get_object(pk)
#         if job:
#             serializer = JobSerializer(job, data=request.data)
#             if serializer.is_valid():
#                 serializer.save()
#                 return Response(serializer.data)
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#         return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
    
#     def delete(self, request, pk):
#         job = self.get_object(pk)
#         if job:
#             job.delete()
#             return Response({"message": "Job deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
#         return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

# class ToggleJobStatusView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def patch(self, request, pk):
#         try:
#             job = Job.objects.get(pk=pk)
#             job.status = 'inactive' if job.status == 'active' else 'active'
#             job.save()
#             serializer = JobSerializer(job)
#             return Response(serializer.data)
#         except Job.DoesNotExist:
#             return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

# class UploadExcelView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         file = request.FILES.get('excel_file')  # Changed from 'file' to 'excel_file'
#         if not file:
#             return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
#         # Check file extension
#         if not file.name.endswith(('.xlsx', '.xls', '.csv')):
#             return Response({"error": "Invalid file type. Please upload Excel files (.xlsx, .xls, .csv)"}, 
#                           status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Read Excel file
#             df = pd.read_excel(file)
#             created_jobs = []
#             errors = []
            
#             # Required columns
#             required_columns = [
#                 'Title', 'Department', 'Location', 'Openings', 
#                 'Requirements', 'Tech Skills', 'Soft Skills', 
#                 'Description', 'Expiry Date'
#             ]
            
#             # Check if all required columns exist
#             missing_columns = [col for col in required_columns if col not in df.columns]
#             if missing_columns:
#                 return Response({
#                     "error": f"Missing required columns in Excel: {', '.join(missing_columns)}",
#                     "expected_columns": required_columns,
#                     "found_columns": list(df.columns)
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Process each row
#             for index, row in df.iterrows():
#                 try:
#                     # Skip empty rows
#                     if pd.isna(row.get('Title')):
#                         continue
                    
#                     # Parse location (comma-separated string to list)
#                     location_str = str(row.get('Location', ''))
#                     locations = [loc.strip() for loc in location_str.split(',') if loc.strip()]
                    
#                     # Parse skills (comma-separated strings to lists)
#                     tech_skills_str = str(row.get('Tech Skills', ''))
#                     tech_skills = [skill.strip() for skill in tech_skills_str.split(',') if skill.strip()]
                    
#                     soft_skills_str = str(row.get('Soft Skills', ''))
#                     soft_skills = [skill.strip() for skill in soft_skills_str.split(',') if skill.strip()]
                    
#                     # Convert openings to integer
#                     openings = row.get('Openings', 1)
#                     try:
#                         openings = int(openings)
#                     except (ValueError, TypeError):
#                         openings = 1
                    
#                     # Handle expiry date
#                     expiry_date = row.get('Expiry Date', '')
#                     if pd.isna(expiry_date):
#                         expiry_date = ''
#                     else:
#                         # Convert to string if it's a date/datetime
#                         if isinstance(expiry_date, (pd.Timestamp, datetime)):
#                             expiry_date = expiry_date.strftime('%Y-%m-%d')
#                         else:
#                             expiry_date = str(expiry_date).strip()
                    
#                     # Create job data dictionary
#                     job_data = {
#                         'title': str(row.get('Title', '')).strip(),
#                         'department': str(row.get('Department', '')).strip(),
#                         'location': locations,
#                         'openings': openings,
#                         'requirements': str(row.get('Requirements', '')).strip(),
#                         'techSkills': tech_skills,
#                         'softSkills': soft_skills,
#                         'description': str(row.get('Description', '')).strip(),
#                         'expiryDate': expiry_date,
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

#             if created_jobs:
#                 print(f"Excel upload :{len(created_jobs)} jobs created. Starting matching engine..")
#                 threading.Thread(target=run_matching_logic).start()
#             response_data = {
#                 "message": f"Successfully processed {len(created_jobs)} jobs",
#                 "created_jobs": len(created_jobs),
#                 "job_titles": created_jobs
#             }
            
#             if errors:
#                 response_data["errors"] = errors[:10]  # Show first 10 errors
            
#             return Response(response_data, status=status.HTTP_201_CREATED)
            
#         except Exception as e:
#             return Response({"error": f"Error processing file: {str(e)}"}, 
#                           status=status.HTTP_400_BAD_REQUEST)
# from rest_framework.parsers import MultiPartParser, FormParser
# class UploadWordView(APIView):
#     # permission_classes = [IsAuthenticated]
#     parser_classes = (MultiPartParser, FormParser)

#     def post(self, request):
#         # For Word document processing, you might need to install python-docx
#         # pip install python-docx
#         from docx import Document
        
#         file = request.FILES.get('wordFile')
#         if not file:
#             return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Read Word document
#             doc = Document(file)
            
#             # Extract text from document
#             full_text = []
#             for para in doc.paragraphs:
#                 full_text.append(para.text)
            
#             # Parse the document content
#             # This is a simple parser - you might need to adjust based on your template
#             content = '\n'.join(full_text)
#             created_jobs = []
            
#             # Simple parsing logic - adjust based on your Word template structure
#             # Example format:
#             # Job Title: Frontend Developer
#             # Department: Technology
#             # Locations: Hyderabad, Bangalore
#             # ...
            
#             job_data = self.parse_word_content(content)
#             if job_data:
#                 serializer = JobSerializer(data=job_data)
#                 if serializer.is_valid():
#                     job = serializer.save()
#                     threading.Thread(target=run_matching_logic).start()

#                     created_jobs.append(job.title)
#                     return Response({
#                         "message": "Job created successfully from Word document",
#                         "created_jobs": created_jobs
#                     }, status=status.HTTP_201_CREATED)
#                 else:
#                     return Response({"error": serializer.errors}, 
#                                   status=status.HTTP_400_BAD_REQUEST)
#             else:
#                 return Response({"error": "Could not parse Word document"}, 
#                               status=status.HTTP_400_BAD_REQUEST)
                
#         except Exception as e:
#             return Response({"error": f"Error processing Word document: {str(e)}"}, 
#                           status=status.HTTP_400_BAD_REQUEST)
    
#     def parse_word_content(self, content):
#         # Implement your parsing logic here
#         # This is a basic example
#         lines = content.split('\n')
#         job_data = {}
        
#         for line in lines:
#             if ':' in line:
#                 key, value = line.split(':', 1)
#                 key = key.strip().lower()
#                 value = value.strip()
                
#                 if 'job title' in key:
#                     job_data['title'] = value
#                 elif 'department' in key:
#                     job_data['department'] = value
#                 elif 'location' in key:
#                     job_data['location'] = [loc.strip() for loc in value.split(',')]
#                 elif 'openings' in key:
#                     job_data['openings'] = int(value) if value.isdigit() else 1
#                 elif 'requirements' in key:
#                     job_data['requirements'] = value
#                 elif 'tech' in key and 'skill' in key:
#                     job_data['techSkills'] = [skill.strip() for skill in value.split(',')]
#                 elif 'soft' in key and 'skill' in key:
#                     job_data['softSkills'] = [skill.strip() for skill in value.split(',')]
#                 elif 'description' in key:
#                     job_data['description'] = value
#                 elif 'expiry' in key or 'deadline' in key:
#                     job_data['expiryDate'] = value
        
#         # Add default values
#         job_data.update({
#             'status': 'active',
#             'filled': 0,
#             'matches': 0,
#             'postedDate': datetime.now().strftime('%Y-%m-%d')
#         })
        
#         return job_data

# class DownloadExcelTemplateView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         import io
#         from openpyxl import Workbook
        
#         # Create a new workbook
#         wb = Workbook()
#         ws = wb.active
#         ws.title = "Job Template"
        
#         # Add headers
#         headers = [
#             'Title',
#             'Department', 
#             'Location',
#             'Openings',
#             'Requirements',
#             'Tech Skills',
#             'Soft Skills',
#             'Description',
#             'Expiry Date'
#         ]
        
#         for col, header in enumerate(headers, 1):
#             ws.cell(row=1, column=col, value=header)
        
#         # Add sample data
#         sample_data = [
#             'Frontend Developer',
#             'Technology',
#             'Hyderabad,Bangalore',
#             '3',
#             '3+ years React experience, strong JavaScript fundamentals',
#             'React,JavaScript,TypeScript,CSS,HTML5',
#             'Communication,Teamwork,Problem Solving',
#             'Develop and maintain responsive web applications using modern frontend technologies',
#             '2024-03-15'
#         ]
        
#         for col, data in enumerate(sample_data, 1):
#             ws.cell(row=2, column=col, value=data)
        
#         # Create response
#         buffer = io.BytesIO()
#         wb.save(buffer)
#         buffer.seek(0)
        
#         response = HttpResponse(
#             buffer.getvalue(),
#             content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
#         )
#         response['Content-Disposition'] = 'attachment; filename="job_template.xlsx"'
        
#         return response

# class DownloadWordTemplateView(APIView):
#     # permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         from docx import Document
#         from docx.shared import Inches
#         import io
        
#         # Create a new document
#         doc = Document()
        
#         # Add title
#         doc.add_heading('Job Profile Template', 0)
        
#         # Add instructions
#         doc.add_paragraph('Instructions: Fill in the details below for each job position.')
#         doc.add_paragraph('')
        
#         # Add template fields
#         doc.add_paragraph('Job Title: Enter Job Title')
#         doc.add_paragraph('')

#         doc.add_paragraph('Department: Enter Department')
#         doc.add_paragraph('')

#         doc.add_paragraph('Locations: Enter comma-separated locations, e.g., Hyderabad, Bangalore')
#         doc.add_paragraph('')

#         doc.add_paragraph('Openings: Enter number of openings')
#         doc.add_paragraph('')

#         doc.add_paragraph('Requirements and qualifications: your requirements...')
#         doc.add_paragraph('')

#         doc.add_paragraph('Tech Skill: Enter comma-separated skills (java, python)')
#         # doc.add_paragraph('[List technical skills and qualifications, one per line]')
#         doc.add_paragraph('')
#         doc.add_paragraph('Soft Skills: Enter comma-separated skills')
#         doc.add_paragraph('')

#         # doc.add_paragraph('[List desired soft skills, one per line]')
#         doc.add_paragraph('')
#         doc.add_paragraph('Description: Your job description')
#         doc.add_paragraph('')

#         # doc.add_paragraph('[Describe the job role, responsibilities, and expectations]')
        
#         doc.add_paragraph('Application Deadline: [YYYY-MM-DD]')
        
#         # Save to buffer
#         buffer = io.BytesIO()
#         doc.save(buffer)
#         buffer.seek(0)
        
#         response = HttpResponse(
#             buffer.getvalue(),
#             content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
#         )
#         response['Content-Disposition'] = 'attachment; filename="job_template.docx"'
        
#         return response


# from django.shortcuts import get_object_or_404
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status

# from .models import ProfileRecord
# from .serializers import ProfileRecordSerializer


# class ProfileListCreateAPIView(APIView):
#     """
#     GET /api/profiles/      -> list all profiles
#     POST /api/profiles/     -> create a single profile
#     """

#     def get(self, request, *args, **kwargs):
#         qs = (
#             ProfileRecord.objects
#             .select_related('userInfo')
#             .prefetch_related('strengths', 'weaknesses')
#             .all()
#         )
#         serializer = ProfileRecordSerializer(qs, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request, *args, **kwargs):
#         serializer = ProfileRecordSerializer(data=request.data)
#         if serializer.is_valid():
#             instance = serializer.save()
#             # return serialized data (including nested userInfo/strengths/weaknesses)
#             out = ProfileRecordSerializer(instance).data
#             return Response(out, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class ProfileDetailAPIView(APIView):
#     """
#     GET    /api/profiles/<userId>/ -> retrieve by userId
#     PUT    /api/profiles/<userId>/ -> full update by userId
#     PATCH  /api/profiles/<userId>/ -> partial update by userId
#     DELETE /api/profiles/<userId>/ -> delete by userId
#     """

#     def get_object(self, userId: str) -> ProfileRecord:
#         # Changed from pk to userId
#         return get_object_or_404(
#             ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses'),
#             userInfo__userId=userId
#         )

#     def get(self, request, userId: str, *args, **kwargs):  # Changed parameter
#         instance = self.get_object(userId)
#         serializer = ProfileRecordSerializer(instance)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def put(self, request, userId: str, *args, **kwargs):  # Changed parameter
#         instance = self.get_object(userId)
#         serializer = ProfileRecordSerializer(instance, data=request.data)
#         if serializer.is_valid():
#             instance = serializer.save()
#             return Response(ProfileRecordSerializer(instance).data, status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def patch(self, request, userId: str, *args, **kwargs):  # Changed parameter
#         instance = self.get_object(userId)
#         serializer = ProfileRecordSerializer(instance, data=request.data, partial=True)
#         if serializer.is_valid():
#             instance = serializer.save()
#             return Response(ProfileRecordSerializer(instance).data, status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def delete(self, request, userId: str, *args, **kwargs):  # Changed parameter
#         instance = self.get_object(userId)
#         instance.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)

# class BulkUploadProfilesAPIView(APIView):
#     """
#     POST /api/profiles/bulk-upload/ -> bulk create/update array of JSONs

#     - Accepts a list of objects (your 100 JSONs).
#     - Uses ProfileRecordSerializer's create() (with upsert by external_id if provided).
#     """

#     def post(self, request, *args, **kwargs):
#         if not isinstance(request.data, list):
#             return Response({"detail": "Expected a list of JSON objects."}, status=status.HTTP_400_BAD_REQUEST)

#         created_count = 0
#         errors = []
#         outputs = []

#         for idx, payload in enumerate(request.data):
#             serializer = ProfileRecordSerializer(data=payload)
#             if serializer.is_valid():
#                 instance = serializer.save()
#                 outputs.append(ProfileRecordSerializer(instance).data)
#                 created_count += 1
#             else:
#                 errors.append({"index": idx, "errors": serializer.errors})

#         resp = {
#             "created": created_count,
#             "failed": len(errors),
#             "errors": errors,
#             "records": outputs,  # optional: return created/updated records
#         }
#         status_code = status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS
#         return Response(resp, status=status_code)


# from django.shortcuts import get_object_or_404
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from .models import UserInfo

# # Import BOTH serializers
# from .serializers import UserInfoSerializer, UserInfoMappingSerializer  # Add UserInfoMappingSerializer
# from django.shortcuts import get_object_or_404
# from django.http import Http404  # Add this import

# class UserInfoMappingUpdateAPIView(APIView):
#     """
#     PATCH /api/userinfo/<userId>/update-mapping/ -> update isMapped, projectId, projectName
#     """
    
#     def get_object(self, userId: str):
#         # Get the FIRST UserInfo by userId (handle duplicates)
#         try:
#             return UserInfo.objects.filter(userId=userId).first()
#         except UserInfo.DoesNotExist:
#             raise Http404("No UserInfo matches the given query.")
    
#     def patch(self, request, userId: str, *args, **kwargs):
#         instance = self.get_object(userId)
        
#         if not instance:
#             return Response(
#                 {"detail": "UserInfo not found."},
#                 status=status.HTTP_404_NOT_FOUND
#             )
        
#         # Use the NEW UserInfoMappingSerializer
#         serializer = UserInfoMappingSerializer(instance, data=request.data, partial=True)
        
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class UserInfoDetailAPIView(APIView):
#     """
#     GET /api/userinfo/<userId>/ -> get user info details including mapping fields
#     """
    
#     def get_object(self, userId: str):
#         # Get the FIRST UserInfo by userId (handle duplicates)
#         try:
#             return UserInfo.objects.filter(userId=userId).first()
#         except UserInfo.DoesNotExist:
#             raise Http404("No UserInfo matches the given query.")
    
#     def get(self, request, userId: str, *args, **kwargs):
#         instance = self.get_object(userId)
        
#         if not instance:
#             return Response(
#                 {"detail": "UserInfo not found."},
#                 status=status.HTTP_404_NOT_FOUND
#             )
            
#         # Use the REGULAR UserInfoSerializer for GET
#         serializer = UserInfoSerializer(instance)
#         return Response(serializer.data, status=status.HTTP_200_OK)


# class UserInfoDetailAPIView(APIView):
#     """
#     GET /api/userinfo/<userId>/ -> get user info details including mapping fields
#     """
    
#     def get(self, request, userId: str, *args, **kwargs):
#         instance = get_object_or_404(UserInfo, userId=userId)
#         # Use the REGULAR UserInfoSerializer for GET (not UserInfoMappingSerializer)
#         serializer = UserInfoSerializer(instance)
#         return Response(serializer.data, status=status.HTTP_200_OK)



# from django.shortcuts import get_object_or_404
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status as http_status

# from .models import Recommendation
# from .serializers import RecommendationSerializer

# @api_view(['GET', 'POST'])
# def recommendation_list_create(request):
    
#     # GET  /api/recommendations/          -> list all (supports ?traineeId=1&jobId=1)
#     # POST /api/recommendations/          -> create
    
#     if request.method == 'GET':
#         qs = Recommendation.objects.all()

#         trainee_id = request.query_params.get('traineeId')
#         job_id = request.query_params.get('jobId')
#         if trainee_id is not None:
#             qs = qs.filter(trainee_id=trainee_id)
#         if job_id is not None:
#             qs = qs.filter(job_id=job_id)

#         serializer = RecommendationSerializer(qs, many=True)
#         return Response(serializer.data, status=http_status.HTTP_200_OK)

#     # POST
#     serializer = RecommendationSerializer(data=request.data)
#     if serializer.is_valid():
#         obj = serializer.save()
#         return Response(RecommendationSerializer(obj).data, status=http_status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)


# @api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
# def recommendation_detail(request, pk: int):
    
#     # GET    /api/recommendations/{id}/   -> retrieve
#     # PUT    /api/recommendations/{id}/   -> full update (replace all writable fields)
#     # PATCH  /api/recommendations/{id}/   -> partial update (e.g., only status)
#     # DELETE /api/recommendations/{id}/   -> delete
    
#     instance = get_object_or_404(Recommendation, pk=pk)

#     if request.method == 'GET':
#         serializer = RecommendationSerializer(instance)
#         return Response(serializer.data, status=http_status.HTTP_200_OK)

#     if request.method == 'PUT':
#         serializer = RecommendationSerializer(instance, data=request.data)
#         if serializer.is_valid():
#             obj = serializer.save()
#             return Response(RecommendationSerializer(obj).data, status=http_status.HTTP_200_OK)
#         return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)

#     if request.method == 'PATCH':
#         serializer = RecommendationSerializer(instance, data=request.data, partial=True)
#         if serializer.is_valid():
#             obj = serializer.save()
#             return Response(RecommendationSerializer(obj).data, status=http_status.HTTP_200_OK)
#         return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)

#     # DELETE
#     instance.delete()
#     return Response(status=http_status.HTTP_204_NO_CONTENT)

# # Optional: The Manual Trigger API (reusing the function)
# class RunMatchingEngineView(APIView):
#     def post(self, request):
#         # Run in foreground here if you want to see the result immediately
#         result = run_matching_logic()
#         if result:
#             return Response({"message": "Matching run successfully."}, status=status.HTTP_201_CREATED)
#         else:
#             return Response({"message": "Already updated"}, status=status.HTTP_200_OK)

# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.shortcuts import get_object_or_404
# from .models import Job, Match
# from .serializers import MatchListSerializer

# # class JobMatchListView(APIView):
# #     """
# #     GET /api/matches/<job_id>/
# #     Returns all trainees for a specific job, grouped by their classification bucket.
# #     """
    
# #     def get(self, request, job_id):
# #         # 1. Verify Job Exists
# #         job = get_object_or_404(Job, id=job_id)
# #         excluded_trainee_ids = InterviewLock.objects.filter(
# #             status__in=['locked', 'selected']
# #         ).values_list('trainee_id', flat=True).distinct()
# #         matches = Match.objects.filter(job_ref=job).exclude(
# #             trainee_ref_id__in=excluded_trainee_ids
# #         )
# #         # 2. Fetch all matches for this specific Job
# #         matches = Match.objects.filter(job_ref=job)
        
# #         # 3. Prepare Response Structure
# #         response_data = {
# #             "job_title": job.title,
# #             "job_id": job.id,
# #             "total_matches": matches.count(),
# #             # Separate lists for each category
# #             "perfect_match": [],      # Both Skills & Location
# #             "skills_only": [],        # Skills Only
# #             "location_only": [],      # Location Only
# #             "nearby": [],             # Proximal Distance
# #             "no_match": []            # No Match
# #         }

# #         # 4. Serialize and Categorize
# #         for match in matches:
# #             serializer = MatchListSerializer(match)
# #             data = serializer.data
# #             bucket = match.bucket

# #             # Route data to the correct list based on bucket value
# #             if bucket == 'PERFECT_MATCH':
# #                 response_data["perfect_match"].append(data)
# #             elif bucket == 'SKILLS_ONLY':
# #                 response_data["skills_only"].append(data)
# #             elif bucket == 'LOCATION_ONLY':
# #                 response_data["location_only"].append(data)
# #             elif bucket == 'NEARBY':
# #                 response_data["nearby"].append(data)
# #             else:
# #                 response_data["no_match"].append(data)

# #         return Response(response_data, status=status.HTTP_200_OK)

# class JobMatchListView(APIView):
#     def get(self, request, job_id):
#         job = get_object_or_404(Job, id=job_id)
#         from .models import InterviewLock

#         # Exclude trainees who are locked or selected (globally)
#         global_excluded = InterviewLock.objects.filter(
#             status__in=['locked', 'selected']
#         ).values_list('trainee_id', flat=True).distinct()

#         # Exclude trainees who were rejected for this specific job
#         rejected_for_this_job = InterviewLock.objects.filter(
#             job_id=job_id,
#             status='rejected'
#         ).values_list('trainee_id', flat=True).distinct()

#         all_excluded = list(global_excluded) + list(rejected_for_this_job)

#         matches = Match.objects.filter(job_ref=job).exclude(trainee_ref_id__in=all_excluded)

#         response_data = {
#             "job_title": job.title,
#             "job_id": job.id,
#             "total_matches": matches.count(),
#             "perfect_match": [],
#             "skills_only": [],
#             "location_only": [],
#             "nearby": [],
#             "no_match": []
#         }

#         for match in matches:
#             serializer = MatchListSerializer(match)
#             data = serializer.data
#             bucket = match.bucket
#             if bucket == 'PERFECT_MATCH':
#                 response_data["perfect_match"].append(data)
#             elif bucket == 'SKILLS_ONLY':
#                 response_data["skills_only"].append(data)
#             elif bucket == 'LOCATION_ONLY':
#                 response_data["location_only"].append(data)
#             elif bucket == 'NEARBY':
#                 response_data["nearby"].append(data)
#             else:
#                 response_data["no_match"].append(data)

#         return Response(response_data, status=status.HTTP_200_OK)
# # retrieve traineee with matched jobs
# class TraineeMatchListView(APIView):
#     """
#     GET /api/trainee-matches/<trainee_id>/
#     Returns all JOBS a specific trainee matches with, grouped by bucket.
#     """
    
#     def get(self, request, trainee_id):
#         # 1. Verify Trainee Exists
#         trainee = get_object_or_404(ProfileRecord, id=trainee_id)
        
#         # 2. Fetch matches for this Trainee
#         matches = Match.objects.filter(trainee_ref=trainee)
        
#         # 3. Prepare Response Structure
#         response_data = {
#             "trainee_name": trainee.userInfo.name if trainee.userInfo else "Unknown",
#             "trainee_id": trainee.id,
#             "total_matches": matches.count(),
#             "perfect_match": [],
#             "skills_only": [],
#             "location_only": [],
#             "nearby": [],
#             "no_match": [] 
#         }

#         # 4. Loop & Serialize
#         for match in matches:
#             # We construct a custom dict to include Job Details clearly
#             match_data = {
#                 "match_id": match.id,
#                 "job_id": match.job_ref.id,
#                 "job_title": match.job_ref.title,
#                 "job_location": match.job_ref.location,
#                 "posted_date": match.job_ref.postedDate,
                
#                 # Match Details
#                 "bucket": match.bucket,
#                 "total_percentage": match.total_percentage,
#                 "skills_percentage": match.skills_percentage,
#                 "location_percentage": match.location_percentage,
#                 "distance": match.distance,
#                 "matched_skills": match.matched_skills
#             }

#             # --- FILTERING LOGIC (Same as before) ---
#             # Hide distance if not 'NEARBY'
#             if match.bucket != 'NEARBY':
#                 match_data.pop('distance', None)
            
#             # Hide matched_skills if 'NO_MATCH'
#             if match.bucket == 'NO_MATCH':
#                 match_data.pop('matched_skills', None)
#             # ----------------------------------------

#             # 5. Categorize
#             bucket = match.bucket
#             if bucket == 'PERFECT_MATCH':
#                 response_data["perfect_match"].append(match_data)
#             elif bucket == 'SKILLS_ONLY':
#                 response_data["skills_only"].append(match_data)
#             elif bucket == 'LOCATION_ONLY':
#                 response_data["location_only"].append(match_data)
#             elif bucket == 'NEARBY':
#                 response_data["nearby"].append(match_data)
#             else:
#                 response_data["no_match"].append(match_data)

#         return Response(response_data, status=status.HTTP_200_OK)


# # views.py
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.db import models as django_models
# from django.contrib.auth import get_user_model
# from .models import Job, InterviewLock, InterviewFeedback
# from rest_framework.permissions import IsAuthenticated  # add this import at top

# from .serializers import (
#     JobSerializer,
#     InterviewLockSerializer,
#     InterviewLockCreateSerializer,
#     InterviewFeedbackSerializer,
# )

# User = get_user_model()

# class JobViewSet(viewsets.ModelViewSet):
#     queryset = Job.objects.all()
#     serializer_class = JobSerializer
#     @action(detail=True, methods=['patch'])
#     def set_visibility(self, request, pk=None):
#         job = self.get_object()
#         is_public = request.data.get('is_public')
#         if is_public is not None:
#             job.is_public = is_public
#             job.save()
#             return Response({'status': 'visibility updated'})
#         return Response({'error': 'is_public field required'}, status=status.HTTP_400_BAD_REQUEST)


# class InterviewLockViewSet(viewsets.ModelViewSet):
#     queryset = InterviewLock.objects.all()
#     serializer_class = InterviewLockSerializer
#     permission_classes = [IsAuthenticated] 

#     def get_queryset(self):
#         qs = super().get_queryset()
#         job_id = self.request.query_params.get('job')
#         trainee_id = self.request.query_params.get('trainee')
#         status_filter = self.request.query_params.get('status')
#         if job_id:
#             qs = qs.filter(job_id=job_id)
#         if trainee_id:
#             qs = qs.filter(trainee_id=trainee_id)
#         if status_filter:
#             qs = qs.filter(status=status_filter)
#         return qs

#     @action(detail=False, methods=['post'])
#     def bulk_create(self, request):
#         serializer = InterviewLockCreateSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data
#         trainee_ids = data['trainee_ids']
#         job_id = data['job_id']
#         interview_datetime = data['interview_datetime']
#         comments = data.get('comments', '')
#         assigned_to_id = data.get('assigned_to')

#         assigned_to = None
#         if assigned_to_id:
#             try:
#                 assigned_to = User.objects.get(id=assigned_to_id)
#             except User.DoesNotExist:
#                 return Response({'error': 'Assigned user not found'}, status=400)

#         try:
#             job = Job.objects.get(id=job_id)
#         except Job.DoesNotExist:
#             return Response({'error': 'Job not found'}, status=404)

#         locks = []
#         for tid in trainee_ids:
#             lock, created = InterviewLock.objects.get_or_create(
#                 trainee_id=tid,
#                 job_id=job_id,
#                 defaults={
#                     'locked_by': request.user,
#                     'interview_datetime': interview_datetime,
#                     'comments': comments,
#                     'assigned_to': assigned_to,
#                 }
#             )
#             if not created:
#                 # Optionally update existing lock (here we skip)
#                 continue
#             locks.append(lock)

#         output_serializer = self.get_serializer(locks, many=True)
#         return Response(output_serializer.data, status=201)

#     @action(detail=False, methods=['get'])
#     def dashboard(self, request):
#         total_locked = InterviewLock.objects.filter(status='locked').count()
#         total_selected = InterviewLock.objects.filter(status='selected').count()
#         total_rejected = InterviewLock.objects.filter(status='rejected').count()
#         by_job = InterviewLock.objects.values('job__title').annotate(
#             locked=django_models.Count('id', filter=django_models.Q(status='locked')),
#             selected=django_models.Count('id', filter=django_models.Q(status='selected')),
#             rejected=django_models.Count('id', filter=django_models.Q(status='rejected')),
#         )
#         return Response({
#             'total_locked': total_locked,
#             'total_selected': total_selected,
#             'total_rejected': total_rejected,
#             'by_job': by_job,
#         })

#     @action(detail=False, methods=['get'])
#     def report(self, request):
#         import csv
#         from django.http import HttpResponse
#         locks = self.get_queryset().select_related('trainee__userInfo', 'job', 'locked_by')
#         response = HttpResponse(content_type='text/csv')
#         response['Content-Disposition'] = 'attachment; filename="interview_locks.csv"'
#         writer = csv.writer(response)
#         writer.writerow(['Trainee Name', 'Job Title', 'Interview DateTime', 'Status', 'Comments', 'Locked By', 'Created At'])
#         for lock in locks:
#             writer.writerow([
#                 lock.trainee.userInfo.name,
#                 lock.job.title,
#                 lock.interview_datetime,
#                 lock.status,
#                 lock.comments,
#                 lock.locked_by.username if lock.locked_by else '',
#                 lock.created_at,
#             ])
#         return response

#     @action(detail=True, methods=['post'])
#     def submit_feedback(self, request, pk=None):
#         lock = self.get_object()
#         if lock.status != 'locked':
#             return Response({'error': 'Feedback can only be submitted for locked interviews.'}, status=400)
#         if hasattr(lock, 'feedback'):
#             return Response({'error': 'Feedback already exists for this interview.'}, status=400)

#         feedback_serializer = InterviewFeedbackSerializer(data=request.data)
#         feedback_serializer.is_valid(raise_exception=True)

#         feedback_serializer.save(
#             lock=lock,
#             interviewer=request.user
#         )

#         recommendation = feedback_serializer.validated_data.get('recommendation')
#         if recommendation == 'selected':
#             lock.status = 'selected'
#         elif recommendation == 'rejected':
#             lock.status = 'rejected'
#         lock.save()

#         return Response(feedback_serializer.data, status=201)

#     @action(detail=False, methods=['get'])
#     def my_assigned(self, request):
#         if request.user.role != 'interviewer':
#             return Response({
#                 'error': f'Access denied. Your role is "{request.user.role}". Expected "interviewer".'
#             }, status=403)
#         qs = self.get_queryset().filter(assigned_to=request.user, status='locked')
#         serializer = self.get_serializer(qs, many=True)
#         return Response(serializer.data)



# from django.http import HttpResponse
# import csv

# class MappedTraineesReportView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         response = HttpResponse(content_type='text/csv')
#         response['Content-Disposition'] = 'attachment; filename="mapped_trainees.csv"'
#         writer = csv.writer(response)
#         writer.writerow(['Name', 'Email', 'Location', 'Project ID', 'Project Name', 'Score'])

#         # Get all UserInfo where isMapped=True, join with ProfileRecord for score
#         mapped = UserInfo.objects.filter(isMapped=True).select_related('profile')
#         for info in mapped:
#             writer.writerow([
#                 info.name,
#                 info.employeeId or '',
#                 info.location or '',
#                 info.projectId or '',
#                 info.projectName or '',
#                 info.averageScore or '',
#             ])
#         return response
# class UnmappedTraineesReportView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         response = HttpResponse(content_type='text/csv')
#         response['Content-Disposition'] = 'attachment; filename="unmapped_trainees.csv"'
#         writer = csv.writer(response)
#         writer.writerow(['Name', 'Email', 'Location', 'Average Score'])

#         unmapped = UserInfo.objects.filter(isMapped=False).select_related('profile')
#         for info in unmapped:
#             writer.writerow([
#                 info.name,
#                 info.employeeId or '',
#                 info.location or '',
#                 info.averageScore or '',
#             ])
#         return response


# class OpenPoolReportView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         # Open pool: unmapped and no matches (i.e., no Match records)
#         from django.db.models import Exists, OuterRef
#         unmapped = UserInfo.objects.filter(isMapped=False)
#         # Annotate with existence of any match
#         has_match = Match.objects.filter(trainee_ref__userInfo=OuterRef('pk'))
#         open_pool = unmapped.annotate(has_match=Exists(has_match)).filter(has_match=False)

#         response = HttpResponse(content_type='text/csv')
#         response['Content-Disposition'] = 'attachment; filename="open_pool_trainees.csv"'
#         writer = csv.writer(response)
#         writer.writerow(['Name', 'Email', 'Location', 'Average Score'])

#         for info in open_pool:
#             writer.writerow([
#                 info.name,
#                 info.employeeId or '',
#                 info.location or '',
#                 info.averageScore or '',
#             ])
#         return response

# # views.py (add these imports and classes)

# import requests
# from django.conf import settings
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.permissions import IsAuthenticated
# from .models import ProfileRecord, UserInfo, Strength, Weakness
# from .serializers import ProfileRecordSerializer
# import logging

# logger = logging.getLogger(__name__)

# # Store token temporarily in memory (per user session). For production, use cache or database.
# # Simple dict: key = user_id, value = token
# _deco_tokens = {}

# class DecoLoginView(APIView):
#     """
#     POST /api/deco/login/
#     Expects: {"username": "...", "password": "..."}
#     Returns: {"success": True, "token": "..."} or error.
#     """
#     permission_classes = [IsAuthenticated]  # Only admins can use this

#     def post(self, request):
#         username = request.data.get('username')
#         password = request.data.get('password')
#         if not username or not password:
#             return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

#         # Call Deco's login endpoint (adjust URL)
#         deco_login_url = "https://deco.example.com/api/auth/login"  # example
#         try:
#             resp = requests.post(deco_login_url, json={"username": username, "password": password})
#             if resp.status_code == 200:
#                 token = resp.json().get('token')  # adjust key based on Deco response
#                 # Store token for this user
#                 _deco_tokens[request.user.id] = token
#                 return Response({"success": True, "token": token})
#             else:
#                 return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
#         except Exception as e:
#             logger.error(f"Deco login error: {e}")
#             return Response({"error": "Could not connect to Deco"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# class DecoStatusView(APIView):
#     """
#     GET /api/deco/status/
#     Returns: {"available": true/false}
#     """
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         token = _deco_tokens.get(request.user.id)
#         if not token:
#             return Response({"error": "Not logged in to Deco"}, status=status.HTTP_401_UNAUTHORIZED)

#         # Call Deco's health/status endpoint
#         deco_status_url = "https://deco.example.com/api/health"  # example
#         try:
#             resp = requests.get(deco_status_url, headers={"Authorization": f"Bearer {token}"}, timeout=5)
#             if resp.status_code == 200:
#                 # Assume body contains { "available": true } or similar
#                 data = resp.json()
#                 available = data.get('available', False)
#                 return Response({"available": available})
#             else:
#                 return Response({"available": False})
#         except Exception as e:
#             logger.error(f"Deco status check error: {e}")
#             return Response({"available": False})


# class DecoFetchTraineesView(APIView):
#     """
#     POST /api/deco/fetch-trainees/<batch>/
#     Fetches trainees from Deco for the given batch and stores them in DB.
#     Expects no body; uses stored token.
#     """
#     permission_classes = [IsAuthenticated]

#     def post(self, request, batch):
#         token = _deco_tokens.get(request.user.id)
#         if not token:
#             return Response({"error": "Not logged in to Deco"}, status=status.HTTP_401_UNAUTHORIZED)

#         # Call Deco's endpoint (adjust URL)
#         deco_trainees_url = f"https://deco.example.com/api/alltraineesprofilesfromdeco/batch={batch}"
#         try:
#             resp = requests.get(deco_trainees_url, headers={"Authorization": f"Bearer {token}"})
#             if resp.status_code != 200:
#                 return Response({"error": "Failed to fetch trainees from Deco"}, status=resp.status_code)

#             trainees_data = resp.json()  # Expecting a list of trainee objects

#             # Store each trainee in DB using existing models
#             stored_count = 0
#             errors = []

#             for item in trainees_data:
#                 try:
#                     # The structure of item must match our expected format.
#                     # We'll create/update UserInfo and ProfileRecord.
#                     # Adjust field mapping based on actual Deco JSON.

#                     # Example: item might have fields like "name", "userId", "averageScore", "strengths", etc.
#                     user_info, _ = UserInfo.objects.update_or_create(
#                         userId=item.get('userId'),
#                         defaults={
#                             'name': item.get('name', ''),
#                             'location': item.get('location', ''),
#                             'averageScore': item.get('averageScore'),
#                             'employeeId': item.get('employeeId'),
#                             'isu': item.get('isu'),
#                             'isMapped': item.get('isMapped', False),
#                             'projectId': item.get('projectId'),
#                             'projectName': item.get('projectName'),
#                         }
#                     )

#                     # Create/update ProfileRecord
#                     profile, created = ProfileRecord.objects.update_or_create(
#                         external_id=item.get('id'),  # if there's a unique external id
#                         defaults={
#                             'userInfo': user_info,
#                             'upskillCourses': item.get('upskillCourses', []),
#                             'certificates': item.get('certificates', []),
#                             'batchRank': item.get('batchRank'),
#                             'groupRank': item.get('groupRank'),
#                             'dpi': item.get('dpi'),
#                         }
#                     )

#                     # Handle strengths
#                     strengths_data = item.get('strengths', [])
#                     if strengths_data:
#                         # Clear existing and re-add
#                         profile.strengths.all().delete()
#                         for s in strengths_data:
#                             Strength.objects.create(
#                                 profile=profile,
#                                 courseName=s.get('courseName'),
#                                 avgScore=s.get('avgScore')
#                             )

#                     # Handle weaknesses
#                     weaknesses_data = item.get('weaknesses', [])
#                     if weaknesses_data:
#                         profile.weaknesses.all().delete()
#                         for w in weaknesses_data:
#                             Weakness.objects.create(
#                                 profile=profile,
#                                 courseName=w.get('courseName'),
#                                 avgScore=w.get('avgScore')
#                             )

#                     stored_count += 1
#                 except Exception as e:
#                     errors.append({"item": item.get('userId'), "error": str(e)})

#             return Response({
#                 "message": f"Stored {stored_count} trainees",
#                 "errors": errors
#             }, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             logger.error(f"Deco fetch trainees error: {e}")
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


# #associate views

# # views.py – Add these imports at the top
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.shortcuts import get_object_or_404
# from .models import UserInfo, ProfileRecord, Job, Strength, Weakness
# from .serializers import ProfileRecordSerializer, JobSerializer
# import json
# import re

# # -------------------- Helper: Get logged-in trainee profile --------------------
# def get_trainee_profile(user):
#     """
#     Given a Django user (with role='trainee'), return the associated ProfileRecord.
#     Assumes the user's username matches the userId field in UserInfo.
#     """
#     try:
#         user_info = UserInfo.objects.get(email=user.email)
#         profile = ProfileRecord.objects.get(userInfo=user_info)
#         return profile
#     except (UserInfo.DoesNotExist, ProfileRecord.DoesNotExist):
#         return None
# # -------------------- 1. Profile View --------------------
# class AssociateProfileView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         if request.user.role != 'trainee':
#             return Response({"error": "Access denied"}, status=403)

#         try:
#             user_info = UserInfo.objects.get(email=request.user.email)
#             profile = ProfileRecord.objects.get(userInfo=user_info)
#         except (UserInfo.DoesNotExist, ProfileRecord.DoesNotExist):
#             return Response({"error": "Profile not found"}, status=404)

#         serializer = ProfileRecordSerializer(profile)
#         return Response(serializer.data)

# # -------------------- 2. Public Jobs View --------------------
# class PublicJobsView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         # Only jobs that are active and public
#         jobs = Job.objects.filter(status='active', is_public=True)
#         serializer = JobSerializer(jobs, many=True)
#         return Response(serializer.data)

# # -------------------- 3. AI Suggestion --------------------
# class AISuggestionView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         job_id = request.data.get('job_id')
#         if not job_id:
#             return Response({"error": "job_id required"}, status=400)

#         profile = get_trainee_profile(request.user)
#         if not profile:
#             return Response({"error": "Profile not found"}, status=404)

#         job = get_object_or_404(Job, id=job_id, status='active', is_public=True)

#         # Prepare data for LLM
#         strengths = [s.courseName for s in profile.strengths.all()]
#         weaknesses = [w.courseName for w in profile.weaknesses.all()]

#         prompt = f"""
#         You are a career advisor. Based on the trainee's profile and the job description below, provide a short, actionable suggestion (max 150 words) on how the trainee can improve their chances of getting this job.

#         Trainee Profile:
#         - Name: {profile.userInfo.name}
#         - Current skills: {', '.join(strengths) if strengths else 'None listed'}
#         - Areas needing improvement: {', '.join(weaknesses) if weaknesses else 'None listed'}
#         - Average score: {profile.userInfo.averageScore}%

#         Job Details:
#         - Title: {job.title}
#         - Department: {job.department}
#         - Required tech skills: {', '.join(job.techSkills)}
#         - Required soft skills: {', '.join(job.softSkills)}
#         - Description: {job.description}

#         Suggestion:
#         """
#         try:
#             from .matching_engine import llm, clean  # reuse your existing LLM
#             suggestion = clean(llm.invoke(prompt).content)
#         except Exception as e:
#             suggestion = "Unable to generate suggestion at this time. Please try again later."
#         return Response({"suggestion": suggestion})

# # -------------------- 4. Interview Questions --------------------
# class InterviewQuestionsView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         job_id = request.data.get('job_id')
#         levels = request.data.get('levels', ['low', 'medium', 'high'])
#         if not job_id:
#             return Response({"error": "job_id required"}, status=400)

#         job = get_object_or_404(Job, id=job_id, status='active', is_public=True)

#         # Build prompt to generate Q&A for three difficulty levels
#         prompt = f"""
#         Generate interview questions and answers for a {job.title} position.
#         The job requires these technical skills: {', '.join(job.techSkills)}.
#         Soft skills: {', '.join(job.softSkills)}.

#         For each difficulty level (low, medium, high), provide 3 questions with concise answers.
#         Output in JSON format exactly like this:
#         {{
#         "low": [
#             {{"question": "...", "answer": "..."}},
#             ...
#         ],
#         "medium": [...],
#         "high": [...]
#         }}
#         Do not include any other text.
#         """
#         try:
#             from .matching_engine import llm, clean
#             response_text = clean(llm.invoke(prompt).content)
#             # Extract JSON from response (might be wrapped in markdown)
#             json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
#             if json_match:
#                 qa_data = json.loads(json_match.group())
#             else:
#                 qa_data = {"error": "Could not parse response"}
#         except Exception as e:
#             qa_data = {"error": "Failed to generate questions"}
#         return Response(qa_data)

# # -------------------- 5. Career Path --------------------
# class CareerPathView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         profile = get_trainee_profile(request.user)
#         if not profile:
#             return Response({"error": "Profile not found"}, status=404)

#         strengths = [s.courseName for s in profile.strengths.all()]
#         weaknesses = [w.courseName for w in profile.weaknesses.all()]

#         prompt = f"""
#         You are an AI career coach. Based on the trainee's profile below, generate a detailed career roadmap.
#         Include short-term (1-2 years) and long-term (3-5 years) roles, skills to develop, relevant certifications, and overall advice.
#         Output in JSON format exactly like this:
#         {{
#         "short_term": {{
#             "roles": ["Role1", "Role2"],
#             "skills_to_develop": ["Skill1", "Skill2"],
#             "certifications": ["Cert1", "Cert2"],
#             "advice": "Short paragraph."
#         }},
#         "long_term": {{
#             "roles": ["RoleA", "RoleB"],
#             "skills_to_develop": ["SkillA", "SkillB"],
#             "certifications": ["CertA", "CertB"],
#             "advice": "Short paragraph."
#         }},
#         "overall_advice": "Overall advice paragraph."
#         }}

#         Trainee Profile:
#         - Current skills: {', '.join(strengths) if strengths else 'None listed'}
#         - Areas needing improvement: {', '.join(weaknesses) if weaknesses else 'None listed'}
#         - Average score: {profile.userInfo.averageScore}%
#         - Current role: Trainee
#         """
#         try:
#             from .matching_engine import llm, clean
#             response_text = clean(llm.invoke(prompt).content)
#             json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
#             if json_match:
#                 career_data = json.loads(json_match.group())
#             else:
#                 career_data = {"error": "Could not parse response"}
#         except Exception as e:
#             career_data = {"error": "Failed to generate career path"}
#         return Response(career_data)








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
    InterviewLockCreateSerializer, InterviewFeedbackSerializer
)
from .tokens import CustomTokenObtainPairSerializer
from .matching_engine import run_matching_logic, llm, clean

logger = logging.getLogger(__name__)

# ---------- Helper to get trainee profile from request user ----------
def get_trainee_profile(user):
    """
    Return the ProfileRecord associated with the given user.
    First tries to match by user.email, then by user.username (which is employeeId).
    """
    try:
        # Try to find UserInfo by email
        user_info = UserInfo.objects.get(email=user.email)
    except UserInfo.DoesNotExist:
        # Fallback: try by employeeId (which is stored in user.username)
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
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            threading.Thread(target=run_matching_logic, daemon=True).start()
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
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        if not file.name.endswith(('.xlsx', '.xls', '.csv')):
            return Response({"error": "Invalid file type. Please upload Excel files (.xlsx, .xls, .csv)"}, status=400)

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
                        'postedDate': datetime.now().strftime('%Y-%m-%d')
                    }
                    serializer = JobSerializer(data=job_data)
                    if serializer.is_valid():
                        job = serializer.save()
                        created_jobs.append(job.title)
                    else:
                        errors.append(f"Row {index+2}: {serializer.errors}")
                except Exception as e:
                    errors.append(f"Row {index+2}: {str(e)}")

            if created_jobs:
                threading.Thread(target=run_matching_logic).start()
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
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        try:
            doc = Document(file)
            content = '\n'.join([para.text for para in doc.paragraphs])
            job_data = self.parse_word_content(content)
            if job_data:
                serializer = JobSerializer(data=job_data)
                if serializer.is_valid():
                    job = serializer.save()
                    threading.Thread(target=run_matching_logic).start()
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
        serializer = ProfileRecordSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProfileRecordSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            # Create Django user if employeeId exists
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
                # Create Django user if employeeId exists
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
    # POST
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
# class RunMatchingEngineView(APIView):
#     def post(self, request):
#         result = run_matching_logic()
#         if result:
#             return Response({"message": "Matching run successfully."}, status=201)
#         else:
#             return Response({"message": "Already updated"}, status=200)
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
        matches = Match.objects.filter(trainee_ref=trainee)
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

    # @action(detail=False, methods=['post'])
    # def bulk_create(self, request):
    #     serializer = InterviewLockCreateSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     data = serializer.validated_data
    #     trainee_ids = data['trainee_ids']
    #     job_id = data['job_id']
    #     interview_datetime = data['interview_datetime']
    #     comments = data.get('comments', '')
    #     assigned_to_id = data.get('assigned_to')

    #     assigned_to = None
    #     if assigned_to_id:
    #         try:
    #             assigned_to = User.objects.get(id=assigned_to_id)
    #         except User.DoesNotExist:
    #             return Response({'error': 'Assigned user not found'}, status=400)

    #     try:
    #         job = Job.objects.get(id=job_id)
    #     except Job.DoesNotExist:
    #         return Response({'error': 'Job not found'}, status=404)

    #     locks = []
    #     for tid in trainee_ids:
    #         lock, created = InterviewLock.objects.get_or_create(
    #             trainee_id=tid,
    #             job_id=job_id,
    #             defaults={
    #                 'locked_by': request.user,
    #                 'interview_datetime': interview_datetime,
    #                 'comments': comments,
    #                 'assigned_to': assigned_to,
    #             }
    #         )
    #         if created:
    #             locks.append(lock)
    #     output_serializer = self.get_serializer(locks, many=True)
    #     return Response(output_serializer.data, status=201)
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = InterviewLockCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        trainee_user_ids = data['trainee_ids']          # these are strings (userId)
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

        # Map userId strings to ProfileRecord primary keys
        profiles = ProfileRecord.objects.filter(
            userInfo__userId__in=trainee_user_ids
        ).select_related('userInfo')
        userid_to_profid = {p.userInfo.userId: p.id for p in profiles}

        locks = []
        for user_id in trainee_user_ids:
            prof_id = userid_to_profid.get(user_id)
            if not prof_id:
                # Optionally log or skip; you may want to return an error
                continue
            lock, created = InterviewLock.objects.get_or_create(
                trainee_id=prof_id,          # use the integer primary key
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
            return Response({'error': 'Access denied. Your role is "{}". Expected "interviewer".'.format(request.user.role)}, status=403)
        qs = self.get_queryset().filter(assigned_to=request.user, status='locked')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

# ---------- Reports ----------
class MappedTraineesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="mapped_trainees.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name','Email','Location','Project ID','Project Name','Score'])
        mapped = UserInfo.objects.filter(isMapped=True).select_related('profile')
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
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="unmapped_trainees.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name','Email','Location','Average Score'])
        unmapped = UserInfo.objects.filter(isMapped=False).select_related('profile')
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
        unmapped = UserInfo.objects.filter(isMapped=False)
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

        deco_login_url = "https://deco.example.com/api/auth/login"  # adjust URL
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
        deco_status_url = "https://deco.example.com/api/health"  # adjust
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

        deco_trainees_url = f"https://deco.example.com/api/alltraineesprofilesfromdeco/batch={batch}"  # adjust
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

                    # Required fields check
                    if not employee_id or not user_id:
                        errors.append({
                            "item": user_id or employee_id or "unknown",
                            "error": f"Missing employeeId or userId: emp={employee_id}, user={user_id}"
                        })
                        continue

                    employee_id = str(employee_id)
                    user_id = str(user_id)

                    # Create/Update Django User (trainee)
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

                    # Create/Update UserInfo
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

                    # Create/Update ProfileRecord
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

                    # Strengths
                    if strengths_data:
                        profile.strengths.all().delete()
                        for s in strengths_data:
                            Strength.objects.create(
                                profile=profile,
                                courseName=s.get('courseName'),
                                avgScore=s.get('avgScore')
                            )

                    # Weaknesses
                    if weaknesses_data:
                        profile.weaknesses.all().delete()
                        for w in weaknesses_data:
                            Weakness.objects.create(
                                profile=profile,
                                courseName=w.get('courseName'),
                                avgScore=w.get('avgScore')
                            )

                    stored_count += 1
                except Exception as e:
                    errors.append({"item": item.get('id'), "error": str(e)})

            return Response({
                "message": f"Stored {stored_count} trainees",
                "errors": errors
            }, status=201)

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
        print(request.user)
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
            suggestion = "Unable to generate suggestion at this time. Please try again later."
        return Response({"suggestion": suggestion})

class InterviewQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_id = request.data.get('job_id')
        levels = request.data.get('levels', ['low','medium','high'])
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

        # Skill gap analysis for top 5 matches
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


from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

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