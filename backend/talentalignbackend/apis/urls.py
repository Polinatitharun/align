



# urls.py – full version with new associate endpoints added

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # 🔐 Auth
    LoginView,

    # 👤 User Management
    AddUserView,
    ManagerChatContextView,
    ManagerChatSessionViewSet,
    UploadAddExcelView,
    UserListView,
    UploadBulkDeleteUsersView,
    UploadBulkActivateUsersView,
    UploadBulkDeactivateUsersView,
    EditUserView,
    DeleteUserView,
    ToggleUserStatusView,
    ResetPasswordView,

    # 💼 Job Management (existing class-based views)
    JobListView,
    JobDetailView,
    ToggleJobStatusView,
    UploadExcelView,
    UploadWordView,
    DownloadExcelTemplateView,
    DownloadWordTemplateView,

    # 🧑‍🎓 Profiles & Trainees
    ProfileListCreateAPIView,
    ProfileDetailAPIView,
    BulkUploadProfilesAPIView,

    # 🔗 Recommendations
    recommendation_list_create,
    recommendation_detail,

    # 🤖 Matching Engine
    RunMatchingEngineView,
    JobMatchListView,
    TraineeMatchListView,

    # ℹ️ UserInfo & Mapping
    UserInfoDetailAPIView,
    UserInfoMappingUpdateAPIView,
    CreateInterviewerView,

    # ========== ViewSets ==========
    JobViewSet,
    InterviewLockViewSet,

    # 📊 Reports
    MappedTraineesReportView,
    UnmappedTraineesReportView,
    OpenPoolReportView,

    # 🌐 Deco Integration
    DecoLoginView,
    DecoStatusView,
    DecoFetchTraineesView,

    # 👤 Associate Views (existing)
    AssociateProfileView,
    PublicJobsView,
    AISuggestionView,
    InterviewQuestionsView,
    CareerPathView,

    # ===== NEW ASSOCIATE ENDPOINTS =====
    AssociateDashboardView,      # <-- new
    PeerComparisonView,          # <-- new
)

# Router for InterviewLockViewSet
router = DefaultRouter()
router.register(r'interview-locks', InterviewLockViewSet, basename='interview-lock')
router.register(r'manager/chat-sessions', ManagerChatSessionViewSet, basename='manager-chat-session')

urlpatterns = [
    # 🔐 Auth
    path('login/', LoginView.as_view(), name='login'),

    # 👤 User Management
    path('users/add/', AddUserView.as_view(), name='add-user'),
    path('users/upload-excel/', UploadAddExcelView.as_view(), name='upload-users-excel'),
    path('users/', UserListView.as_view(), name='list-users'),
    path('users/bulk-delete-upload/', UploadBulkDeleteUsersView.as_view(), name='bulk-delete-users'),
    path('users/bulk-activate-upload/', UploadBulkActivateUsersView.as_view(), name='bulk-activate-users'),
    path('users/bulk-deactivate-upload/', UploadBulkDeactivateUsersView.as_view(), name='bulk-deactivate-users'),

    # ✏️ Edit / Delete
    path('users/<int:user_id>/edit/', EditUserView.as_view(), name='edit-user'),
    path('users/<int:user_id>/delete/', DeleteUserView.as_view(), name='delete-user'),

    # 🔁 Activate / Deactivate
    path('users/<int:user_id>/toggle-status/', ToggleUserStatusView.as_view(), name='toggle-user-status'),

    # 🔐 Password Reset
    path('users/<int:user_id>/reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    # 💼 Jobs (existing CRUD)
    path('jobs/', JobListView.as_view(), name='job-list'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('jobs/<int:pk>/toggle-status/', ToggleJobStatusView.as_view(), name='toggle-job-status'),

    # 📤 Job uploads & templates
    path('jobs/upload-excel/', UploadExcelView.as_view(), name='upload-excel'),
    path('jobs/upload-word/', UploadWordView.as_view(), name='upload-word'),
    path('jobs/download-excel-template/', DownloadExcelTemplateView.as_view(), name='download-excel-template'),
    path('jobs/download-word-template/', DownloadWordTemplateView.as_view(), name='download-word-template'),

    # ===== Job visibility endpoint (using JobViewSet action) =====
    path('jobs/<int:pk>/set-visibility/', JobViewSet.as_view({'patch': 'set_visibility'}), name='set-job-visibility'),

    # 🧑‍🎓 Profiles
    path('api/profiles/', ProfileListCreateAPIView.as_view(), name='profiles-list-create'),
    path('api/profiles/<str:userId>/', ProfileDetailAPIView.as_view(), name='profiles-detail'),
    path('profiles/bulk-upload/', BulkUploadProfilesAPIView.as_view(), name='profiles-bulk-upload'),
    path('users/create-interviewer/', CreateInterviewerView.as_view(), name='create-interviewer'),

    # 🔗 Recommendations
    path('jobs/recommendations/', recommendation_list_create, name='recommendation-list-create'),
    path('jobs/recommendations/<int:pk>/', recommendation_detail, name='recommendation-detail'),

    # 🤖 Matching Engine
    path('run-matching/', RunMatchingEngineView.as_view(), name='run_matching'),
    path('matches/<int:job_id>/', JobMatchListView.as_view(), name='job_matches'),
    path('trainee-matches/<int:trainee_id>/', TraineeMatchListView.as_view(), name='trainee_matches'),

    # ℹ️ UserInfo & Mapping
    path('api/userinfo/<str:userId>/', UserInfoDetailAPIView.as_view(), name='userinfo-detail'),
    path('api/userinfo/<str:userId>/update-mapping/', UserInfoMappingUpdateAPIView.as_view(), name='userinfo-update-mapping'),

    # ===== Interview Lock endpoints (via router) =====
    path('', include(router.urls)),

    # 📊 Reports
    path('reports/mapped/', MappedTraineesReportView.as_view(), name='report-mapped'),
    path('reports/unmapped/', UnmappedTraineesReportView.as_view(), name='report-unmapped'),
    path('reports/open-pool/', OpenPoolReportView.as_view(), name='report-open-pool'),

    # 🌐 Deco Integration
    path('api/deco/login/', DecoLoginView.as_view(), name='deco-login'),
    path('api/deco/status/', DecoStatusView.as_view(), name='deco-status'),
    path('api/deco/fetch-trainees/<int:batch>/', DecoFetchTraineesView.as_view(), name='deco-fetch'),

    # 👤 Associate Views (existing)
    path('associate/profile/', AssociateProfileView.as_view(), name='associate-profile'),
    path('associate/jobs/public/', PublicJobsView.as_view(), name='public-jobs'),
    path('associate/suggest/', AISuggestionView.as_view(), name='ai-suggest'),
    path('associate/interview-questions/', InterviewQuestionsView.as_view(), name='interview-questions'),
    path('associate/career-path/', CareerPathView.as_view(), name='career-path'),

    # ===== NEW ASSOCIATE ENDPOINTS =====
    path('associate/dashboard/', AssociateDashboardView.as_view(), name='associate-dashboard'),
    path('associate/peer-comparison/', PeerComparisonView.as_view(), name='peer-comparison'),
    path('manager/chat-context/', ManagerChatContextView.as_view(), name='manager-chat-context'),   
]