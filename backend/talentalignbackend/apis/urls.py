# apis/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CancelCandidateSelectionView,
    CourseListCreateView,
    CourseDetailView,
    CourseOwnerAddRecommendationsView,
    CourseOwnerAvailableTraineesView,
    NotificationListView,
    AuditLogListView,
    DashboardAnalyticsView,
    SystemBackupView,
    SystemRestoreView,
    BulkCreateInterviewersView,
    InterviewFeedbackListView,
    LoginView,
    AddUserView,
    UploadAddExcelView,
    UserListView,
    UploadBulkDeleteUsersView,
    UploadBulkActivateUsersView,
    UploadBulkDeactivateUsersView,
    EditUserView,
    DeleteUserView,
    ToggleUserStatusView,
    ResetPasswordView,
    JobListView,
    JobDetailView,
    ToggleJobStatusView,
    UploadExcelView,
    UploadWordView,
    DownloadExcelTemplateView,
    DownloadWordTemplateView,
    ProfileListCreateAPIView,
    ProfileDetailAPIView,
    BulkUploadProfilesAPIView,
    recommendation_list_create,
    recommendation_detail,
    RunMatchingEngineView,
    JobMatchListView,
    TraineeMatchListView,
    UserInfoDetailAPIView,
    UserInfoMappingUpdateAPIView,
    MappedTraineesReportView,
    UnmappedTraineesReportView,
    OpenPoolReportView,
    DecoLoginView,
    DecoStatusView,
    DecoFetchTraineesView,
    AssociateProfileView,
    PublicJobsView,
    AISuggestionView,
    InterviewQuestionsView,
    CareerPathView,
    AssociateDashboardView,
    PeerComparisonView,
    JobViewSet,
    CreateInterviewerView,
    InterviewLockViewSet,
    ManagerChatContextView,
    ManagerChatSessionViewSet,
    TraineeSelfAssessmentView,
    DownloadInterviewLockTemplateView,
    BulkInterviewLockView,
    DownloadStatusUpdateTemplateView,
    BulkStatusUpdateView,
    DownloadBulkMappingTemplateView,
    BulkMappingView,
    HRSummaryReportView,
    HRSummaryPDFView,
    # New Course Owner workflow views
    NotifyCourseOwnerView,
    CourseOwnerJobListView,
    CourseOwnerJobRecommendationsView,
    HRJobRecommendationsView,
)

router = DefaultRouter()
router.register(r'interview-locks', InterviewLockViewSet, basename='interview-lock')
router.register(r'manager/chat-sessions', ManagerChatSessionViewSet, basename='manager-chat-session')

urlpatterns = [
    # Auth
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User Management
    path('courses/', CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
    path('backup/', SystemBackupView.as_view(), name='system-backup'),
    path('restore/', SystemRestoreView.as_view(), name='system-restore'),
    path('users/add/', AddUserView.as_view(), name='add-user'),
    path('users/upload-excel/', UploadAddExcelView.as_view(), name='upload-users-excel'),
    path('users/', UserListView.as_view(), name='list-users'),
    path('users/bulk-delete-upload/', UploadBulkDeleteUsersView.as_view(), name='bulk-delete-users'),
    path('users/bulk-activate-upload/', UploadBulkActivateUsersView.as_view(), name='bulk-activate-users'),
    path('users/bulk-deactivate-upload/', UploadBulkDeactivateUsersView.as_view(), name='bulk-deactivate-users'),
    path('users/<int:user_id>/edit/', EditUserView.as_view(), name='edit-user'),
    path('users/<int:user_id>/delete/', DeleteUserView.as_view(), name='delete-user'),
    path('users/<int:user_id>/toggle-status/', ToggleUserStatusView.as_view(), name='toggle-user-status'),
    path('users/<int:user_id>/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('users/create-interviewer/', CreateInterviewerView.as_view(), name='create-interviewer'),
    path('users/bulk-create-interviewers/', BulkCreateInterviewersView.as_view(), name='bulk-create-interviewers'),

    # Jobs
    path('jobs/', JobListView.as_view(), name='job-list'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('jobs/<int:pk>/toggle-status/', ToggleJobStatusView.as_view(), name='toggle-job-status'),
    path('jobs/<int:pk>/set-visibility/', JobViewSet.as_view({'patch': 'set_visibility'}), name='set-job-visibility'),
    path('jobs/upload-excel/', UploadExcelView.as_view(), name='upload-excel'),
    path('jobs/upload-word/', UploadWordView.as_view(), name='upload-word'),
    path('jobs/download-excel-template/', DownloadExcelTemplateView.as_view(), name='download-excel-template'),
    path('jobs/download-word-template/', DownloadWordTemplateView.as_view(), name='download-word-template'),

    # Bulk operations
    path('jobs/download-interview-lock-template/', DownloadInterviewLockTemplateView.as_view(), name='download-interview-lock-template'),
    path('jobs/bulk-interview-lock/', BulkInterviewLockView.as_view(), name='bulk-interview-lock'),
    path('jobs/download-status-update-template/', DownloadStatusUpdateTemplateView.as_view(), name='download-status-update-template'),
    path('jobs/bulk-status-update/', BulkStatusUpdateView.as_view(), name='bulk-status-update'),
    path('jobs/download-bulk-mapping-template/', DownloadBulkMappingTemplateView.as_view(), name='download-bulk-mapping-template'),
    path('jobs/bulk-mapping/', BulkMappingView.as_view(), name='bulk-mapping'),

    # Profiles
    path('api/profiles/', ProfileListCreateAPIView.as_view(), name='profiles-list-create'),
    path('api/profiles/<str:userId>/', ProfileDetailAPIView.as_view(), name='profiles-detail'),
    path('profiles/bulk-upload/', BulkUploadProfilesAPIView.as_view(), name='profiles-bulk-upload'),

    # Recommendations
    path('jobs/recommendations/', recommendation_list_create, name='recommendation-list-create'),
    path('jobs/recommendations/<int:pk>/', recommendation_detail, name='recommendation-detail'),

    # Matching Engine
    path('run-matching/', RunMatchingEngineView.as_view(), name='run_matching'),
    path('matches/<int:job_id>/', JobMatchListView.as_view(), name='job_matches'),
    path('trainee-matches/<int:trainee_id>/', TraineeMatchListView.as_view(), name='trainee_matches'),

    # UserInfo & Mapping
    path('api/userinfo/<str:userId>/', UserInfoDetailAPIView.as_view(), name='userinfo-detail'),
    path('api/userinfo/<str:userId>/update-mapping/', UserInfoMappingUpdateAPIView.as_view(), name='userinfo-update-mapping'),

    # Interview Locks (router included)
    path('', include(router.urls)),
    path('interview-feedback/', InterviewFeedbackListView.as_view(), name='interview-feedback-list'),

    # Reports
    path('reports/mapped/', MappedTraineesReportView.as_view(), name='report-mapped'),
    path('reports/unmapped/', UnmappedTraineesReportView.as_view(), name='report-unmapped'),
    path('reports/open-pool/', OpenPoolReportView.as_view(), name='report-open-pool'),
    path('reports/hr-summary/', HRSummaryReportView.as_view(), name='hr-summary-report'),

    # Deco
    path('api/deco/login/', DecoLoginView.as_view(), name='deco-login'),
    path('api/deco/status/', DecoStatusView.as_view(), name='deco-status'),
    path('api/deco/fetch-trainees/<int:batch>/', DecoFetchTraineesView.as_view(), name='deco-fetch'),

    # Associate Views
    path('associate/profile/', AssociateProfileView.as_view(), name='associate-profile'),
    path('associate/jobs/public/', PublicJobsView.as_view(), name='public-jobs'),
    path('associate/suggest/', AISuggestionView.as_view(), name='ai-suggest'),
    path('associate/interview-questions/', InterviewQuestionsView.as_view(), name='interview-questions'),
    path('associate/career-path/', CareerPathView.as_view(), name='career-path'),
    path('associate/dashboard/', AssociateDashboardView.as_view(), name='associate-dashboard'),
    path('associate/peer-comparison/', PeerComparisonView.as_view(), name='peer-comparison'),
    path('associate/self-assessment/', TraineeSelfAssessmentView.as_view(), name='self-assessment'),

    # Manager Chat
    path('manager/chat-context/', ManagerChatContextView.as_view(), name='manager-chat-context'),
    path('reports/hr-summary-pdf/', HRSummaryPDFView.as_view(), name='hr-summary-pdf'),

    # Cancel selection
    path('api/cancel-selection/<int:lock_id>/', CancelCandidateSelectionView.as_view(), name='cancel-selection'),

    # --- NEW Course Owner workflow endpoints ---
    path('jobs/<int:job_id>/notify-owners/', NotifyCourseOwnerView.as_view(), name='notify-owners'),
    path('course-owner/jobs/', CourseOwnerJobListView.as_view(), name='course-owner-jobs'),
    path('course-owner/jobs/<int:job_id>/recommendations/', CourseOwnerJobRecommendationsView.as_view(), name='course-owner-job-recommendations'),
    path('hr/recommendations/', HRJobRecommendationsView.as_view(), name='hr-recommendations'),
    path('course-owner/jobs/<int:job_id>/add-recommendations/', CourseOwnerAddRecommendationsView.as_view(), name='course-owner-add-recommendations'),
    path('course-owner/jobs/<int:job_id>/available-trainees/', CourseOwnerAvailableTraineesView.as_view(), name='course-owner-available-trainees'),
]