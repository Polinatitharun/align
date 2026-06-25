// DashboardHR.js – Complete HR Dashboard with Course Owner Workflow, Recommendations, and All Previous Features
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import XlsxPopulate from 'xlsx-populate';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart2,
  FileText,
  LogOut,
  CheckCircle,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Search,
  X,
  User,
  Mail,
  Star,
  Target,
  Download,
  Plus,
  ArrowLeft,
  Check,
  AlertCircle,
  Link,
  BriefcaseBusiness,
  Building,
  BookOpen,
  Sparkles,
  FileSpreadsheet,
  File,
  Upload,
  Users2,
  Lock,
  XCircle,
  Shield,
  Layers,
  Activity,
  Zap,
  Award,
  TrendingUp,
  Clock,
  Info,
  MessageSquare,
  UploadCloud,
  ChevronDown,
  RefreshCw,
  Database,
  Megaphone,
  ThumbsUp,
  MapPinOff,
} from 'lucide-react';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
} from 'recharts';
import Sidebar from './Sidebar';
import api from '../api/axios';
import './styles/HrDashboard.css';

function DashboardHR({ userData, onLogout }) {
  // ==================== Core State ====================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showExcelTemplate, setShowExcelTemplate] = useState(false);
  const [showWordTemplate, setShowWordTemplate] = useState(false);
  const [techSkills, setTechSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Batch selection
  const [selectedBatch, setSelectedBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [unfilteredTrainees, setUnfilteredTrainees] = useState([]);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Data
  const [jobs, setJobs] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [skillTrends, setSkillTrends] = useState({ tech: [], soft: [] });

  // Match data
  const [jobMatches, setJobMatches] = useState(null);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [traineeMatches, setTraineeMatches] = useState(null);
  const [traineeMatchesLoading, setTraineeMatchesLoading] = useState(false);

  // Open Pool
  const [traineesWithNoMatches, setTraineesWithNoMatches] = useState([]);
  const [checkingMatches, setCheckingMatches] = useState(false);

  // Interview Locking
  const [selectedTraineeIds, setSelectedTraineeIds] = useState([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockInterviewDatetime, setLockInterviewDatetime] = useState('');
  const [lockComments, setLockComments] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [interviewers, setInterviewers] = useState([]);

  const [interviewLocks, setInterviewLocks] = useState([]);
  const [lockStats, setLockStats] = useState(null);
  const [lockFilter, setLockFilter] = useState({ status: '', job: '' });

  // Selected & Rejected lists
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [rejectedLocks, setRejectedLocks] = useState([]);
  const [viewingFeedback, setViewingFeedback] = useState(null);

  // Job Details Modal
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [jobDetailsJob, setJobDetailsJob] = useState(null);
  const [jobDetailsTab, setJobDetailsTab] = useState('overview');
  const [mappedTrainees, setMappedTrainees] = useState([]);
  const [rejectedTrainees, setRejectedTrainees] = useState([]);


  const [showPrefLocModal, setShowPrefLocModal] = useState(false);
  const getJobTechSkills = (job) => {
    if (!job) return [];
    if (Array.isArray(job.techSkills) && job.techSkills.length) {
      return job.techSkills;
    }
    if (typeof job.skills === 'string' && job.skills.trim()) {
      return job.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    }
    return [];
  };

  const getJobDepartment = (job) => job?.department || job?.bg || '—';

  // New Job State (includes new fields)
  const [newJob, setNewJob] = useState({
    project_name: '',
    location: '',
    demand_id: '',
    skills: '',
    openings: 1,
    bg: '',
    isu_hsu: '',
    stream: '',
    role: '',
    spoc_name: '',
    spoc_emp_id: '',
    rmg_head: '',
    course: '',
  });

  // Talent Search State
  const [selectedJobForSearch, setSelectedJobForSearch] = useState(null);
  const [searchJobMatches, setSearchJobMatches] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    bucket: '',
    location: '',
    minTotal: 0,
    skillKeyword: '',
  });
  const [selectedSearchTraineeIds, setSelectedSearchTraineeIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Pagination
  const [traineePage, setTraineePage] = useState(1);
  const traineesPerPage = 10;

  // Analytics
  const [totalMatchesCount, setTotalMatchesCount] = useState(0);
  const [avgMatchPercent, setAvgMatchPercent] = useState(0);
  const [bucketDistribution, setBucketDistribution] = useState({
    PERFECT_MATCH: 0,
    SKILLS_ONLY: 0,
    LOCATION_ONLY: 0,
    NEARBY: 0,
    NO_MATCH: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Privacy & Download
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState('');
  const [pendingDownload, setPendingDownload] = useState(null);

  // Interviewer Creation
  const [showCreateInterviewerModal, setShowCreateInterviewerModal] = useState(false);
  const [newInterviewer, setNewInterviewer] = useState({
    username: '',
    password: 'Tcs#12345',
    email: '',
    access_start: '',
    access_end: '',
  });

  // Bulk operations state
  const [showBulkLockModal, setShowBulkLockModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkMappingModal, setShowBulkMappingModal] = useState(false);
  const [bulkLockFile, setBulkLockFile] = useState(null);
  const [bulkStatusFile, setBulkStatusFile] = useState(null);
  const [bulkMappingFile, setBulkMappingFile] = useState(null);
  const [bulkOpsOpen, setBulkOpsOpen] = useState(false);

  // Auto-refresh and Backup states
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [bulkInterviewerFile, setBulkInterviewerFile] = useState(null);
  const [showBulkInterviewerModal, setShowBulkInterviewerModal] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

  // Course Owner workflow states
  const [coursesList, setCoursesList] = useState([]);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyCount, setNotifyCount] = useState(10);
  const [notifyJobId, setNotifyJobId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecJobId, setSelectedRecJobId] = useState('');
  const [recStatusFilter, setRecStatusFilter] = useState('');

  // ==================== Helper Functions ====================
  const normalizeSkill = (s) => (s || '').toString().trim().toLowerCase();
  const getBatchParam = () => (selectedBatch ? `?batch=${encodeURIComponent(selectedBatch)}` : '');
  const getRemainingOpenings = (job) => Math.max(0, Number(job?.openings || 0) - Number(job?.filled || 0));
  const getMatchTraineeUserId = (match) => String(match?.trainee_id || '');
  const findTraineeByUserId = (userId) => allTrainees.find((t) => String(t.userId) === String(userId));

  const normalizeMatchedSkills = (skills) => {
    if (Array.isArray(skills)) return skills;
    if (!skills) return [];
    return [skills];
  };

  // ==================== API Calls ====================
  const jobAPI = {
    getAllJobs: async () => (await api.get(`/jobs/${getBatchParam()}`)).data,
    getJobById: async (id) => (await api.get(`/jobs/${id}/`)).data,
    createJob: async (jobData) => (await api.post('/jobs/', { ...jobData, batch_name: selectedBatch })).data,
    updateJob: async (id, jobData) => (await api.put(`/jobs/${id}/`, jobData)).data,
    deleteJob: async (id) => (await api.delete(`/jobs/${id}/`)).data,
    toggleJobStatus: async (id) => (await api.patch(`/jobs/${id}/toggle-status/`)).data,
    uploadExcel: async (file) => {
      const formData = new FormData();
      formData.append('excel_file', file);
      formData.append('batch_name', selectedBatch);
      return (await api.post('/jobs/upload-excel/', formData)).data;
    },
    uploadWord: async (file) => {
      const formData = new FormData();
      formData.append('wordFile', file);
      formData.append('batch_name', selectedBatch);
      return (await api.post('/jobs/upload-word/', formData)).data;
    },
    downloadExcelTemplate: async () => (await api.get('/jobs/download-excel-template/', { responseType: 'blob' })).data,
    downloadWordTemplate: async () => (await api.get('/jobs/download-word-template/', { responseType: 'blob' })).data,
  };

  const mappingAPI = {
    updateMapping: async (userId, mappingData) =>
      (await api.patch(`/api/userinfo/${userId}/update-mapping/`, mappingData)).data,
    getMapping: async (userId) => (await api.get(`/api/userinfo/${userId}/`)).data,
  };

  // Fetch courses list for dropdown
  const fetchCoursesList = async () => {
    try {
      const res = await api.get('/courses/');
      setCoursesList(res.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  // Fetch trainees
  const fetchTrainees = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/profiles/${getBatchParam()}`;
      const response = await api.get(url);
      const transformed = response.data.map((trainee) => {
        const userInfo = trainee.userInfo || {};
        const skills = [
          ...(trainee.strengths?.map((s) => s.courseName) || []),
          ...(trainee.weaknesses?.map((w) => w.courseName) || []),
        ];
        const avgScore = userInfo.averageScore || 0;
        return {
          id: trainee.id,
          userId: userInfo.userId || trainee.id,
          name: userInfo.name || 'Unknown',
          email: `${userInfo.employeeId || 'EMP' + trainee.id}@example.com`,
          skills,
          score: Math.round(avgScore),
          location: (userInfo.location || 'unknown').toLowerCase(),
          isMapped: userInfo.isMapped || false,
          projectId: userInfo.projectId || '',
          projectName: userInfo.projectName || '',
          batch_name: trainee.batch_name,
          traineeData: trainee,
        };
      });
      setTrainees(transformed);
      setAllTrainees(transformed);
      if (!selectedBatch) {
        setUnfilteredTrainees(transformed);
        const batches = [...new Set(transformed.map(t => t.batch_name).filter(Boolean))];
        setAvailableBatches(batches);
      }
    } catch (err) {
      setError('Failed to fetch trainees.');
      setTrainees([]);
      setAllTrainees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullTraineeListForBatches = async () => {
    if (unfilteredTrainees.length > 0) return;
    try {
      const response = await api.get('/api/profiles/');
      const transformed = response.data.map((trainee) => {
        const userInfo = trainee.userInfo || {};
        const skills = [
          ...(trainee.strengths?.map((s) => s.courseName) || []),
          ...(trainee.weaknesses?.map((w) => w.courseName) || []),
        ];
        const avgScore = userInfo.averageScore || 0;
        return {
          id: trainee.id,
          userId: userInfo.userId || trainee.id,
          name: userInfo.name || 'Unknown',
          email: `${userInfo.employeeId || 'EMP' + trainee.id}@example.com`,
          skills,
          score: Math.round(avgScore),
          location: (userInfo.location || 'unknown').toLowerCase(),
          isMapped: userInfo.isMapped || false,
          projectId: userInfo.projectId || '',
          projectName: userInfo.projectName || '',
          batch_name: trainee.batch_name,
          traineeData: trainee,
        };
      });
      setUnfilteredTrainees(transformed);
      const batches = [...new Set(transformed.map(t => t.batch_name).filter(Boolean))];
      setAvailableBatches(batches);
    } catch (err) {
      console.error('Failed to fetch full trainee list for batches', err);
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobAPI.getAllJobs();
      setJobs(response);
    } catch (err) {
      setError('Failed to fetch jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Check Open Pool
  const checkTraineesForOpenPool = async () => {
    if (allTrainees.length === 0) return;
    setCheckingMatches(true);
    try {
      const noMatchTrainees = [];
      const unmapped = allTrainees.filter((t) => !t.isMapped);
      for (const trainee of unmapped) {
        try {
          const response = await api.get(`/trainee-matches/${trainee.id}/${getBatchParam()}`);
          const data = response.data;
          const hasNoMatch =
            (data.total_matches >= 0 &&
              data.no_match?.length > 0 &&
              !data.perfect_match?.length &&
              !data.skills_only?.length &&
              !data.location_only?.length &&
              !data.nearby?.length) ||
            data.total_matches === 0;
          if (hasNoMatch) {
            noMatchTrainees.push({
              ...trainee,
              trainee_id: trainee.id,
              trainee_name: trainee.name,
              trainee_location: trainee.location,
              total_matches: data.total_matches,
              no_match_count: data.no_match?.length || 0,
            });
          }
        } catch (error) {
          noMatchTrainees.push({ ...trainee, total_matches: 0, no_match_count: 0 });
        }
      }
      setTraineesWithNoMatches(noMatchTrainees);
    } catch (err) {
      toast.error('Failed to check Open Pool');
    } finally {
      setCheckingMatches(false);
    }
  };

  // Update job vacancies after mapping
  const updateJobVacancies = async (job) => {
    try {
      const newFilled = Math.min(Number(job.openings || 0), Number(job.filled || 0) + 1);
      const updated = { ...job, filled: newFilled };
      await jobAPI.updateJob(job.id, updated);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      if (selectedJob?.id === job.id) setSelectedJob(updated);
      if (selectedJobForSearch?.id === job.id) setSelectedJobForSearch(updated);
      if (getRemainingOpenings(updated) <= 0) await checkAndAutoDeactivateJob(updated);
      return updated;
    } catch (error) {
      toast.error('Failed to update job vacancies');
      throw error;
    }
  };

  const checkAndAutoDeactivateJob = async (job) => {
    if (getRemainingOpenings(job) <= 0) {
      const updated = { ...job, status: 'filled' };
      await jobAPI.updateJob(job.id, updated);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      toast.success(`Job "${job.project_name}" auto‑deactivated.`);
    }
  };

  // Map trainee to project
  const handleMapToProject = async (traineeOrMatch, job) => {
    try {
      setLoading(true);
      let userId = null;
      let traineeName = '';

      if (traineeOrMatch.traineeData) {
        userId = traineeOrMatch.traineeData.userInfo.userId;
        traineeName = traineeOrMatch.name;
      } else {
        const match = traineeOrMatch;
        const found = findTraineeByUserId(getMatchTraineeUserId(match));
        if (found) {
          userId = found.userId;
          traineeName = found.name;
        } else {
          toast.error('Trainee not found in local data');
          return;
        }
      }

      if (!userId) {
        toast.error('Could not find user ID');
        return;
      }

      if (getRemainingOpenings(job) <= 0) {
        toast.error('No openings left for this job');
        return;
      }

      const mappingData = { isMapped: true, projectId: job.id.toString(), projectName: job.project_name };
      await mappingAPI.updateMapping(userId, mappingData);
      const updatedJob = await updateJobVacancies(job);

      if (selectedJobForSearch && selectedJobForSearch.id === job.id) {
        setSelectedJobForSearch(updatedJob);
        await handleJobSelectForSearch(job.id);
      }

      setTraineesWithNoMatches((prev) => prev.filter((t) => t.userId !== userId));

      setAllTrainees((prev) =>
        prev.map((t) => (t.userId === userId ? { ...t, isMapped: true, projectId: job.id, projectName: job.project_name } : t))
      );
      setTrainees((prev) =>
        prev.map((t) => (t.userId === userId ? { ...t, isMapped: true, projectId: job.id, projectName: job.project_name } : t))
      );

      if (jobMatches) {
        const bucket = Object.keys(jobMatches).find((key) =>
          Array.isArray(jobMatches[key]) && jobMatches[key].some((m) => getMatchTraineeUserId(m) === String(userId))
        );
        if (bucket) {
          setJobMatches((prev) => ({
            ...prev,
            [bucket]: prev[bucket].filter((m) => getMatchTraineeUserId(m) !== String(userId)),
            total_matches: prev.total_matches - 1,
          }));
        }
      }

      if (searchJobMatches) {
        await handleJobSelectForSearch(job.id);
      }

      setRecentActivity(prev => [
        { type: 'Mapped', trainee: traineeName, job: job.project_name, time: new Date().toLocaleString() },
        ...prev.slice(0, 4)
      ]);

      toast.success(`Mapped ${traineeName} to ${job.project_name}`);
    } catch (err) {
      console.error('Mapping error:', err);
      toast.error('Failed to map trainee: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUnmapFromProject = async (trainee) => {
    try {
      setLoading(true);
      const unmappingData = { isMapped: false, projectId: '', projectName: '' };
      await mappingAPI.updateMapping(trainee.userId, unmappingData);
      const jobId = trainee.projectId;
      if (jobId) {
        const job = jobs.find((j) => j.id.toString() === jobId);
        if (job) {
          const updated = {
            ...job,
            filled: Math.max(0, (job.filled || 0) - 1),
          };
          if (['inactive', 'filled'].includes(job.status) && updated.openings - updated.filled > 0) updated.status = 'active';
          await jobAPI.updateJob(job.id, updated);
          setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
          if (selectedJob?.id === job.id) setSelectedJob(updated);
          if (selectedJobForSearch?.id === job.id) setSelectedJobForSearch(updated);
        }
      }
      setAllTrainees((prev) => prev.map((t) => (t.id === trainee.id ? { ...t, ...unmappingData } : t)));
      if (['mapped', 'unmapped', 'trainees', 'openPool'].includes(activeTab)) fetchTrainees();
      if (selectedTrainee?.id === trainee.id) setSelectedTrainee({ ...selectedTrainee, ...unmappingData });
      toast.success(`Unmapped ${trainee.name}`);
    } catch (err) {
      toast.error('Failed to unmap trainee');
    } finally {
      setLoading(false);
    }
  };

  // Fetch job matches
  const fetchJobMatches = async (jobId) => {
    setJobMatchesLoading(true);
    try {
      const response = await api.get(`/matches/${jobId}/${getBatchParam()}`);
      setJobMatches(response.data);
    } catch (err) {
      toast.error('Failed to fetch job matches');
    } finally {
      setJobMatchesLoading(false);
    }
  };

  // Fetch trainee matches
  const fetchTraineeMatches = async (traineeId) => {
    setTraineeMatchesLoading(true);
    try {
      const response = await api.get(`/trainee-matches/${traineeId}/${getBatchParam()}`);
      setTraineeMatches(response.data);
    } catch (err) {
      toast.error('Failed to fetch trainee matches');
    } finally {
      setTraineeMatchesLoading(false);
    }
  };

  // Fetch mapped trainees for a job
  const fetchMappedForJob = async (jobId) => {
    try {
      const mapped = allTrainees.filter(t => t.isMapped && t.projectId === jobId.toString());
      setMappedTrainees(mapped);
    } catch (err) {
      toast.error('Failed to fetch mapped trainees');
    }
  };

  // Fetch rejected trainees for a job
  const fetchRejectedForJob = async (jobId) => {
    try {
      const res = await api.get(`/interview-locks/?job=${jobId}&status=rejected${selectedBatch ? `&batch=${selectedBatch}` : ''}`);
      setRejectedTrainees(res.data);
    } catch (err) {
      toast.error('Failed to fetch rejected trainees');
    }
  };

  const handleViewTraineeProfileFromJob = (match) => {
    const trainee = findTraineeByUserId(getMatchTraineeUserId(match));
    if (trainee) {
      setSelectedTrainee(trainee);
      setShowJobDetailsModal(false);
      fetchTraineeMatches(trainee.id);
    } else {
      toast.error('Trainee not found');
    }
  };

  const handleViewJobDetails = (job) => {
    setJobDetailsJob(job);
    setJobDetailsTab('overview');
    fetchMappedForJob(job.id);
    fetchRejectedForJob(job.id);
    setShowJobDetailsModal(true);
  };

  const handleViewTraineeProfile = (trainee) => {
    setSelectedTrainee(trainee);
    fetchTraineeMatches(trainee.id);
  };

  const toggleJobStatus = async (jobId) => {
    try {
      await jobAPI.toggleJobStatus(jobId);
      setJobs((jobs) =>
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: job.status === 'active' ? 'inactive' : 'active' } : job
        )
      );
      toast.success('Job status updated!');
    } catch (err) {
      toast.error('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      setLoading(true);
      await jobAPI.deleteJob(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
      toast.success('Job deleted');
    } catch (err) {
      toast.error('Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  // Create job
  const handleCreateJob = async () => {
    if (!newJob.project_name || !newJob.location || !newJob.demand_id || !newJob.skills || !newJob.openings) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      const jobData = {
        project_name: newJob.project_name,
        location: newJob.location,
        demand_id: newJob.demand_id,
        skills: newJob.skills,
        openings: newJob.openings,
        bg: newJob.bg,
        isu_hsu: newJob.isu_hsu,
        stream: newJob.stream,
        role: newJob.role,
        spoc_name: newJob.spoc_name,
        spoc_emp_id: newJob.spoc_emp_id,
        rmg_head: newJob.rmg_head,
        course: newJob.course || null,
        status: 'active',
        filled: 0,
        matches: 0,
        postedDate: new Date().toISOString().split('T')[0],
        batch_name: selectedBatch,
      };
      await jobAPI.createJob(jobData);
      await fetchJobs();
      setNewJob({
        project_name: '',
        location: '',
        demand_id: '',
        skills: '',
        openings: 1,
        bg: '',
        isu_hsu: '',
        stream: '',
        role: '',
        spoc_name: '',
        spoc_emp_id: '',
        rmg_head: '',
        course: '',
      });
      setActiveTab('jobs');
      toast.success('Job created');
    } catch (err) {
      toast.error('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (updatedJob) => {
    try {
      setLoading(true);
      await jobAPI.updateJob(updatedJob.id, updatedJob);
      await fetchJobs();
      setSelectedJob(null);
      setIsEditMode(false);
      setActiveTab('jobs');
      setTechSkills([]);
      setSoftSkills([]);
      toast.success('Job updated');
    } catch (err) {
      toast.error('Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  // Skill handlers
  const handleTechSkillAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = e.target.value.trim();
      if (skill) {
        const currentSkills = (selectedJob && isEditMode ? selectedJob.skills : newJob.skills) || '';
        const skillArray = currentSkills.split(',').map(s => s.trim()).filter(s => s);
        if (!skillArray.includes(skill)) {
          const updatedSkills = [...skillArray, skill].join(', ');
          if (selectedJob && isEditMode) {
            setSelectedJob({ ...selectedJob, skills: updatedSkills });
          } else {
            setNewJob({ ...newJob, skills: updatedSkills });
          }
        }
        e.target.value = '';
      }
    }
  };

  const removeTechSkill = (index) => {
    const currentSkills = (selectedJob && isEditMode ? selectedJob.skills : newJob.skills) || '';
    const skillArray = currentSkills.split(',').map(s => s.trim()).filter(s => s);
    skillArray.splice(index, 1);
    const updatedSkills = skillArray.join(', ');
    if (selectedJob && isEditMode) {
      setSelectedJob({ ...selectedJob, skills: updatedSkills });
    } else {
      setNewJob({ ...newJob, skills: updatedSkills });
    }
  };

  // Stats
  const calculateStatistics = () => {
    const totalTrainees = allTrainees.length;
    const totalJobs = jobs.length;
    const mappedTrainees = allTrainees.filter((t) => t.isMapped).length;
    const unmappedTrainees = allTrainees.filter((t) => !t.isMapped).length;
    const activeJobs = jobs.filter((j) => j.status === 'active').length;
    const filledPositions = jobs.reduce((sum, job) => sum + (job.filled || 0), 0);
    const totalOpenings = jobs.reduce((sum, job) => sum + (job.openings || 0), 0);
    const fillRate = totalOpenings ? Math.round((filledPositions / totalOpenings) * 100) : 0;
    return { totalTrainees, totalJobs, mappedTrainees, unmappedTrainees, activeJobs, filledPositions, totalOpenings, fillRate };
  };
  const stats = calculateStatistics();

  // Interview Lock Functions
  const fetchInterviewLocks = async () => {
    try {
      setLoading(true);
      let url = '/interview-locks/';
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch', selectedBatch);
      if (lockFilter.status) params.append('status', lockFilter.status);
      if (lockFilter.job) params.append('job', lockFilter.job);
      if (params.toString()) url += '?' + params.toString();
      const response = await api.get(url);
      setInterviewLocks(response.data);
    } catch (err) {
      toast.error('Failed to fetch interview locks');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockStats = async () => {
    try {
      const response = await api.get(`/interview-locks/dashboard/${getBatchParam()}`);
      setLockStats(response.data);
    } catch (err) {
      console.error('Failed to fetch lock stats', err);
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch', selectedBatch);
      const res = await api.get(`/dashboard/analytics/${params.toString() ? `?${params.toString()}` : ''}`);
      setDashboardAnalytics(res.data);
      setTotalMatchesCount(
        (res.data.match_breakdown?.perfect_match || 0) +
        (res.data.match_breakdown?.skill_only || 0) +
        (res.data.match_breakdown?.location_only || 0)
      );
      setBucketDistribution(prev => ({
        ...prev,
        PERFECT_MATCH: res.data.match_breakdown?.perfect_match || 0,
        SKILLS_ONLY: res.data.match_breakdown?.skill_only || 0,
        LOCATION_ONLY: res.data.match_breakdown?.location_only || 0,
      }));
    } catch (err) {
      console.error('Failed to fetch dashboard analytics', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const fetchFeedbackRecords = async () => {
    try {
      const query = feedbackSearch ? `?search=${encodeURIComponent(feedbackSearch)}` : '';
      const res = await api.get(`/interview-feedback/${query}`);
      setFeedbackRecords(res.data || []);
    } catch (err) {
      toast.error('Failed to load interview feedback');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit-logs/');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  // ==================== Download Helpers ====================
  const createPasswordProtectedExcel = async (data, sheetName, password) => {
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name(sheetName);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        sheet.cell(i + 1, j + 1).value(row[j]);
      }
    }
    data[0]?.forEach((_, colIndex) => { sheet.column(colIndex + 1).width(20); });
    return await workbook.outputAsync({ password: password, type: 'blob' });
  };

  const parseCSVToArray = (csvText) => {
    const lines = csvText.trim().split(/\r?\n/);
    return lines.map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
  };

  const getFilteredSearchData = async () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = findTraineeByUserId(getMatchTraineeUserId(m));
      return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch.id.toString());
    });
    if (filtered.length === 0) throw new Error('No data');
    const rows = [['Trainee Name', 'Location', 'Bucket', 'Skills %', 'Location %', 'Total %', 'Matched Skills']];
    filtered.forEach(m => {
      rows.push([
        m.trainee_name,
        m.trainee_location || '',
        m.bucket === 'NEARBY' ? 'Proximity' : m.bucket.replace('_', ' '),
        m.skills_percentage,
        m.location_percentage,
        m.total_percentage,
        normalizeMatchedSkills(m.matched_skills).join('; '),
      ]);
    });
    return rows;
  };

  const getFilteredInterviewLocksData = async () => {
    const filtered = interviewLocks;
    if (filtered.length === 0) throw new Error('No data');
    const rows = [['Trainee Name', 'Job Title', 'Interviewer', 'Interview DateTime', 'Status', 'Comments', 'Locked By', 'Created At']];
    filtered.forEach(lock => {
      rows.push([
        lock.trainee_name,
        lock.job_title,
        lock.assigned_to_name || '',
        lock.interview_datetime,
        lock.status,
        lock.comments || '',
        lock.locked_by_name || '',
        lock.created_at,
      ]);
    });
    return rows;
  };

  const requestDownload = (type, params = {}) => {
    setPendingDownload({ type, params });
    setShowPrivacyModal(true);
    setPrivacyAgreed(false);
    setDownloadPassword('');
  };

  const executeDownload = async () => {
    if (!privacyAgreed) { toast.error('You must agree to the privacy policy'); return; }
    if (downloadPassword !== 'Tcs#12345') { toast.error('Incorrect password'); setDownloadPassword(''); return; }
    setShowPrivacyModal(false);

    const { type, params } = pendingDownload;
    try {
      let data = null, filename = '', sheetName = '';
      if (type === 'search') {
        data = await getFilteredSearchData();
        filename = `job_matches_${selectedJobForSearch?.title || 'search'}.xlsx`;
        sheetName = 'Matches';
      } else if (type === 'lock-report') {
        const url = `/interview-locks/report/${params.status ? `?status=${params.status}${selectedBatch ? `&batch=${selectedBatch}` : ''}` : `${selectedBatch ? `?batch=${selectedBatch}` : ''}`}`;
        const response = await api.get(url, { responseType: 'blob' });
        const csvText = await response.data.text();
        data = parseCSVToArray(csvText);
        filename = `interview_locks${params.status ? '_' + params.status : ''}.xlsx`;
        sheetName = `Locks${params.status ? `_${params.status}` : ''}`;
      } else if (type === 'report') {
        const url = `/reports/${params.reportType}/${getBatchParam()}`;
        const response = await api.get(url, { responseType: 'blob' });
        const csvText = await response.data.text();
        data = parseCSVToArray(csvText);
        filename = `${params.reportType}_report.xlsx`;
        sheetName = `${params.reportType.charAt(0).toUpperCase() + params.reportType.slice(1)}`;
      } else if (type === 'interview-filtered') {
        data = await getFilteredInterviewLocksData();
        filename = 'interview_locks_filtered.xlsx';
        sheetName = 'Filtered Locks';
      } else if (type === 'selected') {
        const rows = [['Trainee Name', 'Project', 'Source', 'Interviewer', 'Interview Date', 'Feedback']];
        selectedCandidates.forEach(c => {
          rows.push([
            c.trainee_name,
            c.job_title || c.projectName,
            c.source,
            c.assigned_to_name || (c.source === 'Direct' ? 'HR Direct' : '-'),
            c.interview_datetime ? new Date(c.interview_datetime).toLocaleString() : '-',
            c.feedback ? 'Yes' : '-',
          ]);
        });
        data = rows; filename = 'selected_candidates.xlsx'; sheetName = 'Selected';
      } else if (type === 'rejected') {
        const rows = [['Trainee Name', 'Job', 'Interviewer', 'Interview Date', 'Feedback']];
        rejectedLocks.forEach(lock => {
          rows.push([
            lock.trainee_name,
            lock.job_title,
            lock.assigned_to_name || '-',
            new Date(lock.interview_datetime).toLocaleString(),
            lock.feedback ? 'Yes' : '-',
          ]);
        });
        data = rows; filename = 'rejected_candidates.xlsx'; sheetName = 'Rejected';
      } else if (type === 'feedback') {
        const rows = [['Interviewer', 'Candidate', 'Rating', 'Feedback', 'Recommendation', 'Interview Date']];
        feedbackRecords.forEach(fb => rows.push([
          fb.interviewer_name || '',
          fb.trainee_name || '',
          fb.attitude_rating || '',
          fb.overall_comments || fb.behaviour_notes || '',
          fb.recommendation || '',
          fb.interview_date ? new Date(fb.interview_date).toLocaleString() : '',
        ]));
        data = rows; filename = 'interview_feedback.xlsx'; sheetName = 'Feedback';
      } else if (type === 'recommendations') {
        const rows = [['Trainee Name', 'Employee ID', 'Email', 'Job Title', 'Demand ID', 'Status']];
        recommendations.forEach(rec => {
          rows.push([
            rec.trainee_name || rec.trainee_id,
            rec.trainee_employee_id || rec.trainee_id,
            rec.trainee_email || (rec.trainee_employee_id ? `${rec.trainee_employee_id}@tcs.com` : rec.trainee_id),
            rec.job_title,
            rec.demand_id || '',
            rec.status,
          ]);
        });
        data = rows;
        filename = `recommendations_${selectedRecJobId || 'all'}.xlsx`;
        sheetName = 'Recommendations';
      }

      if (!data || data.length === 0) { toast.error('No data to download'); return; }
      const excelBlob = await createPasswordProtectedExcel(data, sheetName, downloadPassword);
      const downloadUrl = window.URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success('Download started. File is password-protected.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate download');
    }
  };

  const downloadReport = async (reportType) => { requestDownload('report', { reportType }); };

  const fetchInterviewers = async () => {
    try {
      const res = await api.get('/users/?role=interviewer');
      setInterviewers(res.data);
    } catch (err) { toast.error('Failed to load interviewers'); }
  };

  const fetchSelectedCandidates = async () => {
    try {
      const [locksRes, traineesRes] = await Promise.all([
        api.get(`/interview-locks/?status=selected${selectedBatch ? `&batch=${selectedBatch}` : ''}`),
        Promise.resolve(allTrainees)
      ]);
      const interviewSelected = locksRes.data;
      const directMapped = traineesRes.filter(t => t.isMapped);
      const combined = [
        ...interviewSelected.map(lock => ({ ...lock, source: 'Interview', trainee_id: lock.trainee_id, name: lock.trainee_name, projectName: lock.job_title, lock_id: lock.id })),
        ...directMapped.map(t => ({ trainee_id: t.userId, trainee_name: t.name, job_title: t.projectName, assigned_to_name: 'HR Direct', interview_datetime: null, feedback: null, source: 'Direct' }))
      ];
      setSelectedCandidates(combined);
    } catch (err) { toast.error('Failed to fetch selected candidates'); }
  };

  const fetchRejectedLocks = async () => {
    try {
      const res = await api.get(`/interview-locks/?status=rejected${selectedBatch ? `&batch=${selectedBatch}` : ''}`);
      setRejectedLocks(res.data);
    } catch (err) { toast.error('Failed to fetch rejected candidates'); }
  };

  const handleLockForInterview = async () => {
    if (selectedTraineeIds.length === 0) { toast.error('Select at least one trainee'); return; }
    if (!lockInterviewDatetime) { toast.error('Select interview date and time'); return; }
    const selectedDate = new Date(lockInterviewDatetime);
    if (selectedDate <= new Date()) { toast.error('Interview date must be in the future'); return; }
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) { toast.error('Weekends are not allowed'); return; }
    if (!assignedToId) { toast.error('Select an interviewer'); return; }
    try {
      setLoading(true);
      await api.post('/interview-locks/bulk_create/', {
        trainee_ids: selectedTraineeIds.map(id => String(id)),
        job_id: selectedJob.id,
        interview_datetime: lockInterviewDatetime,
        comments: lockComments,
        assigned_to: assignedToId,
      });
      toast.success(`Locked ${selectedTraineeIds.length} trainee(s)`);
      setRecentActivity(prev => [{ type: 'Locked', trainee: `${selectedTraineeIds.length} trainees`, job: selectedJob.project_name, time: new Date().toLocaleString() }, ...prev.slice(0, 4)]);
      setShowLockModal(false);
      setSelectedTraineeIds([]);
      setLockInterviewDatetime('');
      setLockComments('');
      setAssignedToId('');
      await refreshCurrentView();
      if (selectedJob) fetchJobMatches(selectedJob.id);
      if (selectedJobForSearch && selectedJobForSearch.id === selectedJob.id) handleJobSelectForSearch(selectedJob.id);
    } catch (err) {
      toast.error('Failed to lock trainees');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSelected = async (lockId) => {
    try {
      await api.patch(`/interview-locks/${lockId}/`, { status: 'cancelled' });
      toast.success('Selection cancelled');
      fetchSelectedCandidates();
      fetchInterviewLocks();
      fetchLockStats();
    } catch (err) { toast.error('Failed to cancel selection'); }
  };

  const handleUnlockInterview = async (lock) => {
    if (!window.confirm('Unlock this candidate and reopen the interview process?')) return;
    try {
      setLoading(true);
      await api.post(`/interview-locks/${lock.id}/unlock/`, { reopen: true });
      toast.success('Candidate unlocked and interview reopened');
      await Promise.all([fetchInterviewLocks(), fetchJobs(), fetchAuditLogs()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unlock candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelectForSearch = async (jobId) => {
    if (!jobId) {
      setSelectedJobForSearch(null);
      setSearchJobMatches(null);
      setSelectedSearchTraineeIds([]);
      setSelectAll(false);
      return;
    }
    const job = jobs.find(j => j.id === parseInt(jobId));
    if (!job) {
      setSelectedJobForSearch(null);
      setSearchJobMatches(null);
      return;
    }
    if (getRemainingOpenings(job) <= 0 || job.status !== 'active') {
      toast.error('This job has no openings or is inactive');
      setSelectedJobForSearch(null);
      setSearchJobMatches(null);
      return;
    }
    setSelectedJobForSearch(job);
    if (job) {
      setJobMatchesLoading(true);
      try {
        const res = await api.get(`/matches/${job.id}/${getBatchParam()}`);
        setSearchJobMatches(res.data);
        setSelectedSearchTraineeIds([]);
        setSelectAll(false);
      } catch (err) {
        toast.error('Failed to fetch matches');
      } finally {
        setJobMatchesLoading(false);
      }
    } else {
      setSearchJobMatches(null);
    }
  };

  const filteredSearchMatches = () => {
    if (!searchJobMatches) return [];
    const allMatches = [
      ...(searchJobMatches.perfect_match || []),
      ...(searchJobMatches.skills_only || []),
      ...(searchJobMatches.location_only || []),
      ...(searchJobMatches.nearby || []),
      ...(searchJobMatches.no_match || []),
    ];
    return allMatches.filter(m => {
      if (searchFilters.bucket && m.bucket !== searchFilters.bucket) return false;
      if (searchFilters.location && !m.trainee_location?.toLowerCase().includes(searchFilters.location.toLowerCase())) return false;
      if (searchFilters.minTotal > 0 && m.total_percentage < searchFilters.minTotal) return false;
      if (searchFilters.skillKeyword) {
        const skills = normalizeMatchedSkills(m.matched_skills);
        if (!skills.some(s => s.toLowerCase().includes(searchFilters.skillKeyword.toLowerCase()))) return false;
      }
      return true;
    });
  };

  const handleSelectAllSearch = () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = findTraineeByUserId(getMatchTraineeUserId(m));
      return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch.id.toString());
    });
    if (selectAll) setSelectedSearchTraineeIds([]);
    else setSelectedSearchTraineeIds(filtered.map(m => getMatchTraineeUserId(m)));
    setSelectAll(!selectAll);
  };

  const handleLockFromSearch = async () => {
    if (selectedSearchTraineeIds.length === 0) { toast.error('Select at least one trainee'); return; }
    if (!lockInterviewDatetime) { toast.error('Select interview date and time'); return; }
    const selectedDate = new Date(lockInterviewDatetime);
    if (selectedDate <= new Date()) { toast.error('Interview date must be in the future'); return; }
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) { toast.error('Weekends are not allowed'); return; }
    if (!assignedToId) { toast.error('Select an interviewer'); return; }
    try {
      setLoading(true);
      await api.post('/interview-locks/bulk_create/', {
        trainee_ids: selectedSearchTraineeIds.map(id => String(id)),
        job_id: selectedJobForSearch.id,
        interview_datetime: lockInterviewDatetime,
        comments: lockComments,
        assigned_to: assignedToId,
      });
      toast.success(`Locked ${selectedSearchTraineeIds.length} trainee(s)`);
      setRecentActivity(prev => [{ type: 'Locked', trainee: `${selectedSearchTraineeIds.length} trainees`, job: selectedJobForSearch.title, time: new Date().toLocaleString() }, ...prev.slice(0, 4)]);
      setShowLockModal(false);
      setSelectedSearchTraineeIds([]);
      setSelectAll(false);
      setLockInterviewDatetime('');
      setLockComments('');
      setAssignedToId('');
      await handleJobSelectForSearch(selectedJobForSearch.id);
    } catch (err) {
      toast.error('Failed to lock trainees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterviewer = async () => {
    if (!newInterviewer.username) {
      toast.error('Username required');
      return;
    }
    if (!newInterviewer.email.endsWith('@tcs.com')) {
      toast.error('Email must end with @tcs.com');
      return;
    }
    if (!newInterviewer.access_start || !newInterviewer.access_end) {
      toast.error('Access start and end are required');
      return;
    }
    try {
      await api.post('/users/create-interviewer/', newInterviewer);
      toast.success('Interviewer created');
      setShowCreateInterviewerModal(false);
      setNewInterviewer({
        username: '',
        password: 'Tcs#12345',
        email: '',
        access_start: '',
        access_end: '',
      });
      fetchInterviewers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create interviewer');
    }
  };

  const runMatchingEngine = async (jobId = '') => {
    try {
      setLoading(true);
      await api.post('/run-matching/', { job_id: jobId });
      toast.success('Matching engine triggered successfully');
      if (jobId) {
        if (selectedJob && selectedJob.id === parseInt(jobId)) fetchJobMatches(jobId);
        if (selectedJobForSearch && selectedJobForSearch.id === parseInt(jobId)) handleJobSelectForSearch(jobId);
      } else fetchJobs();
    } catch (err) { toast.error('Failed to trigger matching engine'); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      await fetchDashboardAnalytics();
      let totalMatches = 0, totalPercentSum = 0;
      const buckets = { PERFECT_MATCH: 0, SKILLS_ONLY: 0, LOCATION_ONLY: 0, NEARBY: 0, NO_MATCH: 0 };
      for (const job of jobs) {
        try {
          const res = await api.get(`/matches/${job.id}/${getBatchParam()}`);
          const data = res.data;
          totalMatches += data.total_matches || 0;
          if (data.perfect_match) totalPercentSum += data.perfect_match.reduce((acc, m) => acc + m.total_percentage, 0);
          if (data.skills_only) totalPercentSum += data.skills_only.reduce((acc, m) => acc + m.total_percentage, 0);
          if (data.location_only) totalPercentSum += data.location_only.reduce((acc, m) => acc + m.total_percentage, 0);
          if (data.nearby) totalPercentSum += data.nearby.reduce((acc, m) => acc + m.total_percentage, 0);
          if (data.no_match) totalPercentSum += data.no_match.reduce((acc, m) => acc + m.total_percentage, 0);
          buckets.PERFECT_MATCH += data.perfect_match?.length || 0;
          buckets.SKILLS_ONLY += data.skills_only?.length || 0;
          buckets.LOCATION_ONLY += data.location_only?.length || 0;
          buckets.NEARBY += data.nearby?.length || 0;
          buckets.NO_MATCH += data.no_match?.length || 0;
        } catch (err) { console.error(`Failed to fetch matches for job ${job.id}`, err); }
      }
      setTotalMatchesCount(totalMatches);
      setAvgMatchPercent(totalMatches > 0 ? Math.round(totalPercentSum / totalMatches) : 0);
      setBucketDistribution(buckets);
    } catch (err) { console.error('Analytics fetch error:', err); }
  };

  const fetchRecentActivity = async () => {
    try {
      const locksRes = await api.get(`/interview-locks/${getBatchParam()}`);
      const locks = locksRes.data.slice(0, 5).map(lock => ({
        type: lock.status === 'selected' ? 'Selected' : lock.status === 'rejected' ? 'Rejected' : 'Locked',
        trainee: lock.trainee_name,
        job: lock.job_title,
        time: new Date(lock.created_at).toLocaleString(),
      }));
      setRecentActivity(prev => { return [...locks, ...prev].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5); });
    } catch (err) { console.error('Failed to fetch recent activity', err); }
  };

  // ==================== Notify Course Owner ====================
  const handleNotify = (jobId) => {
    setNotifyJobId(jobId);
    setNotifyCount(10);
    setShowNotifyModal(true);
  };

  const executeNotify = async () => {
    try {
      setLoading(true);
      const requestedCount = Math.max(1, Math.min(50, Number(notifyCount) || 10));
      // Fetch total matches for the job
      const matchRes = await api.get(`/matches/${notifyJobId}/${getBatchParam()}`);
      const totalMatches = matchRes.data.total_matches || 0;

      if (totalMatches === 0) {
        toast.error('No trainees available to recommend for this job.');
        setShowNotifyModal(false);
        setLoading(false);   // important: reset loading state before returning
        return;
      }

      const countToSend = requestedCount;
      if (countToSend > totalMatches) {
        // Ask for confirmation – browser confirm dialog
        const confirmed = window.confirm(
          `Only ${totalMatches} trainees are available. Would you like to send recommendations for these ${totalMatches}?`
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
        // Send the actual available count
        await api.post(`/jobs/${notifyJobId}/notify-owners/`, { count: totalMatches });
      } else {
        await api.post(`/jobs/${notifyJobId}/notify-owners/`, { count: countToSend });
      }

      toast.success('Course owners notified');
      setShowNotifyModal(false);
      fetchJobs();               // refresh job statuses
      // Also refresh recommendations tab if it's currently active
      if (activeTab === 'recommendations') {
        fetchRecommendations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to notify');
    } finally {
      setLoading(false);
    }
  };
  // ==================== Fetch recommendations for HR ====================
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRecJobId) params.append('job_id', selectedRecJobId);
      if (recStatusFilter) params.append('status', recStatusFilter);
      if (selectedBatch) params.append('batch', selectedBatch);
      const res = await api.get(`/hr/recommendations/?${params.toString()}`);
      setRecommendations(res.data);
    } catch (err) {
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // ==================== Bulk Operations ====================
  const downloadInterviewLockTemplate = async () => {
    try {
      const res = await api.get('/jobs/download-interview-lock-template/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'interview_lock_template.xlsx'; a.click();
    } catch { toast.error('Download failed'); }
  };

  const handleBulkLockUpload = async () => {
    if (!bulkLockFile) { toast.error('Please select a file'); return; }
    const formData = new FormData();
    formData.append('file', bulkLockFile);
    try {
      setLoading(true);
      const res = await api.post('/jobs/bulk-interview-lock/', formData);
      toast.success(`Locked ${res.data.created} trainees. Errors: ${res.data.errors.length}`);
      setBulkLockFile(null);
      setShowBulkLockModal(false);
      fetchInterviewLocks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setLoading(false); }
  };

  const downloadStatusUpdateTemplate = async () => {
    try {
      const res = await api.get('/jobs/download-status-update-template/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'status_update_template.xlsx'; a.click();
    } catch { toast.error('Download failed'); }
  };

  const handleBulkStatusUpload = async () => {
    if (!bulkStatusFile) { toast.error('Please select a file'); return; }
    const formData = new FormData();
    formData.append('file', bulkStatusFile);
    try {
      setLoading(true);
      const res = await api.post('/jobs/bulk-status-update/', formData);
      if (res.data.success) toast.success(res.data.message || `Successfully updated ${res.data.updated} records!`);
      else toast.warning(res.data.message || `Updated ${res.data.updated} records with errors`);
      if (res.data.openings_summary && res.data.openings_summary.length > 0) toast.info(`📊 Openings left: ${res.data.openings_summary.join(', ')}`);
      if (res.data.errors && res.data.errors.length > 0) {
        const firstError = res.data.errors[0];
        toast.error(firstError.message || firstError);
        if (res.data.errors.length > 1) {
          setErrorDetails(res.data.errors);
          setShowErrorDetailsModal(true);
        }
      }
      setBulkStatusFile(null);
      setShowBulkStatusModal(false);
      await fetchInterviewLocks();
      await fetchJobs();
      await fetchAnalytics();
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        toast.error(errorData.message || errorData.error || 'Upload failed');
        if (errorData.suggestion) toast.info(errorData.suggestion);
        if (errorData.details && errorData.details.length > 0) {
          setErrorDetails(errorData.details);
          setShowErrorDetailsModal(true);
        }
      } else toast.error('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const downloadBulkMappingTemplate = async () => {
    try {
      const res = await api.get('/jobs/download-bulk-mapping-template/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'bulk_mapping_template.xlsx'; a.click();
    } catch { toast.error('Download failed'); }
  };

  const handleBulkMappingUpload = async () => {
    if (!bulkMappingFile) { toast.error('Please select a file'); return; }
    const formData = new FormData();
    formData.append('file', bulkMappingFile);
    formData.append('batch', selectedBatch);
    try {
      setLoading(true);
      const res = await api.post('/jobs/bulk-mapping/', formData);
      if (res.data.success) toast.success(res.data.message || `Successfully mapped ${res.data.mapped} trainees!`);
      else toast.warning(res.data.message || `Mapped ${res.data.mapped} trainees with some errors`);
      if (res.data.openings_summary && res.data.openings_summary.length > 0) toast.info(`📊 Openings left: ${res.data.openings_summary.join(', ')}`);
      if (res.data.errors && res.data.errors.length > 0) {
        const firstError = res.data.errors[0];
        toast.error(firstError.message);
        if (res.data.errors.length > 1) {
          setErrorDetails(res.data.errors);
          setShowErrorDetailsModal(true);
        }
      }
      if (res.data.warnings && res.data.warnings.length > 0) res.data.warnings.forEach(warning => toast.warning(warning.message));
      setBulkMappingFile(null);
      setShowBulkMappingModal(false);
      await fetchTrainees();
      await fetchJobs();
      await fetchAnalytics();
    } catch (err) {
      console.error('Bulk mapping error:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        toast.error(errorData.message || errorData.error || 'Upload failed');
        if (errorData.suggestion) toast.info(errorData.suggestion);
        if (errorData.details && errorData.details.length > 0) errorData.details.forEach(detail => toast.error(detail.message || detail));
      } else toast.error('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const handleBulkInterviewerUpload = async () => {
    if (!bulkInterviewerFile) { toast.error('Please select a CSV or Excel file'); return; }
    const formData = new FormData();
    formData.append('file', bulkInterviewerFile);
    try {
      setLoading(true);
      const res = await api.post('/users/bulk-create-interviewers/', formData);
      toast.success(`Created ${res.data.created} interviewers`);
      if (res.data.duplicates?.length) toast.warning(`${res.data.duplicates.length} duplicate rows skipped`);
      if (res.data.errors?.length) {
        setErrorDetails(res.data.errors);
        setShowErrorDetailsModal(true);
      }
      setBulkInterviewerFile(null);
      setShowBulkInterviewerModal(false);
      fetchInterviewers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk interviewer upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadHRSummaryReport = async () => {
    try {
      const response = await api.get(`/reports/hr-summary/${getBatchParam()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr_summary_${selectedBatch || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  // ==================== Refresh and Backup Functions ====================
  const refreshCurrentView = async () => {
    setLastRefresh(new Date());
    switch (activeTab) {
      case 'dashboard':
        await Promise.all([fetchJobs(), fetchTrainees(), fetchInterviewLocks(), fetchLockStats(), fetchAnalytics()]);
        break;
      case 'jobs':
      case 'createJob':
        await fetchJobs();
        break;
      case 'trainees':
      case 'mapped':
      case 'unmapped':
      case 'openPool':
        await fetchTrainees();
        if (activeTab === 'openPool') await checkTraineesForOpenPool();
        break;
      case 'talentSearch':
        if (selectedJobForSearch) await handleJobSelectForSearch(selectedJobForSearch.id);
        else await fetchJobs();
        break;
      case 'interviewLocks':
        await Promise.all([fetchInterviewLocks(), fetchLockStats()]);
        break;
      case 'selected':
        await fetchSelectedCandidates();
        break;
      case 'rejected':
        await fetchRejectedLocks();
        break;
      case 'recommendations':
        await fetchRecommendations();
        break;
      default:
        await Promise.all([fetchJobs(), fetchTrainees()]);
    }
    toast.success('Data refreshed');
  };

  const backupData = async () => {
    try {
      setBackupInProgress(true);
      const res = await api.get('/backup/', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `talent_align_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Backup created successfully');
    } catch (err) {
      toast.error('Backup failed: ' + err.message);
    } finally {
      setBackupInProgress(false);
    }
  };

  const restoreBackup = async () => {
    if (!restoreFile) { toast.error('Select a backup JSON file first'); return; }
    if (!window.confirm('Restore will validate the JSON and rollback on failure. Continue?')) return;
    const formData = new FormData();
    formData.append('file', restoreFile);
    try {
      setLoading(true);
      const res = await api.post('/restore/', formData);
      toast.success(res.data.message || 'Restore completed');
      setRestoreFile(null);
      await refreshCurrentView();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  // ==================== Effects ====================
  useEffect(() => { fetchFullTraineeListForBatches(); fetchCoursesList(); fetchCourses(); fetchNotifications(); }, []);
  useEffect(() => {
    if (['dashboard', 'trainees', 'mapped', 'unmapped', 'openPool', 'interviewLocks'].includes(activeTab)) fetchTrainees();
  }, [activeTab, selectedBatch]);
  useEffect(() => {
    if (['dashboard', 'jobs', 'createJob', 'talentSearch'].includes(activeTab)) fetchJobs();
  }, [activeTab, selectedBatch]);
  useEffect(() => {
    if (allTrainees.length && activeTab === 'openPool') checkTraineesForOpenPool();
  }, [allTrainees, activeTab, selectedBatch]);
  useEffect(() => { setSkillTrends(computeSkillTrends(jobs)); }, [jobs]);
  useEffect(() => {
    if (activeTab === 'dashboard') { fetchLockStats(); fetchAnalytics(); fetchDashboardAnalytics(); fetchRecentActivity(); }
  }, [activeTab, jobs, selectedBatch]);
  useEffect(() => {
    if (activeTab === 'feedback') fetchFeedbackRecords();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, feedbackSearch]);
  useEffect(() => {
    let filtered = [...allTrainees];
    if (searchQuery) filtered = filtered.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()) || t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    if (locationFilter) filtered = filtered.filter(t => t.location.toLowerCase().includes(locationFilter.toLowerCase()));
    if (activeTab === 'mapped') filtered = filtered.filter(t => t.isMapped);
    else if (activeTab === 'unmapped') filtered = filtered.filter(t => !t.isMapped);
    else if (activeTab === 'openPool') {
      const noMatchIds = traineesWithNoMatches.map(t => t.id || t.trainee_id);
      filtered = filtered.filter(t => !t.isMapped && noMatchIds.includes(t.id));
    }
    setTrainees(filtered);
  }, [searchQuery, locationFilter, activeTab, allTrainees, traineesWithNoMatches]);
  useEffect(() => {
    if (activeTab === 'interviewLocks') { fetchInterviewLocks(); fetchLockStats(); }
  }, [activeTab, lockFilter, selectedBatch]);
  useEffect(() => {
    if (activeTab === 'selected') fetchSelectedCandidates();
    if (activeTab === 'rejected') fetchRejectedLocks();
  }, [activeTab, allTrainees, selectedBatch]);
  useEffect(() => {
    if (activeTab === 'recommendations') fetchRecommendations();
  }, [activeTab, selectedRecJobId, recStatusFilter, selectedBatch]);

  // Auto-refresh effect for Talent Search
  useEffect(() => {
    let interval;
    if (autoRefresh && activeTab === 'talentSearch' && selectedJobForSearch) {
      interval = setInterval(() => {
        handleJobSelectForSearch(selectedJobForSearch.id);
      }, 30000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh, activeTab, selectedJobForSearch, selectedBatch]);

  const computeSkillTrends = (jobs) => {
    const techMap = new Map(); const softMap = new Map();
    const WEIGHTS = { basePerJob: 1, openingsWeight: 0.5, matchesWeight: 0.25, inactivePenalty: 0.4, unfilledBonus: 0.3 };
    for (const job of jobs || []) {
      const isActive = job?.status === 'active';
      const openings = Number(job?.openings ?? 0);
      const filled = Number(job?.filled ?? 0);
      const matches = Number(job?.matches ?? 0);
      const unfilled = Math.max(0, openings - filled);
      const jobWeight = WEIGHTS.basePerJob + openings * WEIGHTS.openingsWeight + matches * WEIGHTS.matchesWeight + unfilled * WEIGHTS.unfilledBonus;
      const effectiveWeight = isActive ? jobWeight : jobWeight * WEIGHTS.inactivePenalty;
      (job?.techSkills || []).forEach(raw => {
        const skill = normalizeSkill(raw); if (!skill) return;
        const cur = techMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
        techMap.set(skill, { jobs: cur.jobs + 1, openings: cur.openings + openings, matches: cur.matches + matches, demand: cur.demand + effectiveWeight });
      });
      (job?.softSkills || []).forEach(raw => {
        const skill = normalizeSkill(raw); if (!skill) return;
        const cur = softMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
        softMap.set(skill, { jobs: cur.jobs + 1, openings: cur.openings + openings, matches: cur.matches + matches, demand: cur.demand + effectiveWeight });
      });
    }
    const toSortedArray = (map) => {
      const arr = Array.from(map.entries()).map(([name, stats]) => ({ name, jobs: stats.jobs, openings: stats.openings, matches: stats.matches, demandRaw: stats.demand }));
      const maxDemand = Math.max(...arr.map(a => a.demandRaw), 1);
      return arr.map(a => ({ ...a, demand: Math.round((a.demandRaw / maxDemand) * 100) })).sort((a, b) => b.demand - a.demand || b.jobs - a.jobs).slice(0, 5);
    };
    return { tech: toSortedArray(techMap), soft: toSortedArray(softMap) };
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading...</p></div>}
      {error && <div className="error-message"><AlertCircle size={20} /><span>{error}</span></div>}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><Users /></div><div className="stat-content"><h3>Total Trainees</h3><div className="stat-value">{stats.totalTrainees}</div></div></div>
        <div className="stat-card"><div className="stat-icon"><BriefcaseBusiness /></div><div className="stat-content"><h3>Total Jobs</h3><div className="stat-value">{stats.totalJobs}</div></div></div>
        <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Mapped</h3><div className="stat-value">{stats.mappedTrainees}</div></div></div>
        <div className="stat-card"><div className="stat-icon"><AlertCircle /></div><div className="stat-content"><h3>Unmapped</h3><div className="stat-value">{stats.unmappedTrainees}</div></div></div>
        <div className="stat-card"><div className="stat-icon"><Target /></div><div className="stat-content"><h3>Active Jobs</h3><div className="stat-value">{stats.activeJobs}</div></div></div>
      </div>

      {lockStats && (
        <div className="stats-grid small margin-top-1">
          <div className="stat-card"><div className="stat-icon"><Lock size={20} /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.total_locked}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle size={20} /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.total_selected}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><XCircle size={20} /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.total_rejected}</div></div></div>
        </div>
      )}

      <div className="analytics-section">
        <h2 className="section-title"><Activity size={24} /> Matching Analytics</h2>
        <div className="analytics-grid">
          <div className="analytics-card"><div className="stat-icon"><Target size={20} /></div><h3>Total Matches</h3><div className="analytics-value">{totalMatchesCount}</div></div>
          <div className="analytics-card"><div className="stat-icon"><Zap size={20} /></div><h3>Avg Match %</h3><div className="analytics-value">{avgMatchPercent}%</div></div>
          <div className="analytics-card"><div className="stat-icon"><Star size={20} /></div><h3>Perfect Matches</h3><div className="analytics-value">{bucketDistribution.PERFECT_MATCH}</div></div>
          <div className="analytics-card"><div className="stat-icon"><Award size={20} /></div><h3>Skills Only</h3><div className="analytics-value">{bucketDistribution.SKILLS_ONLY}</div></div>
          <div className="analytics-card"><div className="stat-icon"><MapPin size={20} /></div><h3>Location Only</h3><div className="analytics-value">{bucketDistribution.LOCATION_ONLY}</div></div>
          <div className="analytics-card"><div className="stat-icon"><TrendingUp size={20} /></div><h3>Proximity</h3><div className="analytics-value">{bucketDistribution.NEARBY}</div></div>
        </div>

        {dashboardAnalytics && (
          <div className="chart-grid">
            <div className="analytics-card chart-card">
              <h3>Candidate Status Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie data={dashboardAnalytics.candidate_status_distribution || []} dataKey="value" nameKey="name" outerRadius={85} label>
                    {(dashboardAnalytics.candidate_status_distribution || []).map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-card chart-card">
              <h3>Top Skills Demand</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ReBarChart data={dashboardAnalytics.top_skills_demand || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-card chart-card">
              <h3>Top Courses Demand</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ReBarChart data={dashboardAnalytics.top_courses_demand || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-card chart-card">
              <h3>Monthly Hiring Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ReLineChart data={dashboardAnalytics.monthly_hiring_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="hires" stroke="#7c3aed" strokeWidth={2} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <h2 className="section-title"><Activity size={24} /> Recent Activity</h2>
        <div className="recent-activity">
          {recentActivity.length > 0 ? (
            <ul className="activity-list">
              {recentActivity.map((act, idx) => (
                <li key={idx} className="activity-item">
                  <span className={`activity-type ${act.type.toLowerCase() === 'selected' ? 'match' : 'lock'}`}>{act.type}</span>
                  <span className="activity-detail">{act.trainee} → {act.job}</span>
                  <span className="activity-time"><Clock size={14} /> {act.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-data"><Info size={20} /> No recent activity found</div>
          )}
        </div>
      </div>

      <h2 className="section-title">Top Skills in Demand</h2>
      <div className="skills-section">
        <div className="content-card">
          <div className="card-header"><h3><Target size={20} /> Technical Skills</h3></div>
          <div className="hr-skills-list">
            {skillTrends.tech.map((skill) => (
              <div key={`tech-${skill.name}`} className="skill-item">
                <div className="skill-header"><span className="skill-name">{skill.name}</span><div className="skill-stats"><span className="skill-jobs">{skill.jobs} jobs</span><span className="skill-demand">{skill.demand}%</span></div></div>
                <div className="skill-bar"><div className="skill-fill" style={{ width: `${skill.demand}%`, background: '#3b82f6' }} /></div>
              </div>
            ))}
            {skillTrends.tech.length === 0 && <div className="no-data">No technical skills found.</div>}
          </div>
        </div>
        <div className="content-card">
          <div className="card-header"><h3><Star size={20} /> Soft Skills</h3></div>
          <div className="hr-skills-list">
            {skillTrends.soft.map((skill) => (
              <div key={`soft-${skill.name}`} className="skill-item">
                <div className="skill-header"><span className="skill-name">{skill.name}</span><div className="skill-stats"><span className="skill-jobs">{skill.jobs} jobs</span><span className="skill-demand">{skill.demand}%</span></div></div>
                <div className="skill-bar"><div className="skill-fill" style={{ width: `${skill.demand}%`, background: '#10b981' }} /></div>
              </div>
            ))}
            {skillTrends.soft.length === 0 && <div className="no-data">No soft skills found.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTraineesList = () => {
    const uniqueLocations = [...new Set(allTrainees.map((t) => t.location).filter((loc) => loc))];
    const openPoolCount = traineesWithNoMatches.length;
    const indexOfLast = traineePage * traineesPerPage;
    const indexOfFirst = indexOfLast - traineesPerPage;
    const currentTrainees = trainees.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(trainees.length / traineesPerPage);

    return (
      <div className="trainees-list">
        <div className="section-header">
          <div className="header-title">
            <h2><Users size={24} /> Trainee Talent</h2>
            <p className="subtitle">Overview and management of all trainee cohorts</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading} title="Refresh">
              <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={backupData} disabled={backupInProgress} title="Backup Data">
              <Database size={18} /> {backupInProgress ? 'Backing up...' : 'Backup'}
            </button>
            <div className="view-options">
              <button className={`btn-view-option ${activeTab === 'trainees' ? 'active' : ''}`} onClick={() => setActiveTab('trainees')}>All</button>
              <button className={`btn-view-option ${activeTab === 'mapped' ? 'active' : ''}`} onClick={() => setActiveTab('mapped')}><CheckCircle size={16} /> Mapped ({stats.mappedTrainees})</button>
              <button className={`btn-view-option ${activeTab === 'unmapped' ? 'active' : ''}`} onClick={() => setActiveTab('unmapped')}><AlertCircle size={16} /> Unmapped ({stats.unmappedTrainees})</button>
              <button className={`btn-view-option ${activeTab === 'openPool' ? 'active' : ''}`} onClick={() => setActiveTab('openPool')}><Users2 size={16} /> Open Pool ({openPoolCount})</button>
            </div>
            <div className="download-buttons">
              <button className="btn btn-success" onClick={() => downloadReport('mapped')}><Download size={16} /> Mapped</button>
              <button className="btn btn-danger" onClick={() => downloadReport('unmapped')}><Download size={16} /> Unmapped</button>
            </div>
          </div>
        </div>

        <div className="search-filter">
          <div className="search-box"><input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="filter-group">
            <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><option value="">All Locations</option>{uniqueLocations.map((loc) => <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>)}</select>
            <button className="btn-icon" onClick={() => { setSearchQuery(''); setLocationFilter(''); }}><X size={18} /></button>
          </div>
        </div>

        {checkingMatches && activeTab === 'openPool' && <div className="loading-overlay"><div className="loading-spinner"></div><p>Checking Open Pool...</p></div>}
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading...</p></div>}
        {error && <div className="error-message"><AlertCircle size={20} /><span>{error}</span></div>}

        {trainees.length === 0 && !loading && !checkingMatches ? (
          <div className="no-data"><Users size={48} /><h3>No Trainees Found</h3></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Location</th><th>Batch</th><th>Skills</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {currentTrainees.map((trainee) => (
                    <tr key={trainee.id}>
                      <td><div className="trainee-name-cell"><div className="trainee-avatar-small">{trainee.name.charAt(0)}</div><span>{trainee.name}</span></div></td>
                      <td>{trainee.email}</td>
                      <td>{trainee.location}</td>
                      <td>{trainee.batch_name || '-'}</td>
                      <td><div className="skills-cell">{trainee.skills.slice(0, 3).map(skill => <span key={skill} className="skill-tag-small">{skill}</span>)}{trainee.skills.length > 3 && <span className="more-skills">+{trainee.skills.length - 3}</span>}</div></td>
                      <td><div className="score-cell"><div className="mini-progress"><div className="mini-fill" style={{ width: `${trainee.score}%` }} /></div><span>{trainee.score}%</span></div></td>
                      <td><span className={`status-badge ${trainee.isMapped ? 'status-mapped' : 'status-unmapped'}`}>{trainee.isMapped ? 'Mapped' : 'Unmapped'}</span></td>
                      <td><button className="btn-icon btn-icon-view" onClick={() => handleViewTraineeProfile(trainee)} title="View Profile"><Eye size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (<div className="pagination"><button disabled={traineePage === 1} onClick={() => setTraineePage(p => p - 1)}>&lt;</button><span>Page {traineePage} of {totalPages}</span><button disabled={traineePage === totalPages} onClick={() => setTraineePage(p => p + 1)}>&gt;</button></div>)}
          </>
        )}
      </div>
    );
  };

  const renderJobDetailsModal = () => {
    if (!showJobDetailsModal || !jobDetailsJob) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowJobDetailsModal(false)}>
        <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2><Briefcase size={24} /> {jobDetailsJob.project_name}</h2><button className="modal-close" onClick={() => setShowJobDetailsModal(false)}><X /></button></div>
          <div className="modal-tabs"><button className={jobDetailsTab === 'overview' ? 'active' : ''} onClick={() => setJobDetailsTab('overview')}>Overview</button><button className={jobDetailsTab === 'mapped' ? 'active' : ''} onClick={() => setJobDetailsTab('mapped')}>Mapped ({mappedTrainees.length})</button><button className={jobDetailsTab === 'rejected' ? 'active' : ''} onClick={() => setJobDetailsTab('rejected')}>Rejected ({rejectedTrainees.length})</button></div>
          <div className="modal-body">
            {jobDetailsTab === 'overview' && (
              <div className="job-details">
                <p><strong>Department:</strong> {getJobDepartment(jobDetailsJob)}</p>
                <p><strong>Location(s):</strong> {Array.isArray(jobDetailsJob.location) ? jobDetailsJob.location.join(', ') : jobDetailsJob.location}</p>
                <p><strong>Batch:</strong> {jobDetailsJob.batch_name || 'N/A'}</p>
                <p><strong>Openings:</strong> {jobDetailsJob.openings} ({jobDetailsJob.filled} filled)</p>
                <p><strong>Status:</strong> <span className={`status-badge status-${jobDetailsJob.status}`}>{jobDetailsJob.status}</span></p>
                <p><strong>Posted:</strong> {jobDetailsJob.postedDate}</p>
                <p><strong>Expires:</strong> {jobDetailsJob.expiryDate}</p>
                <p><strong>Salary:</strong> {jobDetailsJob.salary}</p>
                <div className="job-section"><h4>Additional Details</h4><p><strong>Demand ID:</strong> {jobDetailsJob.demand_id || '—'}</p><p><strong>BG:</strong> {jobDetailsJob.bg || '—'}</p><p><strong>ISU/HSU:</strong> {jobDetailsJob.isu_hsu || '—'}</p><p><strong>Stream:</strong> {jobDetailsJob.stream || '—'}</p><p><strong>Role:</strong> {jobDetailsJob.role || '—'}</p><p><strong>SPOC Name:</strong> {jobDetailsJob.spoc_name || '—'}</p><p><strong>SPOC Emp ID:</strong> {jobDetailsJob.spoc_emp_id || '—'}</p><p><strong>RMG Head:</strong> {jobDetailsJob.rmg_head || '—'}</p></div>
                <div className="job-section"><h4>Description</h4><p>{jobDetailsJob.description}</p></div>
                <div className="job-section"><h4>Requirements</h4><p>{jobDetailsJob.requirements}</p></div>
                <div className="job-section"><h4>Technical Skills</h4><div className="skills-list">{getJobTechSkills(jobDetailsJob).map(skill => <span key={skill} className="skill-tag tech-tag">{skill}</span>)}</div></div>
                <div className="job-section"><h4>Soft Skills</h4><div className="skills-list">{jobDetailsJob.softSkills?.map(skill => <span key={skill} className="skill-tag soft-tag">{skill}</span>)}</div></div>
              </div>
            )}
            {jobDetailsTab === 'mapped' && (<div>{mappedTrainees.length === 0 ? (<p className="no-data">No trainees mapped to this job.</p>) : (<div className="trainee-list">{mappedTrainees.map(t => (<div key={t.id} className="trainee-item"><User size={18} /><span>{t.name}</span><span className="trainee-location">({t.location})</span><button className="btn-icon" onClick={() => { setSelectedTrainee(t); setShowJobDetailsModal(false); fetchTraineeMatches(t.id); }}><Eye size={16} /></button></div>))}</div>)}</div>)}
            {jobDetailsTab === 'rejected' && (<div>{rejectedTrainees.length === 0 ? (<p className="no-data">No rejected trainees for this job.</p>) : (<div className="trainee-list">{rejectedTrainees.map(lock => (<div key={lock.id} className="trainee-item"><User size={18} /><span>{lock.trainee_name}</span><span className="trainee-location">({lock.trainee_location})</span>{lock.feedback && (<button className="btn-icon" onClick={() => setViewingFeedback(lock.feedback)}><FileText size={16} /></button>)}<button className="btn-icon" onClick={() => { const trainee = allTrainees.find(t => t.id === lock.trainee); if (trainee) { setSelectedTrainee(trainee); setShowJobDetailsModal(false); fetchTraineeMatches(trainee.id); } }}><Eye size={16} /></button></div>))}</div>)}</div>)}
          </div>
          <div className="modal-actions"><button className="btn-secondary" onClick={() => setShowJobDetailsModal(false)}>Close</button></div>
        </div>
      </div>
    );
  };

  const renderTraineeModal = () => {
    if (!selectedTrainee) return null;
    const traineeData = selectedTrainee.traineeData || selectedTrainee;
    const userInfo = traineeData.userInfo || {};

    return (
      <div className="modal-overlay" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>
        <div className="modal-content trainee-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title"><User size={24} /><h2>{userInfo.name || selectedTrainee.name}</h2></div><button className="modal-close" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}><X size={24} /></button></div>
          <div className="modal-body">
            {traineeMatchesLoading ? (<div className="loading-state"><div className="loading-spinner"></div><p>Loading trainee matches...</p></div>) : (
              <>
                <div className="trainee-details-section">
                  <div className="mapping-status-section"><h4>Project Mapping</h4><div className={`mapping-status ${selectedTrainee.isMapped ? 'mapped' : 'unmapped'}`}><div className="status-indicator">{selectedTrainee.isMapped ? (<><CheckCircle size={20} /><div><strong>Mapped to Project</strong><p>{selectedTrainee.projectName || 'Unknown Project'}</p><small>Project ID: {selectedTrainee.projectId || 'N/A'}</small></div></>) : (<><AlertCircle size={20} /><div><strong>Not Assigned</strong><p>This trainee is available for project assignment</p></div></>)}</div>{selectedTrainee.isMapped ? (<button className="btn-danger" onClick={() => handleUnmapFromProject(selectedTrainee)} disabled={loading}><X size={18} /> Unmap</button>) : (<div className="available-for-mapping"><p>Available for mapping</p></div>)}</div></div>
                  <div className="profile-header"><div className="profile-avatar">{selectedTrainee.name.charAt(0)}</div><div className="profile-info"><h3>{userInfo.name || selectedTrainee.name}</h3><div className="profile-role">TRAINEE</div><div className="profile-meta"><span className="profile-meta-item"><MapPin size={16} /> {userInfo.location || selectedTrainee.location}</span><span className="profile-meta-item"><Mail size={16} /> {selectedTrainee.email}</span><span className="profile-meta-item"><Target size={16} /> DPI: {traineeData.dpi || 'N/A'}</span><span className="profile-meta-item"><BarChart2 size={16} /> Score: {userInfo.averageScore || selectedTrainee.score}%</span></div></div></div>
                  <div className="trainee-details-grid"><div className="detail-item"><span className="detail-label">User ID</span><span className="detail-value">{userInfo.userId || 'N/A'}</span></div><div className="detail-item"><span className="detail-label">Employee ID</span><span className="detail-value">{userInfo.employeeId || 'N/A'}</span></div><div className="detail-item"><span className="detail-label">ISU</span><span className="detail-value">{userInfo.isu || 'N/A'}</span></div><div className="detail-item"><span className="detail-label">Batch</span><span className="detail-value">{traineeData.batch_name || 'N/A'}</span></div><div className="detail-item"><span className="detail-label">Batch Rank</span><span className="detail-value">{traineeData.batchRank || 'N/A'}</span></div><div className="detail-item"><span className="detail-label">Group Rank</span><span className="detail-value">{traineeData.groupRank || 'N/A'}</span></div><div className="detail-item"><span className="detail-label">Avg Score</span><span className="detail-value">{userInfo.averageScore || 0}%</span></div></div>
                  <div className="skills-section"><h4>Strengths</h4><div className="skills-list">{traineeData.strengths?.map((strength, index) => (<span key={index} className="skill-tag tech-tag">{strength.courseName} ({strength.avgScore}%)</span>)) || <span className="no-data">None</span>}</div><h4>Weaknesses</h4><div className="skills-list">{traineeData.weaknesses?.map((weakness, index) => (<span key={index} className="skill-tag soft-tag">{weakness.courseName} ({weakness.avgScore}%)</span>)) || <span className="no-data">None</span>}</div><h4>Certificates</h4><div className="skills-list">{traineeData.certificates ? <span className="skill-tag">{traineeData.certificates}</span> : <span className="no-data">None</span>}</div></div>
                </div>
                {!selectedTrainee.isMapped && (
                  <div className="projects-section"><div className="projects-header"><h3 className="section-title"><Briefcase size={18} /> Project Matches {traineeMatches && <span className="project-count">({traineeMatches.total_matches} matches)</span>}</h3></div>
                    {traineeMatches ? (
                      <>{traineeMatches.total_matches === 0 ? (<div className="no-matches open-pool-message"><Users2 size={48} /><h3>No Job Matches Found</h3><p>This trainee has no matches.</p><div className="open-pool-info"><p><strong>Open Pool</strong></p><button className="btn btn-primary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); setActiveTab('createJob'); }}><Plus size={18} /> Create New Job</button></div></div>) : (<>{traineeMatches.perfect_match?.length > 0 && (<div className="bucket-section bucket-perfect"><h3 className="bucket-title">Perfect Match ({traineeMatches.perfect_match.length})</h3><div className="projects-grid">{traineeMatches.perfect_match.map((match) => { const job = jobs.find(j => j.id === match.job_id); const isFull = job && getRemainingOpenings(job) <= 0; if (isFull) return null; return (<div key={match.match_id} className="project-match-card"><div className="match-card-header"><div className="project-title"><h4>{match.job_title}</h4><div className="project-meta"><span><Building size={14} /> Job ID: #{match.job_id}</span><span><MapPin size={14} /> {Array.isArray(match.job_location) ? match.job_location.join(', ') : match.job_location}</span></div></div><div className={`match-score ${match.total_percentage >= 80 ? 'high' : match.total_percentage >= 50 ? 'medium' : 'low'}`}><Target size={14} /> {match.total_percentage.toFixed(1)}%</div></div><div className="match-details"><span>Skills: {match.skills_percentage.toFixed(1)}%</span><span>Location: {match.location_percentage.toFixed(1)}%</span><span><Calendar size={14} /> Posted: {match.posted_date}</span></div><div className="project-actions"><button className="map-to-project-btn" onClick={() => { const job = jobs.find(j => j.id === match.job_id); if (job) { if (getRemainingOpenings(job) <= 0) { toast.error('No openings'); return; } handleMapToProject(selectedTrainee, job); } }} disabled={isFull}><Link size={16} /> {isFull ? 'Full' : 'Map'}</button></div></div>); })}</div></div>)}</>)}</>
                    ) : (<div className="no-matches-data"><Users size={48} /><h3>No match data</h3><p>Click to fetch matches.</p><button className="btn-primary" onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}><Search size={18} /> Find Matches</button></div>)}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer"><button className="btn-secondary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>Close</button>{!selectedTrainee.isMapped && !traineeMatches && !traineeMatchesLoading && (<button className="btn-primary" onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}><Search size={18} /> Find Matches</button>)}</div>
        </div>
      </div>
    );
  };

  const renderInterviewLocks = () => (
    <div className="interview-locks">
      <div className="section-header"><div className="header-title"><h2><Lock size={24} /> Interview Locks</h2><p className="subtitle">Track and manage locked candidates</p></div><div className="header-actions"><button className="btn btn-secondary" onClick={() => requestDownload('lock-report', {})}><Download size={18} /> All Locks</button><button className="btn btn-success" onClick={() => requestDownload('lock-report', { status: 'selected' })}><CheckCircle size={18} /> Selected</button><button className="btn btn-danger" onClick={() => requestDownload('lock-report', { status: 'rejected' })}><XCircle size={18} /> Rejected</button></div></div>
      {lockStats && (<div className="stats-grid small"><div className="stat-card"><div className="stat-icon"><Lock size={20} /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.total_locked}</div></div></div><div className="stat-card"><div className="stat-icon"><CheckCircle size={20} /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.total_selected}</div></div></div><div className="stat-card"><div className="stat-icon"><XCircle size={20} /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.total_rejected}</div></div></div></div>)}
      <div className="search-filter"><div className="filter-group"><select className="filter-select" value={lockFilter.status} onChange={(e) => setLockFilter({ ...lockFilter, status: e.target.value })}><option value="">All Status</option><option value="locked">Locked</option><option value="selected">Selected</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select><select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}><option value="">All Jobs</option>{jobs.map(job => <option key={job.id} value={job.id}>{job.project_name}</option>)}</select><button className="btn-icon" onClick={() => setLockFilter({ status: '', job: '' })}><X size={18} /></button></div></div>
      {loading ? <div className="loading-overlay"><div className="loading-spinner"></div></div> : (<div className="table-container"><table className="data-table"><thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Date/Time</th><th>Status</th><th>Comments</th><th>Locked By</th><th>Actions</th></tr></thead><tbody>{interviewLocks.map(lock => (<tr key={lock.id}><td><span className="font-medium">{lock.trainee_name}</span></td><td>{lock.job_title}</td><td>{lock.assigned_to_name || '-'}</td><td>{new Date(lock.interview_datetime).toLocaleString()}</td><td><span className={`status-badge status-${lock.status}`}>{lock.status}</span></td><td>{lock.comments || '-'}</td><td>{lock.locked_by_name}</td><td><div className="action-buttons"><button className="btn-icon btn-icon-view" onClick={() => { const trainee = allTrainees.find(t => t.id === lock.trainee); if (trainee) handleViewTraineeProfile(trainee); }}><Eye size={16} /></button><button className="btn-icon btn-warning" onClick={() => handleUnlockInterview(lock)} title="Unlock candidate"><RefreshCw size={16} /></button></div></td></tr>))}{interviewLocks.length === 0 && (<tr><td colSpan="8" className="no-data">No locks found</td></tr>)}</tbody></table></div>)}
      <div className="flex-end margin-top-1"><button className="btn btn-secondary" onClick={() => requestDownload('interview-filtered')} disabled={interviewLocks.length === 0}><Download size={18} /> Download Filtered</button></div>
    </div>
  );

  const renderSelected = () => (
    <div className="selected-tab">
      <div className="section-header">
        <div className="header-title">
          <h2><CheckCircle size={24} /> Selected Candidates</h2>
          <p className="subtitle">Successfully placed talent - Click X to cancel and make available again</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}>
            <option value="">All Jobs</option>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.project_name}</option>)}
          </select>
          <button className="btn btn-success" onClick={() => requestDownload('selected')}><Download size={18} /> Download All</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Trainee</th>
              <th>Project</th>
              <th>Source</th>
              <th>Interviewer</th>
              <th>Interview Date</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedCandidates.map((c, idx) => (
              <tr key={c.trainee_id || idx}>
                <td>{c.trainee_name}</td>
                <td>{c.job_title || c.projectName}</td>
                <td><span className={`source-badge source-${c.source === 'Interview' ? 'interview' : 'direct'}`}>{c.source}</span></td>
                <td>{c.assigned_to_name || (c.source === 'Direct' ? 'HR Direct' : '-')}</td>
                <td>{c.interview_datetime ? new Date(c.interview_datetime).toLocaleString() : '-'}</td>
                <td>
                  {c.feedback ? (
                    <button className="btn-icon" onClick={() => setViewingFeedback(c.feedback)}><Eye size={16} /></button>
                  ) : '-'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-icon-view" onClick={() => {
                      const trainee = findTraineeByUserId(c.trainee_id);
                      if (trainee) handleViewTraineeProfile(trainee);
                    }} title="View Profile">
                      <User size={16} />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => {
                        if (c.lock_id) {
                          handleCancelSelected(c.lock_id);
                        } else if (c.source === 'Direct') {
                          const trainee = findTraineeByUserId(c.trainee_id);
                          if (trainee && trainee.isMapped) {
                            handleUnmapFromProject(trainee);
                          }
                        }
                      }}
                      title="Cancel Selection (Make available for other projects)"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {selectedCandidates.length === 0 && (
              <tr><td colSpan="7" className="no-data">No selected candidates</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRejected = () => (
    <div className="rejected-tab">
      <div className="section-header">
        <div className="header-title">
          <h2><XCircle size={24} /> Rejected Candidates</h2>
          <p className="subtitle">Candidates who did not meet requirements - Click X to cancel and make available again</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}>
            <option value="">All Jobs</option>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.project_name}</option>)}
          </select>
          <button className="btn btn-danger" onClick={() => requestDownload('rejected')}><Download size={18} /> Download All</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Trainee</th>
              <th>Job</th>
              <th>Interviewer</th>
              <th>Interview Date</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rejectedLocks.map(lock => (
              <tr key={lock.id}>
                <td>{lock.trainee_name}</td>
                <td>{lock.job_title}</td>
                <td>{lock.assigned_to_name || '-'}</td>
                <td>{new Date(lock.interview_datetime).toLocaleString()}</td>
                <td>
                  {lock.feedback ? (
                    <button className="btn-icon" onClick={() => setViewingFeedback(lock.feedback)}><Eye size={16} /></button>
                  ) : '-'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-icon-view" onClick={() => {
                      const trainee = allTrainees.find(t => t.id === lock.trainee);
                      if (trainee) handleViewTraineeProfile(trainee);
                    }} title="View Profile">
                      <User size={16} />
                    </button>
                    <button
                      className="btn-icon btn-warning"
                      onClick={() => handleCancelSelected(lock.id)}
                      title="Cancel Rejection (Make candidate available again)"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rejectedLocks.length === 0 && (
              <tr><td colSpan="6" className="no-data">No rejected candidates</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFeedbackList = () => (
    <div className="feedback-tab">
      <div className="section-header">
        <div className="header-title"><h2><MessageSquare size={24} /> Interview Feedback</h2><p className="subtitle">Search, filter and export submitted interview feedback</p></div>
        <div className="header-actions">
          <input className="form-control" value={feedbackSearch} onChange={(e) => setFeedbackSearch(e.target.value)} placeholder="Search feedback" />
          <button className="btn btn-secondary" onClick={fetchFeedbackRecords}><Search size={18} /> Search</button>
          <button className="btn btn-secondary" onClick={() => requestDownload('feedback')} disabled={feedbackRecords.length === 0}><Download size={18} /> Download Feedback</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Interviewer</th><th>Candidate</th><th>Rating</th><th>Feedback</th><th>Recommendation</th><th>Interview Date</th></tr></thead>
          <tbody>
            {feedbackRecords.map(fb => (
              <tr key={fb.id}>
                <td>{fb.interviewer_name || '-'}</td>
                <td>{fb.trainee_name || '-'}</td>
                <td>{fb.attitude_rating}/5</td>
                <td>{fb.overall_comments || fb.behaviour_notes || '-'}</td>
                <td><span className={`status-badge status-${fb.recommendation}`}>{fb.recommendation}</span></td>
                <td>{fb.interview_date ? new Date(fb.interview_date).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {feedbackRecords.length === 0 && <tr><td colSpan="6" className="no-data">No feedback found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuditTrail = () => (
    <div className="audit-tab">
      <div className="section-header">
        <div className="header-title"><h2><Shield size={24} /> Audit Trail</h2><p className="subtitle">Important system actions and value changes</p></div>
        <div className="header-actions"><button className="btn btn-secondary" onClick={fetchAuditLogs}><RefreshCw size={18} /> Refresh</button></div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead>
          <tbody>
            {auditLogs.map(log => <tr key={log.id}><td>{log.user_name || '-'}</td><td>{log.action}</td><td>{log.entity_type} #{log.entity_id}</td><td>{new Date(log.timestamp).toLocaleString()}</td></tr>)}
            {auditLogs.length === 0 && <tr><td colSpan="4" className="no-data">No audit logs found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFeedbackModal = () => {
    if (!viewingFeedback) return null;
    const fb = viewingFeedback;
    return (
      <div className="modal-overlay" onClick={() => setViewingFeedback(null)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title"><MessageSquare size={20} /><h2>Interview Feedback</h2></div><button className="modal-close" onClick={() => setViewingFeedback(null)}><X /></button></div>
          <div className="modal-body"><p><strong>Interviewer:</strong> {fb.interviewer_name}</p><p><strong>Date:</strong> {new Date(fb.feedback_date).toLocaleString()}</p><p><strong>Questions:</strong> {fb.questions_asked} asked, {fb.questions_answered} answered</p><p><strong>Attitude Rating:</strong> {fb.attitude_rating}/5</p>{fb.behaviour_notes && <p><strong>Behaviour Notes:</strong> {fb.behaviour_notes}</p>}{fb.technical_skills_assessed?.length > 0 && (<div><strong>Skills Assessed:</strong> {fb.technical_skills_assessed.join(', ')}</div>)}{fb.strengths && <p><strong>Strengths:</strong> {fb.strengths}</p>}{fb.weaknesses && <p><strong>Weaknesses:</strong> {fb.weaknesses}</p>}{fb.upskill_needed && <p><strong>Upskilling Needed:</strong> {fb.upskill_needed}</p>}{fb.overall_comments && <p><strong>Overall Comments:</strong> {fb.overall_comments}</p>}<p><strong>Recommendation:</strong> {fb.recommendation === 'selected' ? '✅ Selected' : '❌ Rejected'}</p></div>
          <div className="modal-actions"><button className="btn-secondary" onClick={() => setViewingFeedback(null)}>Close</button></div>
        </div>
      </div>
    );
  };

  const renderLockInterviewModal = () => {
    if (!showLockModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowLockModal(false)}>
        <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3><Lock size={20} /> Lock for Interview</h3><button className="modal-close" onClick={() => setShowLockModal(false)}><X /></button></div>
          <div className="modal-body"><div className="form-group"><label>Interview Date & Time *</label><input type="datetime-local" className="form-control" value={lockInterviewDatetime} onChange={(e) => setLockInterviewDatetime(e.target.value)} min={new Date().toISOString().slice(0, 16)} required /></div><div className="form-group"><label>Assign to Interviewer *</label><select className="form-control" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} required><option value="">Select Interviewer</option>{interviewers.map(usr => <option key={usr.id} value={usr.id}>{usr.username}</option>)}</select></div><div className="form-group"><label>Comments (optional)</label><textarea className="form-control" rows="3" value={lockComments} onChange={(e) => setLockComments(e.target.value)} placeholder="Add notes..." /></div><p>Selected trainees: {selectedTraineeIds.length}</p></div>
          <div className="modal-actions"><button className="btn-secondary" onClick={() => setShowLockModal(false)}>Cancel</button><button className="btn-primary" onClick={handleLockForInterview} disabled={!lockInterviewDatetime || !assignedToId || loading}>{loading ? 'Locking...' : 'Lock for Interview'}</button></div>
        </div>
      </div>
    );
  };

  const renderTalentSearch = () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = findTraineeByUserId(getMatchTraineeUserId(m));
      return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch?.id?.toString());
    });
    const jobHasOpenings = selectedJobForSearch && getRemainingOpenings(selectedJobForSearch) > 0;

    return (
      <div className="talent-search">
        <div className="section-header">
          <div className="header-title"><h2><Users size={24} /> Talent Search</h2><p className="subtitle">Discover best-fit candidates for your job profiles</p></div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading} title="Refresh"><RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh</button>
            <button className="btn btn-secondary" onClick={backupData} disabled={backupInProgress} title="Backup Data"><Database size={18} /> {backupInProgress ? 'Backing up...' : 'Backup'}</button>
            <div className="auto-refresh-toggle"><label><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh (30s)</label></div>
          </div>
        </div>
        <div className="search-job-selector"><label>Select Job:</label><select className="form-control" value={selectedJobForSearch?.id || ''} onChange={(e) => handleJobSelectForSearch(e.target.value)} style={{ maxWidth: '400px' }}><option value="">-- Choose a job --</option>{jobs.filter(job => job.status === 'active' && getRemainingOpenings(job) > 0).map(job => (<option key={job.id} value={job.id}>{job.project_name} (Openings: {getRemainingOpenings(job)})</option>))}</select></div>
        {selectedJobForSearch && (<><div className="filters-panel"><div className="filter-group"><label>Bucket</label><select className="filter-select" value={searchFilters.bucket} onChange={(e) => setSearchFilters({ ...searchFilters, bucket: e.target.value })}><option value="">All Buckets</option><option value="PERFECT_MATCH">Perfect Match</option><option value="SKILLS_ONLY">Skills Only</option><option value="LOCATION_ONLY">Location Only</option><option value="NEARBY">Proximity</option><option value="NO_MATCH">No Match</option></select></div><div className="filter-group"><label>Location</label><input type="text" className="form-control" placeholder="Filter by location" value={searchFilters.location} onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })} /></div><div className="filter-group"><label>Min Total %</label><input type="number" className="form-control" min="0" max="100" value={searchFilters.minTotal} onChange={(e) => setSearchFilters({ ...searchFilters, minTotal: parseInt(e.target.value) || 0 })} /></div><div className="filter-group"><label>Skill Keyword</label><input type="text" className="form-control" placeholder="e.g., React" value={searchFilters.skillKeyword} onChange={(e) => setSearchFilters({ ...searchFilters, skillKeyword: e.target.value })} /></div><div className="filter-group align-end"><button className="btn btn-secondary btn-clear-filter" onClick={() => setSearchFilters({ bucket: '', location: '', minTotal: 0, skillKeyword: '' })}><X size={18} /> Clear</button></div></div><div className="table-actions"><div><input type="checkbox" checked={selectAll && filtered.length > 0 && filtered.every(m => selectedSearchTraineeIds.includes(getMatchTraineeUserId(m)))} onChange={handleSelectAllSearch} disabled={!jobHasOpenings} /> Select All ({filtered.length} matches){!jobHasOpenings && <span className="warning-text">(No openings left)</span>}</div><div className="action-buttons"><button className="btn btn-primary" onClick={() => { setSelectedTraineeIds(selectedSearchTraineeIds); setSelectedJob(selectedJobForSearch); fetchInterviewers(); setShowLockModal(true); }} disabled={selectedSearchTraineeIds.length === 0 || !jobHasOpenings}><Lock size={18} /> Lock Selected ({selectedSearchTraineeIds.length})</button><button className="btn btn-secondary" onClick={() => requestDownload('search')} disabled={filtered.length === 0}><Download size={18} /> Download Filtered</button></div></div>{jobMatchesLoading ? (<div className="loading-overlay"><div className="loading-spinner"></div></div>) : (<div className="table-container"><table className="data-table"><thead><tr><th>Select</th><th>Trainee Name</th><th>Location</th><th>Bucket</th><th>Matched Location</th><th>Skills %</th><th>Location %</th><th>Total %</th><th>Matched Skills</th><th>Actions</th></tr></thead><tbody>{filtered.map((match) => { const disabled = !jobHasOpenings; const traineeUserId = getMatchTraineeUserId(match); return (<tr key={traineeUserId || match.id}><td><input type="checkbox" checked={selectedSearchTraineeIds.includes(traineeUserId)} onChange={(e) => { if (e.target.checked) { setSelectedSearchTraineeIds([...selectedSearchTraineeIds, traineeUserId]); } else { setSelectedSearchTraineeIds(selectedSearchTraineeIds.filter(pid => pid !== traineeUserId)); setSelectAll(false); } }} disabled={disabled || !traineeUserId} /></td><td><span className="font-medium">{match.trainee_name}</span></td><td>{match.trainee_location}</td><td><span className={`bucket-tag ${match.bucket?.toLowerCase()}`}>{match.bucket === 'NEARBY' ? 'Proximity' : match.bucket?.replace('_', ' ')}</span></td><td>{match.matched_location || '—'}</td><td>{Number(match.skills_percentage || 0).toFixed(1)}%</td><td>{Number(match.location_percentage || 0).toFixed(1)}%</td><td><strong>{Number(match.total_percentage || 0).toFixed(1)}%</strong></td><td>{(() => { const skills = normalizeMatchedSkills(match.matched_skills); return skills.length > 0 ? skills.join(', ') : '-'; })()}</td><td><div className="action-buttons"><button className="btn-icon btn-icon-view" onClick={() => handleViewTraineeProfileFromJob(match)} title="View Profile"><User size={16} /></button><button className="btn-icon btn-icon-map" onClick={() => { if (!jobHasOpenings) { toast.error('No openings left'); return; } handleMapToProject(match, selectedJobForSearch); }} disabled={!jobHasOpenings || !traineeUserId} title="Map to Project"><Link size={16} /></button></div></td></tr>); })}{filtered.length === 0 && (<tr><td colSpan="10" className="no-data">No matches match your filters</td></tr>)}</tbody></table></div>)}</>)}
      </div>
    );
  };

  const renderPrivacyModal = () => {
    if (!showPrivacyModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
        <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Shield size={20} /> Data Privacy & Download</h3>
            <button className="modal-close" onClick={() => setShowPrivacyModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="privacy-notice">
              <p>By downloading this file, you agree to comply with the company's data privacy policy. The information contained is confidential and intended solely for authorised personnel. Unauthorised distribution or misuse may result in disciplinary action.</p>
              <p className="mt-2"><strong>Note:</strong> The file will be downloaded as a password‑protected Excel file. You will need the password to open it.</p>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="privacyAgree" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
              <label htmlFor="privacyAgree">I have read and agree to the data privacy policy</label>
            </div>
            <div className="form-group">
              <label>Download Password</label>
              <input type="password" className="form-control" value={downloadPassword} onChange={(e) => setDownloadPassword(e.target.value)} placeholder="Enter password (Tcs#12345)" />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowPrivacyModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={executeDownload}>Download</button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateInterviewerModal = () => {
    if (!showCreateInterviewerModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowCreateInterviewerModal(false)}>
        <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3><User size={20} /> Create Interviewer</h3>
            <button className="modal-close" onClick={() => setShowCreateInterviewerModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" value={newInterviewer.username} onChange={(e) => setNewInterviewer({ ...newInterviewer, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={newInterviewer.email} onChange={(e) => setNewInterviewer({ ...newInterviewer, email: e.target.value })} placeholder="must end with @tcs.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="text" className="form-control" value={newInterviewer.password} onChange={(e) => setNewInterviewer({ ...newInterviewer, password: e.target.value })} required />
              <small className="helper-text">Default: Tcs#12345</small>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Access Start</label>
                <input type="datetime-local" className="form-control" value={newInterviewer.access_start} onChange={(e) => setNewInterviewer({ ...newInterviewer, access_start: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Access End</label>
                <input type="datetime-local" className="form-control" value={newInterviewer.access_end} onChange={(e) => setNewInterviewer({ ...newInterviewer, access_end: e.target.value })} required />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowCreateInterviewerModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateInterviewer}>Create Account</button>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkInterviewerModal = () => {
    if (!showBulkInterviewerModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowBulkInterviewerModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><Users2 size={24} /><h2>Bulk Create Interviewers</h2></div>
            <button className="modal-close" onClick={() => setShowBulkInterviewerModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="upload-instructions">
              <p>Upload CSV or Excel with columns: Name, Email, Employee ID, Skills, Department, Designation.</p>
            </div>
            <div className="form-group"><input type="file" accept=".xlsx,.xls,.csv" onChange={e => setBulkInterviewerFile(e.target.files[0])} /></div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowBulkInterviewerModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBulkInterviewerUpload} disabled={!bulkInterviewerFile || loading}><Upload size={16} /> Upload</button>
          </div>
        </div>
      </div>
    );
  };

  const renderExcelTemplateModal = () => {
    if (!showExcelTemplate) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowExcelTemplate(false)}>
        <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><FileSpreadsheet size={24} /><h2>Excel Upload</h2></div>
            <button className="modal-close" onClick={() => setShowExcelTemplate(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="upload-instructions">
              <p>1. Download the Excel template below.</p>
              <p>2. Fill in the job details following the format.</p>
              <p>3. Upload the completed file to import multiple jobs.</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDownloadExcelTemplate} disabled={loading}><Download size={18} /> Download Template</button>
            <button className="btn btn-success" onClick={() => { document.getElementById('excelUpload').click(); setShowExcelTemplate(false); }} disabled={loading}><Upload size={18} /> Select & Upload Excel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderWordTemplateModal = () => {
    if (!showWordTemplate) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowWordTemplate(false)}>
        <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><File size={24} /><h2>Word Upload</h2></div>
            <button className="modal-close" onClick={() => setShowWordTemplate(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="upload-instructions">
              <p>1. Download the Word template below.</p>
              <p>2. Fill in the job description and requirements.</p>
              <p>3. Upload the document to create a job profile.</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDownloadWordTemplate} disabled={loading}><Download size={18} /> Download Template</button>
            <button className="btn btn-primary" onClick={() => { document.getElementById('wordUpload').click(); setShowWordTemplate(false); }} disabled={loading}><Upload size={18} /> Select & Upload Word</button>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkLockModal = () => {
    if (!showBulkLockModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowBulkLockModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title"><Lock size={24} /><h2>Bulk Interview Lock</h2></div><button className="modal-close" onClick={() => setShowBulkLockModal(false)}><X size={24} /></button></div>
          <div className="modal-body"><div className="upload-instructions"><p>Upload an Excel file with columns: Trainee Email/EmpID, Interviewer Email/EmpID, Job ID, Interview DateTime, Comments.</p></div><div className="form-group"><button className="btn btn-secondary" onClick={downloadInterviewLockTemplate}><Download size={16} /> Download Template</button></div><div className="form-group"><input type="file" accept=".xlsx,.xls" onChange={e => setBulkLockFile(e.target.files[0])} /></div></div>
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowBulkLockModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleBulkLockUpload} disabled={!bulkLockFile || loading}><Upload size={16} /> Upload and Lock</button></div>
        </div>
      </div>
    );
  };

  const renderBulkStatusModal = () => {
    if (!showBulkStatusModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowBulkStatusModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title"><CheckCircle size={24} /><h2>Bulk Status Update</h2></div><button className="modal-close" onClick={() => setShowBulkStatusModal(false)}><X size={24} /></button></div>
          <div className="modal-body"><div className="upload-instructions"><p>Upload an Excel file with columns: Trainee Email/EmpID, Job ID, Status (selected/rejected).</p></div><div className="form-group"><button className="btn btn-secondary" onClick={downloadStatusUpdateTemplate}><Download size={16} /> Download Template</button></div><div className="form-group"><input type="file" accept=".xlsx,.xls" onChange={e => setBulkStatusFile(e.target.files[0])} /></div></div>
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowBulkStatusModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleBulkStatusUpload} disabled={!bulkStatusFile || loading}><Upload size={16} /> Upload and Update</button></div>
        </div>
      </div>
    );
  };

  const renderBulkMappingModal = () => {
    if (!showBulkMappingModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowBulkMappingModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title"><Link size={24} /><h2>Bulk Mapping</h2></div><button className="modal-close" onClick={() => setShowBulkMappingModal(false)}><X size={24} /></button></div>
          <div className="modal-body"><div className="upload-instructions"><p>Upload an Excel file with columns: Trainee Email/EmpID, Job ID.</p></div><div className="form-group"><button className="btn btn-secondary" onClick={downloadBulkMappingTemplate}><Download size={16} /> Download Template</button></div><div className="form-group"><input type="file" accept=".xlsx,.xls" onChange={e => setBulkMappingFile(e.target.files[0])} /></div></div>
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowBulkMappingModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleBulkMappingUpload} disabled={!bulkMappingFile || loading}><Upload size={16} /> Upload and Map</button></div>
        </div>
      </div>
    );
  };


  const handlePrefLocUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/upload-preferred-locations/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.updated > 0) {
        toast.success(`Updated ${res.data.updated} trainees`);
      }
      if (res.data.errors?.length > 0) {
        if (res.data.errors.length === 1) {
          toast.warning(res.data.errors[0]);
        } else {
          setErrorDetails(res.data.errors.map((err, idx) => ({
            row: idx + 2,
            message: err
          })));
          setShowErrorDetailsModal(true);
        }
      }
      setShowPrefLocModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const downloadPrefLocTemplate = () => {
    // Create a simple Excel template using XlsxPopulate (you already have it imported)
    XlsxPopulate.fromBlankAsync().then(workbook => {
      const sheet = workbook.sheet(0);
      sheet.name("Preferred Locations");

      // Headers
      sheet.cell(1, 1).value("Employee ID");
      sheet.cell(1, 2).value("Preferred Location 1");
      sheet.cell(1, 3).value("Preferred Location 2");
      sheet.cell(1, 4).value("Preferred Location 3");

      // Style headers
      const headerRange = sheet.range(1, 1, 1, 4);
      headerRange.style('bold', true);
      headerRange.style('fill', '2563eb');
      headerRange.style('fontColor', 'ffffff');

      // Sample data
      sheet.cell(2, 1).value("EMP001");
      sheet.cell(2, 2).value("Bangalore");
      sheet.cell(2, 3).value("Chennai");
      sheet.cell(2, 4).value("Hyderabad");

      sheet.cell(3, 1).value("EMP002");
      sheet.cell(3, 2).value("Mumbai");
      sheet.cell(3, 3).value("");
      sheet.cell(3, 4).value("");

      // Set column widths
      sheet.column(1).width(15);
      sheet.column(2).width(20);
      sheet.column(3).width(20);
      sheet.column(4).width(20);

      return workbook.outputAsync();
    }).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'preferred_locations_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    }).catch(() => {
      toast.error('Download failed');
    });
  };

  const renderPrefLocModal = () => {
    if (!showPrefLocModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowPrefLocModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <MapPin size={24} />
              <h2>Upload Preferred Locations</h2>
            </div>
            <button className="modal-close" onClick={() => setShowPrefLocModal(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <div className="upload-instructions">
              <p>1. Download the template below.</p>
              <p>2. Fill in Employee ID and up to 3 preferred locations per trainee.</p>
              <p>3. Leave location cells empty if not applicable.</p>
              <p>4. Upload the completed file to update trainee preferences.</p>
              <p style={{ marginTop: '0.75rem', color: '#f59e0b' }}>
                ⚠ Trainees must already exist in the system. This only updates their location preferences.
              </p>
            </div>

            <div className="template-info" style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>Template Columns:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <strong>Employee ID:</strong> <span>Required - Must match existing trainee</span>
                <strong>Preferred Location 1:</strong> <span>Optional - First choice city</span>
                <strong>Preferred Location 2:</strong> <span>Optional - Second choice city</span>
                <strong>Preferred Location 3:</strong> <span>Optional - Third choice city</span>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={downloadPrefLocTemplate}
              disabled={loading}
            >
              <Download size={18} /> Download Template
            </button>
            <label
              className="btn btn-success"
              style={{ cursor: 'pointer' }}
            >
              <Upload size={18} /> Select & Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handlePrefLocUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };
  const renderErrorDetailsModal = () => {
    if (!showErrorDetailsModal || !errorDetails) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowErrorDetailsModal(false)}>
        <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <AlertCircle size={24} color="#ef4444" />
              <h2>Bulk Operation Errors</h2>
            </div>
            <button className="modal-close" onClick={() => setShowErrorDetailsModal(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <div className="error-summary">
              <p><strong>Total Errors:</strong> {errorDetails.length}</p>
            </div>
            <div className="error-list">
              {errorDetails.map((error, idx) => (
                <div key={idx} className="error-item">
                  <div className="error-header">
                    <XCircle size={16} color="#ef4444" />
                    <strong>Row {error.row}:</strong>
                    <span>{error.trainee || error.trainee_id}</span>
                  </div>
                  <div className="error-message">{error.message}</div>
                  {error.current_project && (
                    <div className="error-detail">
                      Currently mapped to: {error.current_project}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => setShowErrorDetailsModal(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHiddenFileInputs = () => (
    <>
      <input type="file" id="excelUpload" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelUpload} />
      <input type="file" id="wordUpload" accept=".doc,.docx" style={{ display: 'none' }} onChange={handleWordUpload} />
      <input type="file" id="prefLocUpload" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handlePrefLocUpload} />
    </>
  );



  const handleExcelUpload = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try { setLoading(true); await jobAPI.uploadExcel(file); await fetchJobs(); toast.success('Excel uploaded'); }
    catch { toast.error('Upload failed'); } finally { setLoading(false); event.target.value = ''; }
  };

  const handleWordUpload = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try { setLoading(true); await jobAPI.uploadWord(file); await fetchJobs(); toast.success('Word uploaded'); }
    catch { toast.error('Upload failed'); } finally { setLoading(false); event.target.value = ''; }
  };

  const handleDownloadExcelTemplate = async () => {
    try { setLoading(true); const blob = await jobAPI.downloadExcelTemplate(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'job_template.xlsx'; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); toast.success('Template downloaded'); }
    catch { toast.error('Download failed'); } finally { setLoading(false); }
  };

  const handleDownloadWordTemplate = async () => {
    try { setLoading(true); const blob = await jobAPI.downloadWordTemplate(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'job_template.docx'; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); toast.success('Template downloaded'); }
    catch { toast.error('Download failed'); } finally { setLoading(false); }
  };

  const downloadHRSummaryPDF = async () => {
    try {
      const response = await api.get(`/reports/hr-summary-pdf/${getBatchParam()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr_summary_${selectedBatch || 'all'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF report downloaded');
    } catch (err) {
      toast.error('Failed to download PDF report');
    }
  };
  const renderJobManagement = () => {
    // Add notify button in actions column
    return (
      <div className="job-management">
        {/* ... header same as original but with extra "Notify" button in actions ... */}
        <div className="section-header">
          <div className="header-title">
            <h2><Briefcase size={24} /> Job Profiles</h2>
            <p className="subtitle">Manage all job positions and bulk operations</p>
          </div>
          <div className="header-actions">
            {/* ... existing buttons ... */}
            <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading} title="Refresh">
              <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={backupData} disabled={backupInProgress} title="Backup Data">
              <Database size={18} /> {backupInProgress ? 'Backing up...' : 'Backup'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreateInterviewerModal(true)} disabled={loading}>
              <User size={18} /> Create Interviewer
            </button>
            <button className="btn btn-secondary" onClick={() => setShowBulkInterviewerModal(true)} disabled={loading}>
              <Upload size={18} /> Bulk Interviewers
            </button>
            <div className="upload-buttons">
              <button className="btn btn-success" onClick={() => setShowExcelTemplate(true)} disabled={loading}>
                <FileSpreadsheet size={18} /> Import Excel
              </button>
              <button className="btn btn-primary" onClick={() => setShowWordTemplate(true)} disabled={loading}>
                <File size={18} /> Import Word
              </button>

              <button
                className="btn btn-warning"
                onClick={() => setShowPrefLocModal(true)}
                disabled={loading}
                title="Upload Preferred Locations"
              >
                <MapPinOff size={18} /> Upload Locations
              </button>
            </div>
            <button className="btn btn-primary btn-cta" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('createJob'); }} disabled={loading}>
              <Plus size={18} /> Create New Job
            </button>
            <div className="dropdown" style={{ position: 'relative' }}>
              <button className="btn btn-secondary dropdown-toggle" onClick={() => setBulkOpsOpen(!bulkOpsOpen)}>
                <UploadCloud size={18} /> Bulk Ops <ChevronDown size={16} />
              </button>
              {bulkOpsOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setShowBulkLockModal(true); setBulkOpsOpen(false); }}><Lock size={14} /> Bulk Interview Lock</button>
                  <button className="dropdown-item" onClick={() => { setShowBulkStatusModal(true); setBulkOpsOpen(false); }}><CheckCircle size={14} /> Bulk Status Update</button>
                  <button className="dropdown-item" onClick={() => { setShowBulkMappingModal(true); setBulkOpsOpen(false); }}><Link size={14} /> Bulk Mapping</button>
                  <button className="dropdown-item" onClick={() => downloadHRSummaryPDF()}><Download size={14} /> Download PDF Report</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading jobs...</p></div>}
        {error && <div className="error-message"><AlertCircle size={20} /><span>{error}</span></div>}
        {jobs.length === 0 && !loading && !error && (
          <div className="no-data"><Briefcase size={48} /><h3>No Jobs Found</h3><p>Create your first job profile or upload via Excel/Word</p></div>
        )}
        {jobs.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Job Title</th><th>Department</th><th>Location(s)</th><th>Batch</th><th>Openings</th><th>Filled</th><th>Remaining</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const remaining = Math.max(0, job.openings - job.filled);
                  return (
                    <tr key={job.id}>
                      <td><div className="job-title-cell"><div className="job-icon"><BriefcaseBusiness size={16} /></div><span className="font-medium">{job.project_name}</span></div></td>
                      <td><div className="department-cell"><Building size={14} />{job.department}</div></td>
                      <td><div className="location-cell"><MapPin size={14} />{Array.isArray(job.location) ? job.location.join(', ') : job.location}</div></td>
                      <td>{job.batch_name || '-'}</td>
                      <td className="openings-cell">{job.openings}</td>
                      <td className={`filled-cell ${job.filled === job.openings ? 'filled-complete' : ''}`}>{job.filled}</td>
                      <td className="remaining-cell">{remaining}</td>
                      <td><button className={`status-button ${job.status === 'active' ? 'status-active' : 'status-inactive'}`} onClick={() => toggleJobStatus(job.id)} disabled={loading}>{job.status === 'active' ? <><CheckCircle size={12} /> Active</> : <><X size={12} /> Inactive</>}</button></td>
                      <td><div className="action-buttons"><button className="btn-icon btn-icon-view" onClick={() => handleViewJobDetails(job)} disabled={loading} title="View Details"><Eye size={16} /></button><button className="btn-icon btn-icon-edit" onClick={() => { setSelectedJob(job); setIsEditMode(true); setActiveTab('createJob'); setTechSkills(job.techSkills || []); setSoftSkills(job.softSkills || []); }} disabled={loading} title="Edit"><Edit size={16} /></button><button className="btn-icon btn-icon-delete" onClick={() => handleDeleteJob(job.id)} disabled={loading} title="Delete"><Trash2 size={16} /></button><button className="btn-icon btn-icon-match" onClick={() => runMatchingEngine(job.id)} disabled={loading} title="Generate Matches"><Sparkles size={16} /></button><button className="btn-icon btn-icon-notify" onClick={() => handleNotify(job.id)} disabled={loading} title="Notify Course Owner"><Megaphone size={16} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderCreateJob = () => {
    const jobToEdit = selectedJob || newJob;
    const isEditing = !!selectedJob && isEditMode;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isEditing) {
        await handleUpdateJob(jobToEdit);
      } else {
        await handleCreateJob();
      }
    };

    return (
      <div className="create-job">
        <div className="section-header">
          <div className="header-title">
            <h2>{isEditing ? <><Edit size={24} /> Edit Job Profile</> : <><Plus size={24} /> Create New Job Profile</>}</h2>
            <p className="subtitle">{isEditing ? 'Update existing job details' : 'Fill in the details to create a new job position'}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('jobs'); setNewJob({ project_name: '', location: '', demand_id: '', skills: '', openings: 1, bg: '', isu_hsu: '', stream: '', role: '', spoc_name: '', spoc_emp_id: '', rmg_head: '', course: '' }); }} disabled={loading}><ArrowLeft size={18} /> Back to Jobs</button>
        </div>
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>{isEditing ? 'Updating...' : 'Creating...'}</p></div>}
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="form-section-title"><Briefcase size={20} /> Basic Information</h3>
              <div className="form-row">
                <div className="form-group"><label><span className="required">*</span> Project Name</label><input type="text" className="form-control" value={jobToEdit.project_name} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, project_name: e.target.value }) : setNewJob({ ...newJob, project_name: e.target.value })} required placeholder="e.g., Project Alpha" disabled={loading} /></div>
                <div className="form-group"><label><span className="required">*</span> Location</label><input type="text" className="form-control" value={jobToEdit.location} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, location: e.target.value }) : setNewJob({ ...newJob, location: e.target.value })} required placeholder="e.g., Bangalore, Mumbai" disabled={loading} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label><span className="required">*</span> Demand ID</label><input type="text" className="form-control" value={jobToEdit.demand_id || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, demand_id: e.target.value }) : setNewJob({ ...newJob, demand_id: e.target.value })} required placeholder="Demand ID" disabled={loading} /></div>
                <div className="form-group"><label>BG</label><input type="text" className="form-control" value={jobToEdit.bg || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, bg: e.target.value }) : setNewJob({ ...newJob, bg: e.target.value })} placeholder="BG" disabled={loading} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>ISU/HSU</label><input type="text" className="form-control" value={jobToEdit.isu_hsu || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, isu_hsu: e.target.value }) : setNewJob({ ...newJob, isu_hsu: e.target.value })} placeholder="ISU/HSU" disabled={loading} /></div>
                <div className="form-group"><label>Stream</label><input type="text" className="form-control" value={jobToEdit.stream || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, stream: e.target.value }) : setNewJob({ ...newJob, stream: e.target.value })} placeholder="e.g., Java, Python" disabled={loading} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Role</label><input type="text" className="form-control" value={jobToEdit.role || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, role: e.target.value }) : setNewJob({ ...newJob, role: e.target.value })} placeholder="Developer, Tech Support" disabled={loading} /></div>
                <div className="form-group"><label>SPOC Name</label><input type="text" className="form-control" value={jobToEdit.spoc_name || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, spoc_name: e.target.value }) : setNewJob({ ...newJob, spoc_name: e.target.value })} placeholder="SPOC Name" disabled={loading} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>SPOC Emp ID</label><input type="text" className="form-control" value={jobToEdit.spoc_emp_id || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, spoc_emp_id: e.target.value }) : setNewJob({ ...newJob, spoc_emp_id: e.target.value })} placeholder="SPOC Emp ID" disabled={loading} /></div>
                <div className="form-group"><label>RMG Head</label><input type="text" className="form-control" value={jobToEdit.rmg_head || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, rmg_head: e.target.value }) : setNewJob({ ...newJob, rmg_head: e.target.value })} placeholder="RMG Head" disabled={loading} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Visibility</label><select className="form-control" value={jobToEdit.is_public ? 'public' : 'private'} onChange={(e) => { const val = e.target.value === 'public'; if (isEditing) setSelectedJob({ ...jobToEdit, is_public: val }); else setNewJob({ ...newJob, is_public: val }); }}><option value="public">Public</option><option value="private">Private</option></select></div>
                <div className="form-group">
                  <label>Course</label>
                  <select
                    className="form-control"
                    value={jobToEdit.course || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : '';
                      if (isEditing) setSelectedJob({ ...jobToEdit, course: val });
                      else setNewJob({ ...newJob, course: val });
                    }}
                  >
                    <option value="">-- Select Course --</option>
                    {coursesList.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group"><label><span className="required">*</span> Openings</label><input type="number" className="form-control" value={jobToEdit.openings} onChange={(e) => { const val = parseInt(e.target.value) || 1; if (isEditing) setSelectedJob({ ...jobToEdit, openings: val }); else setNewJob({ ...newJob, openings: val }); }} min="1" required disabled={loading} /></div>
            </div>
            <div className="form-section">
              <h3 className="form-section-title"><BookOpen size={20} /> Requirements & Skills</h3>
              <div className="form-group">
                <label><span className="required">*</span> Skills</label>
                <div className="skills-input">
                  <input type="text" className="form-control" placeholder="Type skill and press Enter or comma" onKeyDown={handleTechSkillAdd} disabled={loading} />
                  <div className="skills-tags">
                    {(isEditing ? (jobToEdit.skills || '').split(',').map(s => s.trim()).filter(s => s) : (newJob.skills || '').split(',').map(s => s.trim()).filter(s => s)).map((skill, index) => (
                      <span key={index} className="skill-tag tech-tag">{skill}<button type="button" className="tag-remove" onClick={() => removeTechSkill(index)} disabled={loading}><X size={12} /></button></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('jobs'); setNewJob({ project_name: '', location: '', demand_id: '', skills: '', openings: 1, bg: '', isu_hsu: '', stream: '', role: '', spoc_name: '', spoc_emp_id: '', rmg_head: '', course: '' }); }} disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{isEditing ? <><Check size={18} /> {loading ? 'Updating...' : 'Update Job'}</> : <><Plus size={18} /> {loading ? 'Creating...' : 'Create Job'}</>}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Other render functions (renderTraineesList, renderJobDetailsModal, etc.) remain unchanged.

  // New renderRecommendations
  const renderRecommendations = () => (
    <div className="recommendations-tab">
      <div className="section-header">
        <div className="header-title">
          <h2><ThumbsUp size={24} /> Recommendations from Course Owners</h2>
          <p className="subtitle">Review recommendations before mapping or locking</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={selectedRecJobId}
            onChange={(e) => setSelectedRecJobId(e.target.value)}
          >
            <option value="">All Jobs</option>
            {jobs
              .filter(j => j.recommendation_status !== 'not_requested')
              .map(job => <option key={job.id} value={job.id}>{job.project_name} ({job.demand_id})</option>)}
          </select>
          <select
            className="filter-select"
            value={recStatusFilter}
            onChange={(e) => setRecStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button className="btn btn-secondary" onClick={() => requestDownload('recommendations')} disabled={recommendations.length === 0}>
            <Download size={18} /> Download
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Trainee Name</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Job Title</th>
              <th>Demand ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map(rec => (
              <tr key={rec.id}>
                <td>{rec.trainee_name || '—'}</td>
                <td>{rec.trainee_employee_id || rec.trainee_id}</td>
                <td>{rec.trainee_email || `${rec.trainee_employee_id || rec.trainee_id}@tcs.com`}</td>
                <td>{rec.job_title}</td>
                <td>{rec.demand_id || '—'}</td>
                <td>
                  <span className={`status-badge status-${rec.status.toLowerCase()}`}>
                    {rec.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-icon-view" onClick={() => {
                      const trainee = findTraineeByUserId(rec.trainee_id);
                      if (trainee) handleViewTraineeProfile(trainee);
                    }}><Eye size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {recommendations.length === 0 && (
              <tr><td colSpan="7" className="no-data">No recommendations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Notify Modal
  const renderNotifyModal = () => (
    showNotifyModal && (
      <div className="modal-overlay" onClick={() => setShowNotifyModal(false)}>
        <div className="modal-content modal-sm notify-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Megaphone size={20} /> Notify Course Owner</h3>
            <button className="modal-close" onClick={() => setShowNotifyModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>How many top candidates to recommend?</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max="50"
                value={notifyCount}
                onChange={e => setNotifyCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 10)))}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowNotifyModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={executeNotify} disabled={loading}>
              {loading ? 'Notifying...' : 'Notify'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Sidebar items include Recommendations
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'jobs', label: 'Job Management', icon: <Briefcase size={20} /> },
    { id: 'trainees', label: 'Trainees', icon: <Users size={20} /> },
    { id: 'talentSearch', label: 'Talent Search', icon: <Search size={20} /> },
    { id: 'interviewLocks', label: 'Interview Locks', icon: <Lock size={20} /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={20} /> },
    { id: 'audit', label: 'Audit Trail', icon: <Shield size={20} /> },
    { id: 'selected', label: 'Selected', icon: <CheckCircle size={20} /> },
    { id: 'rejected', label: 'Rejected', icon: <XCircle size={20} /> },
    { id: 'recommendations', label: 'Recommendations', icon: <ThumbsUp size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'jobs': return renderJobManagement();
      case 'createJob': return renderCreateJob();
      case 'trainees': case 'mapped': case 'unmapped': case 'openPool': return renderTraineesList();
      case 'talentSearch': return renderTalentSearch();
      case 'interviewLocks': return renderInterviewLocks();
      case 'feedback': return renderFeedbackList();
      case 'audit': return renderAuditTrail();
      case 'selected': return renderSelected();
      case 'rejected': return renderRejected();
      case 'recommendations': return renderRecommendations();
      default: return renderDashboard();
    }
  };

  const renderBatchSelector = () => (
    <div className="batch-selector">
      <Layers size={18} />
      <select value={selectedBatch} onChange={(e) => { setSelectedBatch(e.target.value); setTraineePage(1); }} className="batch-dropdown">
        <option value="">All Batches</option>
        {availableBatches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
      </select>
    </div>
  );

  return (
    <div className="dashboard-page">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1><LayoutDashboard size={20} style={{ marginRight: '0.5rem' }} />HR Dashboard</h1>
          <div className="header-right">
            {renderBatchSelector()}
            <button className="btn-icon" onClick={refreshCurrentView} disabled={loading} title="Refresh">
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            </button>
            <button className="btn-icon" onClick={backupData} disabled={backupInProgress} title="Backup">
              <Database size={18} />
            </button>
            <label className="btn-icon" title="Select restore file">
              <Upload size={18} />
              <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => setRestoreFile(e.target.files[0])} />
            </label>
            {restoreFile && <button className="btn btn-secondary" onClick={restoreBackup} disabled={loading}>Restore</button>}
            {loading && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#888' }}><div className="spinner" style={{ width: 16, height: 16 }} /><span>Processing...</span></div>}
          </div>
        </div>
        <div className="dashboard-content">
          <div className="tab-panel">
            {renderContent()}
          </div>
        </div>
      </div>
      {renderHiddenFileInputs()}
      {renderExcelTemplateModal()}
      {renderWordTemplateModal()}
      {renderJobDetailsModal()}
      {renderTraineeModal()}
      {renderLockInterviewModal()}
      {renderFeedbackModal()}
      {renderPrivacyModal()}
      {renderCreateInterviewerModal()}
      {renderBulkInterviewerModal()}
      {renderBulkLockModal()}
      {renderBulkStatusModal()}
      {renderBulkMappingModal()}
      {renderErrorDetailsModal()}
      {renderNotifyModal()}
      {renderPrefLocModal()}
    </div>
  );
}

export default DashboardHR;
