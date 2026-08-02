// DashboardHR.js – Complete HR Dashboard with Course Owner Workflow, Recommendations, Demand-Supply Analysis, and All Features
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import XlsxPopulate from 'xlsx-populate';
import {
  LayoutDashboard, Briefcase, Users, BarChart2, FileText, LogOut,
  CheckCircle, MapPin, Calendar, Edit, Trash2, Eye, Search, X, User, Mail,
  Star, Target, Download, Plus, ArrowLeft, Check, AlertCircle, Link,
  BriefcaseBusiness, Building, BookOpen, Sparkles, FileSpreadsheet, File,
  Upload, Users2, Lock, XCircle, Shield, Layers, Activity, Zap, Award,
  TrendingUp, Clock, Info, MessageSquare, UploadCloud, ChevronDown,
  RefreshCw, Database, Megaphone, ThumbsUp,
} from 'lucide-react';
import { groupBy, ClickableStatCard, DrillDownModal } from './Drilldown';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart as ReLineChart, Line,
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
  const [selectedBatch, setSelectedBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [unfilteredTrainees, setUnfilteredTrainees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobs, setJobs] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [skillTrends, setSkillTrends] = useState({ tech: [], soft: [] });
  const [jobMatches, setJobMatches] = useState(null);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [traineeMatches, setTraineeMatches] = useState(null);
  const [traineeMatchesLoading, setTraineeMatchesLoading] = useState(false);
  const [traineesWithNoMatches, setTraineesWithNoMatches] = useState([]);
  const [checkingMatches, setCheckingMatches] = useState(false);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockInterviewDatetime, setLockInterviewDatetime] = useState('');
  const [lockComments, setLockComments] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [interviewers, setInterviewers] = useState([]);
  const [interviewLocks, setInterviewLocks] = useState([]);
  const [lockStats, setLockStats] = useState(null);
  const [lockFilter, setLockFilter] = useState({ status: '', job: '' });
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [rejectedLocks, setRejectedLocks] = useState([]);
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [jobDetailsJob, setJobDetailsJob] = useState(null);
  const [jobDetailsTab, setJobDetailsTab] = useState('overview');
  const [mappedTrainees, setMappedTrainees] = useState([]);
  const [rejectedTrainees, setRejectedTrainees] = useState([]);
  const [drill, setDrill] = useState(null); // { type, ...payload }
  const [newJob, setNewJob] = useState({
    project_name: '', location: '', demand_id: '', skills: '', openings: 1,
    bg: '', isu_hsu: '', stream: '', role: '', spoc_name: '', spoc_emp_id: '',
    rmg_head: '', course: '',
  });
  const [selectedJobForSearch, setSelectedJobForSearch] = useState(null);
  const [searchJobMatches, setSearchJobMatches] = useState(null);
  const [searchFilters, setSearchFilters] = useState({ bucket: '', location: '', minTotal: 0, skillKeyword: '' });
  const [selectedSearchTraineeIds, setSelectedSearchTraineeIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [traineePage, setTraineePage] = useState(1);
  const traineesPerPage = 10;
  const [totalMatchesCount, setTotalMatchesCount] = useState(0);
  const [avgMatchPercent, setAvgMatchPercent] = useState(0);
  const [bucketDistribution, setBucketDistribution] = useState({ PERFECT_MATCH: 0, SKILLS_ONLY: 0, LOCATION_ONLY: 0, NEARBY: 0, NO_MATCH: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState('');
  const [pendingDownload, setPendingDownload] = useState(null);
  const [showCreateInterviewerModal, setShowCreateInterviewerModal] = useState(false);
  const [newInterviewer, setNewInterviewer] = useState({ username: '', password: 'Tcs#12345', email: '', access_start: '', access_end: '' });
  const [showBulkLockModal, setShowBulkLockModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkMappingModal, setShowBulkMappingModal] = useState(false);
  const [bulkLockFile, setBulkLockFile] = useState(null);
  const [bulkStatusFile, setBulkStatusFile] = useState(null);
  const [bulkMappingFile, setBulkMappingFile] = useState(null);
  const [bulkOpsOpen, setBulkOpsOpen] = useState(false);
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
  const [coursesList, setCoursesList] = useState([]);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyCount, setNotifyCount] = useState(10);
  const [notifyJobId, setNotifyJobId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecJobId, setSelectedRecJobId] = useState('');
  const [recStatusFilter, setRecStatusFilter] = useState('');
  const [showPrefLocModal, setShowPrefLocModal] = useState(false);
  const [dsAnalysis, setDsAnalysis] = useState(null);
  const [dsFilter, setDsFilter] = useState({ batch: '', location: '' });
  const [isNotifying, setIsNotifying] = useState(false);



  const [workbookSheet, setWorkbookSheet] = useState('trainees'); // trainees | jobs | matches | pipeline
const [workbookJobId, setWorkbookJobId] = useState('');
const [workbookRows, setWorkbookRows] = useState([]);
const [workbookCols, setWorkbookCols] = useState([]);
const [workbookLoading, setWorkbookLoading] = useState(false);
const [workbookFilter, setWorkbookFilter] = useState('');   
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

  const normalizeJobRecord = (job = {}) => ({
    ...job,
    project_name: job?.project_name || job?.projectName || 'Untitled Job',
    status: job?.status || 'active',
    openings: Number(job?.openings ?? 1),
    filled: Number(job?.filled ?? 0),
    matches: Number(job?.matches ?? 0),
    techSkills: Array.isArray(job?.techSkills) ? job.techSkills : typeof job?.skills === 'string' ? job.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : [],
    softSkills: Array.isArray(job?.softSkills) ? job.softSkills : [],
  });

  const normalizeTraineeRecord = (trainee = {}) => {
    const userInfo = trainee?.userInfo || {};
    const strengths = Array.isArray(trainee?.strengths) ? trainee.strengths : [];
    const weaknesses = Array.isArray(trainee?.weaknesses) ? trainee.weaknesses : [];
    const avgScore = Number(userInfo?.averageScore ?? 0);
    const empId = userInfo?.employeeId || '';
    return {
      id: trainee?.id,
      userId: userInfo?.userId || trainee?.id,
      name: userInfo?.name || 'Unknown',
      email: empId ? `${empId}@tcs.com` : (userInfo?.email || ''),
      skills: [...strengths.map((s) => s?.courseName).filter(Boolean), ...weaknesses.map((w) => w?.courseName).filter(Boolean)],
      score: Math.round(avgScore),
      location: (userInfo?.location || 'unknown').toLowerCase(),
      preferredLocation1: userInfo?.preferred_location_1 || '',
      preferredLocation2: userInfo?.preferred_location_2 || '',
      preferredLocation3: userInfo?.preferred_location_3 || '',
      isMapped: Boolean(userInfo?.isMapped),
      projectId: userInfo?.projectId || '',
      projectName: userInfo?.projectName || '',
      batch_name: trainee?.batch_name || '',
      traineeData: trainee,
    };
  };
  const getJobTechSkills = (job) => {
    if (!job) return [];
    if (Array.isArray(job.techSkills) && job.techSkills.length) return job.techSkills;
    if (typeof job.skills === 'string' && job.skills.trim()) return job.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    return [];
  };

  const getJobDepartment = (job) => job?.department || job?.bg || '—';


  // Load saved batch once
  useEffect(() => {
    const saved = localStorage.getItem('hr_selected_batch');
    if (saved) setSelectedBatch(saved);
  }, []);

  // Persist when batch changes
  useEffect(() => {
    localStorage.setItem('hr_selected_batch', selectedBatch || '');
  }, [selectedBatch]);
  // ==================== API Calls ====================
  const jobAPI = {
    getAllJobs: async () => (await api.get(`/jobs/${getBatchParam()}`)).data,
    createJob: async (jobData) => (await api.post('/jobs/', { ...jobData, batch_name: selectedBatch })).data,
    updateJob: async (id, jobData) => (await api.put(`/jobs/${id}/`, jobData)).data,
    deleteJob: async (id) => (await api.delete(`/jobs/${id}/`)).data,
    toggleJobStatus: async (id) => (await api.patch(`/jobs/${id}/toggle-status/`)).data,
    uploadExcel: async (file) => { const fd = new FormData(); fd.append('excel_file', file); fd.append('batch_name', selectedBatch); return (await api.post('/jobs/upload-excel/', fd)).data; },
    uploadWord: async (file) => { const fd = new FormData(); fd.append('wordFile', file); fd.append('batch_name', selectedBatch); return (await api.post('/jobs/upload-word/', fd)).data; },
    downloadExcelTemplate: async () => (await api.get('/jobs/download-excel-template/', { responseType: 'blob' })).data,
    downloadWordTemplate: async () => (await api.get('/jobs/download-word-template/', { responseType: 'blob' })).data,
  };

  const mappingAPI = {
    updateMapping: async (userId, mappingData) => (await api.patch(`/api/userinfo/${userId}/update-mapping/`, mappingData)).data,
  };

  const fetchCoursesList = async () => { try { const res = await api.get('/courses/'); setCoursesList(res.data); } catch (err) { console.error('Failed to fetch courses', err); } };

  // Fetch trainees
  const fetchTrainees = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/profiles/${getBatchParam()}`;
      const response = await api.get(url);
      const payload = Array.isArray(response?.data) ? response.data : [];
      const transformed = payload.map((trainee) => normalizeTraineeRecord(trainee));
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


  const handleJobSelectForSearch = async (jobId) => {
    if (!jobId) { setSelectedJobForSearch(null); setSearchJobMatches(null); return; }
    const job = jobs.find(j => j.id === parseInt(jobId));
    if (!job || getRemainingOpenings(job) <= 0 || job.status !== 'active') { toast.error('This job has no openings or is inactive'); setSelectedJobForSearch(null); setSearchJobMatches(null); return; }
    setSelectedJobForSearch(job);
    setJobMatchesLoading(true);
    try { const res = await api.get(`/matches/${job.id}/${getBatchParam()}`); setSearchJobMatches(res.data); setSelectedSearchTraineeIds([]); setSelectAll(false); }
    catch { toast.error('Failed to fetch matches'); } finally { setJobMatchesLoading(false); }
  };


  const buildActionQueue = () => {
    const items = [];

    // 1. Active jobs with openings but zero matches field
    jobs
      .filter((j) => j.status === 'active' && getRemainingOpenings(j) > 0 && Number(j.matches || 0) === 0)
      .slice(0, 5)
      .forEach((j) => {
        items.push({
          id: `nomatch-${j.id}`,
          severity: 'high',
          title: `No matches: ${j.project_name}`,
          detail: `${getRemainingOpenings(j)} openings — run matching or fix skills`,
          actionLabel: 'Open job',
          onAction: () => {
            setSelectedJob(j);
            setActiveTab('jobs');
          },
        });
      });

    // 2. Active jobs with openings + matches, suggest search
    jobs
      .filter((j) => j.status === 'active' && getRemainingOpenings(j) > 0 && Number(j.matches || 0) > 0)
      .slice(0, 5)
      .forEach((j) => {
        items.push({
          id: `fill-${j.id}`,
          severity: 'medium',
          title: `Fill openings: ${j.project_name}`,
          detail: `${getRemainingOpenings(j)} left · ${j.matches} matches`,
          actionLabel: 'Talent search',
          onAction: () => goTalentSearchForJob(j.id),

        });
      });

    // 3. Stale interview locks
    const now = Date.now();
    interviewLocks
      .filter((l) => l.status === 'locked' && l.interview_datetime && new Date(l.interview_datetime).getTime() < now)
      .slice(0, 5)
      .forEach((l) => {
        items.push({
          id: `stale-${l.id}`,
          severity: 'high',
          title: `Past interview: ${l.trainee_name || 'Candidate'}`,
          detail: l.job_title || 'Job',
          actionLabel: 'Locks',
          onAction: () => setActiveTab('interviewLocks'),
        });
      });

    // 4. Pending recommendations
    const pendingRecs = (recommendations || []).filter((r) => r.status === 'Pending');
    if (pendingRecs.length > 0) {
      items.push({
        id: 'pending-recs',
        severity: 'medium',
        title: `${pendingRecs.length} recommendations pending`,
        detail: 'Course owners still reviewing',
        actionLabel: 'Review',
        onAction: () => {
          setRecStatusFilter('Pending');
          setActiveTab('recommendations');
        },
      });
    }

    // 5. Open pool
    if (traineesWithNoMatches.length > 0) {
      items.push({
        id: 'open-pool',
        severity: 'low',
        title: `${traineesWithNoMatches.length} in open pool`,
        detail: 'No job match — upskill or broaden JDs',
        actionLabel: 'Open pool',
        onAction: () => setActiveTab('openPool'),
      });
    }

    // 6. Critical skill gaps
    const critical = (dsAnalysis?.skillGaps || []).filter(
      (s) => s.status === 'Critical' || s.status === 'Shortage'
    );
    if (critical.length > 0) {
      items.push({
        id: 'skill-gaps',
        severity: 'high',
        title: `${critical.length} critical skill gaps`,
        detail: critical.slice(0, 3).map((s) => s.skill).join(', '),
        actionLabel: 'Gaps',
        onAction: openSkillGapDrill,
      });
    }

    const order = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => order[a.severity] - order[b.severity]);
  };


  const goTalentSearchForJob = (jobId) => {
    setActiveTab('talentSearch');
    setTimeout(() => {
      handleJobSelectForSearch(jobId);
    }, 0);
  };





  const lockByTraineeId = () => {
  const map = {};
  (interviewLocks || []).forEach((l) => {
    const tid = String(
      l.trainee_id ||
        l.trainee?.userInfo?.userId ||
        l.trainee_user_id ||
        ''
    );
    if (!tid) return;
    // keep latest-ish
    if (!map[tid] || new Date(l.updated_at || l.created_at || 0) > new Date(map[tid].updated_at || 0)) {
      map[tid] = l;
    }
  });
  return map;
};

const buildTraineeWorkbook = () => {
  const locks = lockByTraineeId();
  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'userId', label: 'User ID' },
    { key: 'email', label: 'Email' },
    { key: 'batch_name', label: 'Batch' },
    { key: 'location', label: 'Location' },
    { key: 'preferredLocation1', label: 'Pref Loc 1' },
    { key: 'preferredLocation2', label: 'Pref Loc 2' },
    { key: 'preferredLocation3', label: 'Pref Loc 3' },
    { key: 'score', label: 'Score' },
    { key: 'skills', label: 'Skills' },
    { key: 'isMapped', label: 'Mapped' },
    { key: 'projectName', label: 'Project' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'lockStatus', label: 'Lock Status' },
    { key: 'lockJob', label: 'Lock Job' },
    { key: 'interviewDatetime', label: 'Interview At' },
  ];

  const rows = (allTrainees || []).map((t) => {
    const lock = locks[String(t.userId)] || null;
    return {
      name: t.name,
      userId: t.userId,
      email: t.email,
      batch_name: t.batch_name || '',
      location: t.location || '',
      preferredLocation1: t.preferredLocation1 || '',
      preferredLocation2: t.preferredLocation2 || '',
      preferredLocation3: t.preferredLocation3 || '',
      score: t.score,
      skills: Array.isArray(t.skills) ? t.skills.join(', ') : '',
      isMapped: t.isMapped ? 'Yes' : 'No',
      projectName: t.projectName || '',
      projectId: t.projectId || '',
      lockStatus: lock?.status || '',
      lockJob: lock?.job_title || lock?.job?.project_name || '',
      interviewDatetime: lock?.interview_datetime || '',
    };
  });

  return { cols, rows };
};

const buildJobWorkbook = () => {
  const cols = [
    { key: 'project_name', label: 'Project' },
    { key: 'demand_id', label: 'Demand ID' },
    { key: 'location', label: 'Location' },
    { key: 'skills', label: 'Skills' },
    { key: 'openings', label: 'Openings' },
    { key: 'filled', label: 'Filled' },
    { key: 'remaining', label: 'Remaining' },
    { key: 'status', label: 'Status' },
    { key: 'matches', label: 'Matches' },
    { key: 'batch_name', label: 'Batch' },
    { key: 'recommendation_status', label: 'Rec Status' },
  ];

  const rows = (jobs || []).map((j) => ({
    project_name: j.project_name,
    demand_id: j.demand_id || '',
    location: j.location || '',
    skills: j.skills || (j.techSkills || []).join(', '),
    openings: j.openings,
    filled: j.filled,
    remaining: getRemainingOpenings(j),
    status: j.status,
    matches: j.matches ?? 0,
    batch_name: j.batch_name || '',
    recommendation_status: j.recommendation_status || '',
  }));

  return { cols, rows };
};

const buildPipelineWorkbook = () => {
  const cols = [
    { key: 'trainee_name', label: 'Trainee' },
    { key: 'trainee_id', label: 'Trainee ID' },
    { key: 'job_title', label: 'Job' },
    { key: 'job_id', label: 'Job ID' },
    { key: 'status', label: 'Status' },
    { key: 'interview_datetime', label: 'Interview At' },
    { key: 'assigned_to', label: 'Interviewer' },
    { key: 'locked_by', label: 'Locked By' },
    { key: 'comments', label: 'Comments' },
    { key: 'updated_at', label: 'Updated' },
  ];

  const rows = (interviewLocks || []).map((l) => ({
    trainee_name:
      l.trainee_name ||
      l.trainee?.userInfo?.name ||
      '',
    trainee_id:
      l.trainee_id ||
      l.trainee?.userInfo?.userId ||
      '',
    job_title: l.job_title || l.job?.project_name || '',
    job_id: l.job_id || l.job?.id || '',
    status: l.status || '',
    interview_datetime: l.interview_datetime || '',
    assigned_to:
      l.assigned_to_name ||
      l.assigned_to?.username ||
      l.assigned_to ||
      '',
    locked_by:
      l.locked_by_name ||
      l.locked_by?.username ||
      '',
    comments: l.comments || '',
    updated_at: l.updated_at || l.created_at || '',
  }));

  return { cols, rows };
};

const flattenMatchPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  // Talent Search / matches API shape
  const buckets = [
    'perfect_match',
    'PERFECT_MATCH',
    'skills_only',
    'SKILLS_ONLY',
    'location_only',
    'LOCATION_ONLY',
    'nearby',
    'NEARBY',
    'no_match',
    'NO_MATCH',
    'matches',
    'results',
  ];

  const out = [];
  buckets.forEach((key) => {
    const arr = payload[key];
    if (Array.isArray(arr)) out.push(...arr);
  });

  // de-dupe by match id or trainee_id+job_id
  const seen = new Set();
  return out.filter((m) => {
    const k = String(m.id ?? `${m.trainee_id}-${m.job_id}-${m.bucket}`);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const buildMatchWorkbookFromPayload = (payload) => {
  const list = flattenMatchPayload(payload);

  const cols = [
    { key: 'trainee_name', label: 'Trainee' },
    { key: 'trainee_id', label: 'Trainee ID' },
    { key: 'trainee_location', label: 'Location' },
    { key: 'bucket', label: 'Bucket' },
    { key: 'skills_percentage', label: 'Skills %' },
    { key: 'location_percentage', label: 'Location %' },
    { key: 'total_percentage', label: 'Total %' },
    { key: 'distance', label: 'Distance' },
    { key: 'matched_skills', label: 'Matched Skills' },
    { key: 'matched_location', label: 'Matched Loc' },
    { key: 'is_recommended', label: 'Recommended' },
    { key: 'rank', label: 'Rank' },
    { key: 'job_title', label: 'Job' },
  ];

  const rows = list.map((m) => ({
    trainee_name: m.trainee_name || '',
    trainee_id: m.trainee_id || '',
    trainee_location: m.trainee_location || '',
    bucket: m.bucket || '',
    skills_percentage:
      m.skills_percentage != null ? Number(m.skills_percentage).toFixed(1) : '',
    location_percentage:
      m.location_percentage != null ? Number(m.location_percentage).toFixed(1) : '',
    total_percentage:
      m.total_percentage != null ? Number(m.total_percentage).toFixed(1) : '',
    distance: m.distance != null ? Number(m.distance).toFixed(1) : '',
    matched_skills: Array.isArray(m.matched_skills)
      ? m.matched_skills.join(', ')
      : m.matched_skills || '',
    matched_location: m.matched_location || '',
    is_recommended: m.is_recommended ? 'Yes' : 'No',
    rank: m.rank ?? '',
    job_title: m.job_title || '',
  }));

  // best first
  rows.sort(
    (a, b) =>
      Number(b.total_percentage || 0) - Number(a.total_percentage || 0)
  );

  return { cols, rows };
};

const loadWorkbookSheet = async (sheet = workbookSheet, jobId = workbookJobId) => {
  setWorkbookLoading(true);
  setWorkbookFilter('');
  try {
    if (sheet === 'trainees') {
      if (!allTrainees?.length) await fetchTrainees();
      const { cols, rows } = buildTraineeWorkbook();
      setWorkbookCols(cols);
      setWorkbookRows(rows);
    } else if (sheet === 'jobs') {
      // ensure jobs loaded if you have fetchJobs
      if (typeof fetchJobs === 'function' && !jobs?.length) await fetchJobs();
      const { cols, rows } = buildJobWorkbook();
      setWorkbookCols(cols);
      setWorkbookRows(rows);
    } else if (sheet === 'pipeline') {
      if (typeof fetchInterviewLocks === 'function' && !interviewLocks?.length) {
        await fetchInterviewLocks();
      }
      const { cols, rows } = buildPipelineWorkbook();
      setWorkbookCols(cols);
      setWorkbookRows(rows);
    } else if (sheet === 'matches') {
      if (!jobId) {
        setWorkbookCols([]);
        setWorkbookRows([]);
        toast.info('Select a job to load matches');
        return;
      }
      const job = jobs.find((j) => String(j.id) === String(jobId));
      if (!job) {
        toast.error('Job not found');
        return;
      }
      const res = await api.get(`/matches/${job.id}/${getBatchParam()}`);
      const { cols, rows } = buildMatchWorkbookFromPayload(res.data);
      setWorkbookCols(cols);
      setWorkbookRows(rows);
    }
  } catch (e) {
    console.error(e);
    toast.error('Failed to load workbook data');
    setWorkbookCols([]);
    setWorkbookRows([]);
  } finally {
    setWorkbookLoading(false);
  }
};

const downloadWorkbookExcel = async () => {
  if (!workbookRows.length) {
    toast.error('Nothing to download');
    return;
  }
  try {
    const wb = await XlsxPopulate.fromBlankAsync();
    const sheet = wb.sheet(0).name(workbookSheet || 'Sheet1');
    const headers = workbookCols.map((c) => c.label);
    headers.forEach((h, i) => {
      sheet.cell(1, i + 1).value(h).style({ bold: true });
    });
    workbookRows.forEach((row, r) => {
      workbookCols.forEach((c, i) => {
        sheet.cell(r + 2, i + 1).value(row[c.key] ?? '');
      });
    });
    const blob = await wb.outputAsync();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workbook_${workbookSheet}_${selectedBatch || 'all'}_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Downloaded');
  } catch (e) {
    console.error(e);
    toast.error('Download failed');
  }
};

const filteredWorkbookRows = () => {
  const q = (workbookFilter || '').trim().toLowerCase();
  if (!q) return workbookRows;
  return workbookRows.filter((row) =>
    workbookCols.some((c) =>
      String(row[c.key] ?? '')
        .toLowerCase()
        .includes(q)
    )
  );
};



const renderWorkbook = () => {
  const rows = filteredWorkbookRows();

  return (
    <div className="workbook-tab">
      <div className="section-header" style={{ marginBottom: '0.75rem' }}>
        <div className="header-title">
          <h2>
            <FileSpreadsheet size={22} /> Workbook
          </h2>
          <p className="subtitle">
            Batch: {selectedBatch || 'All'} · Excel-style views · download current grid
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => loadWorkbookSheet(workbookSheet, workbookJobId)}
            disabled={workbookLoading}
          >
            <RefreshCw size={16} className={workbookLoading ? 'spinning' : ''} /> Reload
          </button>
          <button
            className="btn btn-primary"
            onClick={downloadWorkbookExcel}
            disabled={!workbookRows.length}
          >
            <Download size={16} /> Download Excel
          </button>
        </div>
      </div>

      {/* Sheet buttons */}
      <div className="header-actions" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
        {[
          { id: 'trainees', label: 'Trainees' },
          { id: 'jobs', label: 'Jobs' },
          { id: 'matches', label: 'Matches by job' },
          { id: 'pipeline', label: 'Interview pipeline' },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn ${workbookSheet === s.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => {
              setWorkbookSheet(s.id);
              loadWorkbookSheet(s.id, workbookJobId);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Job dropdown for matches */}
      {workbookSheet === 'matches' && (
        <div className="form-row" style={{ marginBottom: '0.75rem', alignItems: 'center', gap: 12 }}>
          <label style={{ fontWeight: 600 }}>Job</label>
          <select
            className="form-control"
            style={{ maxWidth: 420 }}
            value={workbookJobId}
            onChange={(e) => {
              const id = e.target.value;
              setWorkbookJobId(id);
              if (id) loadWorkbookSheet('matches', id);
            }}
          >
            <option value="">Select job…</option>
            {(jobs || [])
              .filter((j) => j.status === 'active')
              .map((j) => (
                <option key={j.id} value={j.id}>
                  {j.project_name} ({getRemainingOpenings(j)} open)
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="bento-panel">
        <div className="bento-panel-header">
          <h3>
            {workbookSheet} · {rows.length} rows
          </h3>
          <input
            className="form-control"
            style={{ maxWidth: 260 }}
            placeholder="Filter…"
            value={workbookFilter}
            onChange={(e) => setWorkbookFilter(e.target.value)}
          />
        </div>
        <div className="bento-panel-body" style={{ overflow: 'auto', maxHeight: '65vh' }}>
          {workbookLoading ? (
            <p className="no-data">Loading…</p>
          ) : !workbookCols.length ? (
            <p className="no-data">
              {workbookSheet === 'matches'
                ? 'Select a job to load match rows.'
                : 'Click a sheet button to load data.'}
            </p>
          ) : (
            <table className="data-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  {workbookCols.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {workbookCols.map((c) => (
                      <td key={c.key}>{row[c.key] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};




  const fetchFullTraineeListForBatches = async () => {
    if (unfilteredTrainees.length > 0) return;
    try {
      const response = await api.get('/api/profiles/');
      const payload = Array.isArray(response?.data) ? response.data : [];
      const transformed = payload.map((trainee) => normalizeTraineeRecord(trainee));
      setUnfilteredTrainees(transformed);
      const batches = [...new Set(transformed.map(t => t.batch_name).filter(Boolean))];
      setAvailableBatches(batches);
    } catch (err) { console.error('Failed to fetch full trainee list for batches', err); }
  };





  const openMappedDrill = () => {
    const rows = allTrainees.filter((t) => t.isMapped);
    const byProject = groupBy(rows, (t) => t.projectName || 'Unknown project');
    const byLocation = groupBy(rows, (t) => t.location || 'unknown');
    setDrill({
      type: 'mapped',
      title: 'Mapped Trainees',
      chips: [
        { label: 'mapped', value: rows.length },
        { label: 'projects', value: byProject.length },
        { label: 'locations', value: byLocation.length },
      ],
      tabs: [
        {
          id: 'by-project',
          label: 'By Project',
          type: 'groups',
          groups: byProject.map((g) => ({ key: g.key, count: g.count })),
        },
        {
          id: 'by-location',
          label: 'By Location',
          type: 'groups',
          groups: byLocation.map((g) => ({ key: g.key, count: g.count })),
        },
        {
          id: 'list',
          label: 'Full List',
          type: 'list',
          searchKeys: ['name', 'email', 'projectName', 'location'],
          columns: [
            { key: 'name', label: 'Name', sortable: true },
            { key: 'projectName', label: 'Project', sortable: true },
            { key: 'location', label: 'Location', sortable: true },
            { key: 'score', label: 'Score', sortable: true },
            {
              key: 'actions',
              label: 'Actions',
              render: (t) => (
                <div className="drill-actions">
                  <button
                    type="button"
                    className="btn-icon btn-icon-view"
                    title="View profile"
                    onClick={() => handleViewTraineeProfile(t)}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    title="Unmap"
                    onClick={() => handleUnmapFromProject(t)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ),
            },
          ],
          rows,
        },
      ],
    });
  };

  const openUnmappedDrill = () => {
    const rows = allTrainees.filter((t) => !t.isMapped);
    const byLocation = groupBy(rows, (t) => t.location || 'unknown');
    const byBatch = groupBy(rows, (t) => t.batch_name || '—');
    setDrill({
      type: 'unmapped',
      title: 'Unmapped Trainees',
      chips: [
        { label: 'available', value: rows.length },
        { label: 'locations', value: byLocation.length },
      ],
      tabs: [
        {
          id: 'by-location',
          label: 'By Location',
          type: 'groups',
          groups: byLocation.map((g) => ({ key: g.key, count: g.count })),
        },
        {
          id: 'by-batch',
          label: 'By Batch',
          type: 'groups',
          groups: byBatch.map((g) => ({ key: g.key, count: g.count })),
        },
        {
          id: 'list',
          label: 'Full List',
          type: 'list',
          searchKeys: ['name', 'email', 'location', 'batch_name'],
          columns: [
            { key: 'name', label: 'Name', sortable: true },
            { key: 'location', label: 'Location', sortable: true },
            { key: 'batch_name', label: 'Batch', sortable: true },
            { key: 'score', label: 'Score', sortable: true },
            {
              key: 'actions',
              label: 'Actions',
              render: (t) => (
                <button
                  type="button"
                  className="btn-icon btn-icon-view"
                  onClick={() => handleViewTraineeProfile(t)}
                >
                  <Eye size={14} />
                </button>
              ),
            },
          ],
          rows,
        },
      ],
    });
  };

  /** Proximity: needs match data. Prefer dashboardAnalytics / cached matches.
   *  Fallback: derive from trainee preferred locs + job locations when match
   *  detail is not in memory. A small backend aggregate would help (see note). */
  const openProximityDrill = async () => {
    // If you already have a flat list of NEARBY matches in state, use it.
    // Otherwise fetch lightly or use dsAnalysis / dashboardAnalytics if present.
    let nearbyRows = [];
    // Example shape expected:
    // { trainee_name, trainee_location, job_title, job_location, distance, total_percentage, trainee_id, job_id }

    // Optional: if matches are not loaded, you can leave empty and show a note,
    // or trigger a lightweight endpoint (see backend note below).

    const byRoute = groupBy(
      nearbyRows,
      (m) => `${m.trainee_location || '?'} → ${m.job_location || '?'}`
    );

    setDrill({
      type: 'proximity',
      title: 'Proximity Matches',
      chips: [
        { label: 'matches', value: nearbyRows.length },
        { label: 'routes', value: byRoute.length },
      ],
      tabs: [
        {
          id: 'by-route',
          label: 'By Route',
          type: 'groups',
          groups: byRoute.map((g) => ({ key: g.key, count: g.count })),
        },
        {
          id: 'list',
          label: 'Full List',
          type: 'list',
          searchKeys: ['trainee_name', 'trainee_location', 'job_title', 'job_location'],
          columns: [
            { key: 'trainee_name', label: 'Trainee', sortable: true },
            { key: 'trainee_location', label: 'From', sortable: true },
            { key: 'job_location', label: 'To', sortable: true },
            { key: 'distance', label: 'Distance', sortable: true },
            {
              key: 'total_percentage',
              label: 'Match %',
              sortable: true,
              render: (m) => `${Number(m.total_percentage || 0).toFixed(1)}%`,
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (m) => {
                const trainee = findTraineeByUserId(m.trainee_id);
                return (
                  <div className="drill-actions">
                    {trainee && (
                      <button
                        type="button"
                        className="btn-icon btn-icon-view"
                        onClick={() => handleViewTraineeProfile(trainee)}
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                );
              },
            },
          ],
          rows: nearbyRows,
        },
      ],
    });
  };

  const openSkillGapDrill = () => {
    const gaps = dsAnalysis?.skillGaps || [];
    const critical = gaps.filter((s) => s.status === 'Critical' || s.status === 'Shortage');
    setDrill({
      type: 'skill-gap',
      title: 'Skill Gap Analysis',
      chips: [
        { label: 'skills analyzed', value: gaps.length },
        { label: 'critical / shortage', value: critical.length },
      ],
      tabs: [
        {
          id: 'status',
          label: 'By Status',
          type: 'groups',
          groups: groupBy(gaps, (s) => s.status).map((g) => ({
            key: g.key,
            count: g.count,
          })),
        },
        {
          id: 'list',
          label: 'Full List',
          type: 'list',
          searchKeys: ['skill', 'status'],
          columns: [
            { key: 'skill', label: 'Skill', sortable: true },
            { key: 'demand', label: 'Demand', sortable: true },
            { key: 'supply', label: 'Supply', sortable: true },
            {
              key: 'gap',
              label: 'Gap',
              sortable: true,
              render: (s) => (
                <span style={{ color: s.gap > 0 ? '#dc2626' : '#10b981', fontWeight: 700 }}>
                  {s.gap > 0 ? `-${s.gap}` : `+${Math.abs(s.gap)}`}
                </span>
              ),
            },
            {
              key: 'fillRate',
              label: 'Fill %',
              sortable: true,
              render: (s) => `${s.fillRate}%`,
            },
            {
              key: 'status',
              label: 'Status',
              sortable: true,
              render: (s) => (
                <span className={`status-badge status-${String(s.status).toLowerCase()}`}>
                  {s.status}
                </span>
              ),
            },
          ],
          rows: gaps,
        },
      ],
    });
  };



  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobAPI.getAllJobs();
      const payload = Array.isArray(response) ? response : response?.results || [];
      setJobs(payload.map((job) => normalizeJobRecord(job)));
    } catch (err) {
      setError('Failed to fetch jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

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
          const hasNoMatch = (data.total_matches >= 0 && data.no_match?.length > 0 && !data.perfect_match?.length && !data.skills_only?.length && !data.location_only?.length && !data.nearby?.length) || data.total_matches === 0;
          if (hasNoMatch) {
            noMatchTrainees.push({ ...trainee, trainee_id: trainee.id, trainee_name: trainee.name, trainee_location: trainee.location, total_matches: data.total_matches, no_match_count: data.no_match?.length || 0 });
          }
        } catch (error) { noMatchTrainees.push({ ...trainee, total_matches: 0, no_match_count: 0 }); }
      }
      setTraineesWithNoMatches(noMatchTrainees);
    } catch (err) { toast.error('Failed to check Open Pool'); } finally { setCheckingMatches(false); }
  };

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
    } catch (error) { toast.error('Failed to update job vacancies'); throw error; }
  };

  const checkAndAutoDeactivateJob = async (job) => {
    if (getRemainingOpenings(job) <= 0) {
      const updated = { ...job, status: 'filled' };
      await jobAPI.updateJob(job.id, updated);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      toast.success(`Job "${job.project_name}" auto‑deactivated.`);
    }
  };

  const handleMapToProject = async (traineeOrMatch, job) => {
    try {
      setLoading(true);
      let userId = null, traineeName = '';
      if (traineeOrMatch.traineeData) { userId = traineeOrMatch.traineeData.userInfo.userId; traineeName = traineeOrMatch.name; }
      else { const found = findTraineeByUserId(getMatchTraineeUserId(traineeOrMatch)); if (found) { userId = found.userId; traineeName = found.name; } else { toast.error('Trainee not found'); return; } }
      if (!userId) { toast.error('Could not find user ID'); return; }
      if (getRemainingOpenings(job) <= 0) { toast.error('No openings left'); return; }
      const mappingData = { isMapped: true, projectId: job.id.toString(), projectName: job.project_name };
      await mappingAPI.updateMapping(userId, mappingData);
      const updatedJob = await updateJobVacancies(job);
      if (selectedJobForSearch && selectedJobForSearch.id === job.id) { setSelectedJobForSearch(updatedJob); await handleJobSelectForSearch(job.id); }
      setTraineesWithNoMatches((prev) => prev.filter((t) => t.userId !== userId));
      setAllTrainees((prev) => prev.map((t) => (t.userId === userId ? { ...t, isMapped: true, projectId: job.id, projectName: job.project_name } : t)));
      setTrainees((prev) => prev.map((t) => (t.userId === userId ? { ...t, isMapped: true, projectId: job.id, projectName: job.project_name } : t)));
      if (jobMatches) {
        const bucket = Object.keys(jobMatches).find((key) => Array.isArray(jobMatches[key]) && jobMatches[key].some((m) => getMatchTraineeUserId(m) === String(userId)));
        if (bucket) setJobMatches((prev) => ({ ...prev, [bucket]: prev[bucket].filter((m) => getMatchTraineeUserId(m) !== String(userId)), total_matches: prev.total_matches - 1 }));
      }
      if (searchJobMatches) await handleJobSelectForSearch(job.id);
      setRecentActivity(prev => [{ type: 'Mapped', trainee: traineeName, job: job.project_name, time: new Date().toLocaleString() }, ...prev.slice(0, 4)]);
      toast.success(`Mapped ${traineeName} to ${job.project_name}`);
    } catch (err) { toast.error('Failed to map trainee: ' + (err.response?.data?.error || err.message)); } finally { setLoading(false); }
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
          const updated = { ...job, filled: Math.max(0, (job.filled || 0) - 1) };
          if (['inactive', 'filled'].includes(job.status) && updated.openings - updated.filled > 0) updated.status = 'active';
          await jobAPI.updateJob(job.id, updated);
          setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
        }
      }
      setAllTrainees((prev) => prev.map((t) => (t.id === trainee.id ? { ...t, ...unmappingData } : t)));
      toast.success(`Unmapped ${trainee.name}`);
    } catch (err) { toast.error('Failed to unmap trainee'); } finally { setLoading(false); }
  };

  const fetchJobMatches = async (jobId) => {
    setJobMatchesLoading(true); try {
      setJobMatches((await api.get(`/matches/${jobId}/${getBatchParam()}`)).data);
    } catch {
      toast.error('Failed to fetch job matches');
    } finally {
      setJobMatchesLoading(false);
    }
  };
  const fetchTraineeMatches = async (traineeId) => {
    setTraineeMatchesLoading(true);
    try {
      setTraineeMatches((await api.get(`/trainee-matches/${traineeId}/${getBatchParam()}`)).data);
    } catch { toast.error('Failed to fetch trainee matches'); }
    finally { setTraineeMatchesLoading(false); }
  };
  const fetchMappedForJob = async (jobId) => {
    setMappedTrainees(allTrainees.filter(t => t.isMapped && t.projectId === jobId.toString()));
  };
  const fetchRejectedForJob = async (jobId) => {
    try { setRejectedTrainees((await api.get(`/interview-locks/?job=${jobId}&status=rejected${selectedBatch ? `&batch=${selectedBatch}` : ''}`)).data); }
    catch { toast.error('Failed to fetch rejected trainees'); }
  };

  const handleViewJobDetails = (job) => {
    setJobDetailsJob(job);
    setJobDetailsTab('overview');
    fetchMappedForJob(job.id);
    fetchRejectedForJob(job.id);
    setShowJobDetailsModal(true);
  };
  const handleViewTraineeProfile = (trainee) => {
    setSelectedTrainee(trainee); fetchTraineeMatches(trainee.id);
  };

  const toggleJobStatus = async (jobId) => {
    try {
      await jobAPI.toggleJobStatus(jobId);
      setJobs((jobs) => jobs.map((job) => job.id === jobId ? { ...job, status: job.status === 'active' ? 'inactive' : 'active' } : job));
      toast.success('Job status updated!');
    }
    catch { toast.error('Failed to update job status'); }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    try { setLoading(true); await jobAPI.deleteJob(jobId); setJobs(jobs.filter((j) => j.id !== jobId)); toast.success('Job deleted'); }
    catch { toast.error('Failed to delete job'); } finally { setLoading(false); }
  };

  const handleCreateJob = async () => {
    if (!newJob.project_name || !newJob.location || !newJob.demand_id || !newJob.skills || !newJob.openings) { toast.error('Please fill all required fields'); return; }
    try {
      setLoading(true);
      const jobData = { project_name: newJob.project_name, location: newJob.location, demand_id: newJob.demand_id, skills: newJob.skills, openings: newJob.openings, bg: newJob.bg, isu_hsu: newJob.isu_hsu, stream: newJob.stream, role: newJob.role, spoc_name: newJob.spoc_name, spoc_emp_id: newJob.spoc_emp_id, rmg_head: newJob.rmg_head, course: newJob.course || null, status: 'active', filled: 0, matches: 0, postedDate: new Date().toISOString().split('T')[0], batch_name: selectedBatch };
      await jobAPI.createJob(jobData);
      await fetchJobs();
      setNewJob({ project_name: '', location: '', demand_id: '', skills: '', openings: 1, bg: '', isu_hsu: '', stream: '', role: '', spoc_name: '', spoc_emp_id: '', rmg_head: '', course: '' });
      setActiveTab('jobs'); toast.success('Job created');
    } catch { toast.error('Failed to create job'); } finally { setLoading(false); }
  };

  const handleUpdateJob = async (updatedJob) => {
    try {
      setLoading(true); await jobAPI.updateJob(updatedJob.id, updatedJob);
      await fetchJobs();
      setSelectedJob(null);
      setIsEditMode(false);
      setActiveTab('jobs');
      toast.success('Job updated');
    }
    catch { toast.error('Failed to update job'); }
    finally { setLoading(false); }
  };

  const handleTechSkillAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); const skill = e.target.value.trim();
      if (skill) {
        const currentSkills = (selectedJob && isEditMode ? selectedJob.skills : newJob.skills) || '';
        const skillArray = currentSkills.split(',').map(s => s.trim()).filter(s => s);
        if (!skillArray.includes(skill)) {
          const updatedSkills = [...skillArray, skill].join(', ');
          if (selectedJob && isEditMode) setSelectedJob({ ...selectedJob, skills: updatedSkills });
          else setNewJob({ ...newJob, skills: updatedSkills });
        } e.target.value = '';
      }
    }
  };

  const removeTechSkill = (index) => {
    const currentSkills = (selectedJob && isEditMode ? selectedJob.skills : newJob.skills) || '';
    const skillArray = currentSkills.split(',').map(s => s.trim()).filter(s => s);
    skillArray.splice(index, 1); const updatedSkills = skillArray.join(', ');
    if (selectedJob && isEditMode) setSelectedJob({ ...selectedJob, skills: updatedSkills });
    else setNewJob({ ...newJob, skills: updatedSkills });
  };

  const calculateStatistics = () => {
    const totalTrainees = allTrainees.length, totalJobs = jobs.length;
    const mappedTrainees = allTrainees.filter((t) => t.isMapped).length, unmappedTrainees = allTrainees.filter((t) => !t.isMapped).length;
    const activeJobs = jobs.filter((j) => j.status === 'active').length, filledPositions = jobs.reduce((sum, job) => sum + (job.filled || 0), 0), totalOpenings = jobs.reduce((sum, job) => sum + (job.openings || 0), 0);
    const fillRate = totalOpenings ? Math.round((filledPositions / totalOpenings) * 100) : 0;
    return { totalTrainees, totalJobs, mappedTrainees, unmappedTrainees, activeJobs, filledPositions, totalOpenings, fillRate };
  };
  const stats = calculateStatistics();

  const fetchInterviewLocks = async () => {
    try {
      setLoading(true); let url = '/interview-locks/';
      const params = new URLSearchParams(); if (selectedBatch)
        params.append('batch', selectedBatch);
      if (lockFilter.status) params.append('status', lockFilter.status);
      if (lockFilter.job) params.append('job', lockFilter.job); if (params.toString()) url += '?' + params.toString(); setInterviewLocks((await api.get(url)).data);
    } catch { toast.error('Failed to fetch interview locks'); } finally { setLoading(false); }
  };
  const fetchLockStats = async () => {
    try {
      setLockStats((await api.get(`/interview-locks/dashboard/${getBatchParam()}`)).data);
    } catch { }
  };
  const fetchDashboardAnalytics = async () => {
    try {
      const params = new URLSearchParams(); if (selectedBatch)
        params.append('batch', selectedBatch); const res = await api.get(`/dashboard/analytics/${params.toString() ? `?${params.toString()}` : ''}`);
      setDashboardAnalytics(res.data);
      setTotalMatchesCount((res.data.match_breakdown?.perfect_match || 0) + (res.data.match_breakdown?.skill_only || 0) + (res.data.match_breakdown?.location_only || 0));
    }
    catch { }
  };
  const fetchCourses = async () => {
    try { setCourses((await api.get('/courses/')).data || []); } catch { }
  };
  const fetchNotifications = async () => {
    try {
      setNotifications((await api.get('/notifications/')).data || []);
    } catch { }
  };
  const fetchFeedbackRecords = async () => {
    try {
      const query = feedbackSearch ? `?search=${encodeURIComponent(feedbackSearch)}` : ''; setFeedbackRecords((await api.get(`/interview-feedback/${query}`)).data || []);
    }
    catch { toast.error('Failed to load interview feedback'); }
  };
  const fetchAuditLogs = async () => { try { setAuditLogs((await api.get('/audit-logs/')).data || []); } catch { } };

  // ==================== Download Helpers ====================
  const createPasswordProtectedExcel = async (data, sheetName, password) => {
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0); sheet.name(sheetName);
    for (let i = 0; i < data.length; i++) for (let j = 0; j < data[i].length; j++) sheet.cell(i + 1, j + 1).value(data[i][j]);
    data[0]?.forEach((_, colIndex) => { sheet.column(colIndex + 1).width(20); });
    return await workbook.outputAsync({ password: password, type: 'blob' });
  };

  const parseCSVToArray = (csvText) => { const lines = csvText.trim().split(/\r?\n/); return lines.map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())); };

  const requestDownload = (type, params = {}) => { setPendingDownload({ type, params }); setShowPrivacyModal(true); setPrivacyAgreed(false); setDownloadPassword(''); };

  const executeDownload = async () => {
    if (!privacyAgreed) { toast.error('You must agree to the privacy policy'); return; }
    if (downloadPassword !== 'Tcs#12345') { toast.error('Incorrect password'); setDownloadPassword(''); return; }
    setShowPrivacyModal(false);
    const { type, params } = pendingDownload;
    try {
      let data = null, filename = '', sheetName = '';
      if (type === 'search') { data = await getFilteredSearchData(); filename = `job_matches_${selectedJobForSearch?.title || 'search'}.xlsx`; sheetName = 'Matches'; }
      else if (type === 'lock-report') { const url = `/interview-locks/report/${params.status ? `?status=${params.status}${selectedBatch ? `&batch=${selectedBatch}` : ''}` : `${selectedBatch ? `?batch=${selectedBatch}` : ''}`}`; const response = await api.get(url, { responseType: 'blob' }); data = parseCSVToArray(await response.data.text()); filename = `interview_locks${params.status ? '_' + params.status : ''}.xlsx`; sheetName = `Locks${params.status ? `_${params.status}` : ''}`; }
      else if (type === 'report') { const url = `/reports/${params.reportType}/${getBatchParam()}`; const response = await api.get(url, { responseType: 'blob' }); data = parseCSVToArray(await response.data.text()); filename = `${params.reportType}_report.xlsx`; sheetName = `${params.reportType.charAt(0).toUpperCase() + params.reportType.slice(1)}`; }
      else if (type === 'selected') { data = [['Trainee Name', 'Project', 'Source', 'Interviewer', 'Interview Date', 'Feedback']]; selectedCandidates.forEach(c => data.push([c.trainee_name, c.job_title || c.projectName, c.source, c.assigned_to_name || (c.source === 'Direct' ? 'HR Direct' : '-'), c.interview_datetime ? new Date(c.interview_datetime).toLocaleString() : '-', c.feedback ? 'Yes' : '-'])); filename = 'selected_candidates.xlsx'; sheetName = 'Selected'; }
      else if (type === 'rejected') { data = [['Trainee Name', 'Job', 'Interviewer', 'Interview Date', 'Feedback']]; rejectedLocks.forEach(lock => data.push([lock.trainee_name, lock.job_title, lock.assigned_to_name || '-', new Date(lock.interview_datetime).toLocaleString(), lock.feedback ? 'Yes' : '-'])); filename = 'rejected_candidates.xlsx'; sheetName = 'Rejected'; }
      else if (type === 'feedback') { data = [['Interviewer', 'Candidate', 'Rating', 'Feedback', 'Recommendation', 'Interview Date']]; feedbackRecords.forEach(fb => data.push([fb.interviewer_name || '', fb.trainee_name || '', fb.attitude_rating || '', fb.overall_comments || fb.behaviour_notes || '', fb.recommendation || '', fb.interview_date ? new Date(fb.interview_date).toLocaleString() : ''])); filename = 'interview_feedback.xlsx'; sheetName = 'Feedback'; }
      else if (type === 'recommendations') { data = [['Trainee Name', 'Employee ID', 'Email', 'Job Title', 'Demand ID', 'Status']]; recommendations.forEach(rec => data.push([rec.trainee_name || rec.trainee_id, rec.trainee_employee_id || rec.trainee_id, rec.trainee_email || (rec.trainee_employee_id ? `${rec.trainee_employee_id}@tcs.com` : rec.trainee_id), rec.job_title, rec.demand_id || '', rec.status])); filename = `recommendations_${selectedRecJobId || 'all'}.xlsx`; sheetName = 'Recommendations'; }
      if (!data || data.length === 0) { toast.error('No data to download'); return; }
      const excelBlob = await createPasswordProtectedExcel(data, sheetName, downloadPassword);
      const downloadUrl = window.URL.createObjectURL(excelBlob);
      const a = document.createElement('a'); a.href = downloadUrl; a.download = filename; document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(downloadUrl); document.body.removeChild(a);
      toast.success('Download started. File is password-protected.');
    } catch (err) { toast.error('Failed to generate download'); }
  };

  const downloadReport = async (reportType) => { requestDownload('report', { reportType }); };

  const fetchInterviewers = async () => { try { setInterviewers((await api.get('/users/?role=interviewer')).data); } catch { toast.error('Failed to load interviewers'); } };

  const fetchSelectedCandidates = async () => {
    try {
      const [locksRes, traineesRes] = await Promise.all([api.get(`/interview-locks/?status=selected${selectedBatch ? `&batch=${selectedBatch}` : ''}`), Promise.resolve(allTrainees)]);
      const interviewSelected = locksRes.data;
      const directMapped = traineesRes.filter(t => t.isMapped);
      setSelectedCandidates([...interviewSelected.map(lock => ({ ...lock, source: 'Interview', trainee_id: lock.trainee_id, name: lock.trainee_name, projectName: lock.job_title, lock_id: lock.id })), ...directMapped.map(t => ({ trainee_id: t.userId, trainee_name: t.name, job_title: t.projectName, assigned_to_name: 'HR Direct', interview_datetime: null, feedback: null, source: 'Direct' }))]);
    } catch { toast.error('Failed to fetch selected candidates'); }
  };

  const fetchRejectedLocks = async () => { try { setRejectedLocks((await api.get(`/interview-locks/?status=rejected${selectedBatch ? `&batch=${selectedBatch}` : ''}`)).data); } catch { toast.error('Failed to fetch rejected candidates'); } };

  const handleLockForInterview = async () => {
    if (selectedTraineeIds.length === 0) { toast.error('Select at least one trainee'); return; }
    if (!lockInterviewDatetime) { toast.error('Select interview date and time'); return; }
    const selectedDate = new Date(lockInterviewDatetime);
    if (selectedDate <= new Date()) { toast.error('Interview date must be in the future'); return; }
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) { toast.error('Weekends are not allowed'); return; }
    if (!assignedToId) { toast.error('Select an interviewer'); return; }
    try {
      setLoading(true);
      await api.post('/interview-locks/bulk_create/', { trainee_ids: selectedTraineeIds.map(id => String(id)), job_id: selectedJob.id, interview_datetime: lockInterviewDatetime, comments: lockComments, assigned_to: assignedToId });
      toast.success(`Locked ${selectedTraineeIds.length} trainee(s)`);
      setShowLockModal(false); setSelectedTraineeIds([]); setLockInterviewDatetime(''); setLockComments(''); setAssignedToId('');
      await refreshCurrentView();
    } catch { toast.error('Failed to lock trainees'); } finally { setLoading(false); }
  };

  const handleCancelSelected = async (lockId) => { try { await api.patch(`/interview-locks/${lockId}/`, { status: 'cancelled' }); toast.success('Selection cancelled'); fetchSelectedCandidates(); fetchInterviewLocks(); } catch { toast.error('Failed to cancel selection'); } };

  const handleUnlockInterview = async (lock) => { if (!window.confirm('Unlock this candidate?')) return; try { setLoading(true); await api.post(`/interview-locks/${lock.id}/unlock/`, { reopen: true }); toast.success('Candidate unlocked'); await Promise.all([fetchInterviewLocks(), fetchJobs()]); } catch { toast.error('Failed to unlock'); } finally { setLoading(false); } };


  const filteredSearchMatches = () => {
    if (!searchJobMatches) return [];
    const allMatches = [...(searchJobMatches.perfect_match || []), ...(searchJobMatches.skills_only || []), ...(searchJobMatches.location_only || []), ...(searchJobMatches.nearby || []), ...(searchJobMatches.no_match || [])];
    return allMatches.filter(m => {
      if (searchFilters.bucket && m.bucket !== searchFilters.bucket) return false;
      if (searchFilters.location && !m.trainee_location?.toLowerCase().includes(searchFilters.location.toLowerCase())) return false;
      if (searchFilters.minTotal > 0 && m.total_percentage < searchFilters.minTotal) return false;
      if (searchFilters.skillKeyword) { const skills = normalizeMatchedSkills(m.matched_skills); if (!skills.some(s => s.toLowerCase().includes(searchFilters.skillKeyword.toLowerCase()))) return false; }
      return true;
    });
  };

  const handleLocationAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const loc = e.target.value.trim();
      if (loc) {
        const currentLocs = (selectedJob && isEditMode ? selectedJob.location : newJob.location) || '';
        const locArray = currentLocs.split(',').map(l => l.trim()).filter(l => l);
        if (!locArray.includes(loc)) {
          const updatedLocs = [...locArray, loc].join(', ');
          if (selectedJob && isEditMode) setSelectedJob({ ...selectedJob, location: updatedLocs });
          else setNewJob({ ...newJob, location: updatedLocs });
        }
        e.target.value = '';
      }
    }
  };

  const removeLocation = (index) => {
    const currentLocs = (selectedJob && isEditMode ? selectedJob.location : newJob.location) || '';
    const locArray = currentLocs.split(',').map(l => l.trim()).filter(l => l);
    locArray.splice(index, 1);
    const updatedLocs = locArray.join(', ');
    if (selectedJob && isEditMode) setSelectedJob({ ...selectedJob, location: updatedLocs });
    else setNewJob({ ...newJob, location: updatedLocs });
  };

  const getFilteredSearchData = async () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => { const trainee = findTraineeByUserId(getMatchTraineeUserId(m)); return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch.id.toString()); });
    if (filtered.length === 0) throw new Error('No data');
    return [['Trainee Name', 'Location', 'Bucket', 'Skills %', 'Location %', 'Total %', 'Matched Skills'], ...filtered.map(m => [m.trainee_name, m.trainee_location || '', m.bucket === 'NEARBY' ? 'Proximity' : m.bucket.replace('_', ' '), m.skills_percentage, m.location_percentage, m.total_percentage, normalizeMatchedSkills(m.matched_skills).join('; ')])];
  };

  const handleSelectAllSearch = () => {
    const filtered = filteredSearchMatches().filter(m => { const trainee = findTraineeByUserId(getMatchTraineeUserId(m)); return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch.id.toString()); });
    if (selectAll) setSelectedSearchTraineeIds([]); else setSelectedSearchTraineeIds(filtered.map(m => getMatchTraineeUserId(m)));
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
      await api.post('/interview-locks/bulk_create/', { trainee_ids: selectedSearchTraineeIds.map(id => String(id)), job_id: selectedJobForSearch.id, interview_datetime: lockInterviewDatetime, comments: lockComments, assigned_to: assignedToId });
      toast.success(`Locked ${selectedSearchTraineeIds.length} trainee(s)`);
      setShowLockModal(false); setSelectedSearchTraineeIds([]); setSelectAll(false); setLockInterviewDatetime(''); setLockComments(''); setAssignedToId('');
      await handleJobSelectForSearch(selectedJobForSearch.id);
    } catch { toast.error('Failed to lock trainees'); } finally { setLoading(false); }
  };

  const handleCreateInterviewer = async () => {
    if (!newInterviewer.username) { toast.error('Username required'); return; }
    if (!newInterviewer.email.endsWith('@tcs.com')) { toast.error('Email must end with @tcs.com'); return; }
    if (!newInterviewer.access_start || !newInterviewer.access_end) { toast.error('Access start and end are required'); return; }
    try { await api.post('/users/create-interviewer/', newInterviewer); toast.success('Interviewer created'); setShowCreateInterviewerModal(false); fetchInterviewers(); } catch { toast.error('Failed to create interviewer'); }
  };

  const runMatchingEngine = async (jobId = '') => {
    try {
      setLoading(true); await api.post('/run-matching/', { job_id: jobId });
      toast.success('Matching engine triggered');
      if (jobId) fetchJobMatches(jobId);
      else fetchJobs();
    } catch { toast.error('Failed to trigger matching engine'); }
    finally { setLoading(false); }
  };

  const handleNotify = (jobId) => {
    setNotifyJobId(jobId); setNotifyCount(10); setShowNotifyModal(true);
  };

  const executeNotify = async () => {
    try {
      setLoading(true);
      const matchRes = await api.get(`/matches/${notifyJobId}/${getBatchParam()}`);
      const totalMatches = matchRes.data.total_matches || 0;
      if (totalMatches === 0) { toast.error('No trainees available'); setShowNotifyModal(false); return; }
      const countToSend = Math.max(1, Math.min(50, Number(notifyCount) || 10));
      if (countToSend > totalMatches) {
        if (!window.confirm(`Only ${totalMatches} trainees are available. Send ${totalMatches}?`)) return;
        await api.post(`/jobs/${notifyJobId}/notify-owners/`, { count: totalMatches });
      } else { await api.post(`/jobs/${notifyJobId}/notify-owners/`, { count: countToSend }); }
      toast.success('Course owners notified');
      setShowNotifyModal(false); fetchJobs();
      if (activeTab === 'recommendations') fetchRecommendations();
    } catch { toast.error('Failed to notify'); } finally { setLoading(false); }
  };

  const fetchRecommendations = async () => {
    try { setLoading(true); const params = new URLSearchParams(); if (selectedRecJobId) params.append('job_id', selectedRecJobId); if (recStatusFilter) params.append('status', recStatusFilter); if (selectedBatch) params.append('batch', selectedBatch); setRecommendations((await api.get(`/hr/recommendations/?${params.toString()}`)).data); }
    catch { toast.error('Failed to load recommendations'); } finally { setLoading(false); }
  };

  const fetchDemandSupplyAnalysis = async () => {
    setLoading(true);
    try {
      const [jobsRes, traineesRes] = await Promise.all([api.get(`/jobs/${getBatchParam()}`), api.get(`/api/profiles/${getBatchParam()}`)]);
      const jobsList = Array.isArray(jobsRes.data) ? jobsRes.data : [];
      const traineesList = Array.isArray(traineesRes.data) ? traineesRes.data : [];
      const skillDemand = {}, locationDemand = {}, courseDemand = {};
      jobsList.forEach(job => { (job.skills || '').split(',').map(s => s.trim()).filter(Boolean).forEach(skill => { skillDemand[skill] = (skillDemand[skill] || 0) + (job.openings || 1); }); const locations = Array.isArray(job.location) ? job.location : (job.location || '').split(',').map(l => l.trim()); locations.forEach(loc => { if (loc) locationDemand[loc] = (locationDemand[loc] || 0) + 1; }); if (job.course_name) courseDemand[job.course_name] = (courseDemand[job.course_name] || 0) + (job.openings || 1); });
      const skillSupply = {}, locationSupply = {}, courseSupply = {}; let totalTrainees = 0, mappedCount = 0;
      traineesList.forEach(trainee => { totalTrainees++; const userInfo = trainee.userInfo || {}; if (userInfo.isMapped) mappedCount++; (trainee.strengths || []).forEach(s => { const skill = s.courseName || s; skillSupply[skill] = (skillSupply[skill] || 0) + 1; }); if (userInfo.location) locationSupply[userInfo.location.trim()] = (locationSupply[userInfo.location.trim()] || 0) + 1; if (userInfo.course_name) courseSupply[userInfo.course_name] = (courseSupply[userInfo.course_name] || 0) + 1; });
      const allSkills = new Set([...Object.keys(skillDemand), ...Object.keys(skillSupply)]);
      const skillGaps = []; allSkills.forEach(skill => { const d = skillDemand[skill] || 0, s = skillSupply[skill] || 0, gap = d - s, gp = d > 0 ? ((gap / d) * 100).toFixed(1) : 0, fr = d > 0 ? ((s / d) * 100).toFixed(1) : 100; skillGaps.push({ skill, demand: d, supply: s, gap, gapPercent: parseFloat(gp), fillRate: parseFloat(fr), status: gap <= 0 ? 'Surplus' : gp < 25 ? 'Adequate' : gp < 50 ? 'Shortage' : 'Critical' }); });
      skillGaps.sort((a, b) => b.gap - a.gap);
      const locAnalysis = []; new Set([...Object.keys(locationDemand), ...Object.keys(locationSupply)]).forEach(loc => locAnalysis.push({ location: loc, demand: locationDemand[loc] || 0, supply: locationSupply[loc] || 0, gap: (locationDemand[loc] || 0) - (locationSupply[loc] || 0) })); locAnalysis.sort((a, b) => b.gap - a.gap);
      setDsAnalysis({ summary: { totalJobs: jobsList.length, activeJobs: jobsList.filter(j => j.status === 'active').length, totalOpenings: jobsList.reduce((sum, j) => sum + (j.openings || 0), 0), totalFilled: jobsList.reduce((sum, j) => sum + (j.filled || 0), 0), totalTrainees, mappedCount, unmappedCount: totalTrainees - mappedCount, fillRate: totalTrainees > 0 ? ((mappedCount / totalTrainees) * 100).toFixed(1) : 0 }, skillGaps: skillGaps.slice(0, 20), locationAnalysis: locAnalysis.slice(0, 15), courseAnalysis: Object.keys(courseDemand).map(c => ({ course: c, demand: courseDemand[c] || 0, supply: courseSupply[c] || 0, gap: (courseDemand[c] || 0) - (courseSupply[c] || 0) })) });
    } catch { toast.error('Failed to load analysis'); } finally { setLoading(false); }
  };

  // ==================== Bulk & Upload Operations ====================
  const downloadInterviewLockTemplate = async () => {
    try {
      const res = await api.get('/jobs/download-interview-lock-template/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'interview_lock_template.xlsx';
      a.click();
    } catch { toast.error('Download failed'); }
  };
  const handleBulkLockUpload = async () => {
    if (!bulkLockFile) return; const fd = new FormData();
    fd.append('file', bulkLockFile); try {
      setLoading(true);
      const res = await api.post('/jobs/bulk-interview-lock/', fd);
      toast.success(`Locked ${res.data.created} trainees`);
      setBulkLockFile(null); setShowBulkLockModal(false); fetchInterviewLocks();
    }
    catch { toast.error('Upload failed'); } finally { setLoading(false); }
  };
  const downloadStatusUpdateTemplate = async () => {
    try {
      const res = await api.get('/jobs/download-status-update-template/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'status_update_template.xlsx';
      a.click();
    } catch { toast.error('Download failed'); }
  };
  const handleBulkStatusUpload = async () => {
    if (!bulkStatusFile)
      return; const fd = new FormData(); fd.append('file', bulkStatusFile);
    try {
      setLoading(true); const res = await api.post('/jobs/bulk-status-update/', fd);
      if (res.data.success) toast.success(res.data.message);
      else toast.warning(res.data.message);
      setBulkStatusFile(null); setShowBulkStatusModal(false);
      await fetchInterviewLocks(); await fetchJobs();
    }
    catch { toast.error('Upload failed'); } finally { setLoading(false); }
  };
  const downloadBulkMappingTemplate = async () => {
    try {
      const res = await api.get('/jobs/download-bulk-mapping-template/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'bulk_mapping_template.xlsx';
      a.click();
    } catch { toast.error('Download failed'); }
  };
  const handleBulkMappingUpload = async () => {
    if (!bulkMappingFile)
      return; const fd = new FormData(); fd.append('file', bulkMappingFile);
    fd.append('batch', selectedBatch); try {
      setLoading(true); const res = await api.post('/jobs/bulk-mapping/', fd);
      if (res.data.success) toast.success(res.data.message); else toast.warning(res.data.message); setBulkMappingFile(null);
      setShowBulkMappingModal(false); await fetchTrainees(); await fetchJobs();
    } catch {
      toast.error('Upload failed');

    } finally { setLoading(false); }
  };
  const handleBulkInterviewerUpload = async () => {
    if (!bulkInterviewerFile)
      return; const fd = new FormData(); fd.append('file', bulkInterviewerFile);
    try {
      setLoading(true); const res = await api.post('/users/bulk-create-interviewers/', fd);
      toast.success(`Created ${res.data.created} interviewers`);
      setBulkInterviewerFile(null);
      setShowBulkInterviewerModal(false);
      fetchInterviewers();
    } catch { toast.error('Upload failed'); } finally { setLoading(false); }
  };

  const handlePrefLocUpload = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try {
      setLoading(true); const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/users/upload-preferred-locations/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.updated > 0)
        toast.success(`Updated ${res.data.updated} trainees`);
      setShowPrefLocModal(false);
    } catch { toast.error('Upload failed'); } finally {
      setLoading(false); event.target.value = '';
    }
  };

  const downloadPrefLocTemplate = () => {
    XlsxPopulate.fromBlankAsync().then(wb => {
      const s = wb.sheet(0); s.name("Preferred Locations");
      s.cell(1, 1).value("Employee ID");
      s.cell(1, 2).value("Preferred Location 1");
      s.cell(1, 3).value("Preferred Location 2");
      s.cell(1, 4).value("Preferred Location 3");
      s.range(1, 1, 1, 4).style('bold', true).style('fill', '2563eb').style('fontColor', 'ffffff');
      s.cell(2, 1).value("EMP001"); s.cell(2, 2).value("Bangalore");
      s.cell(2, 3).value("Chennai");
      s.cell(2, 4).value("Hyderabad");
      s.column(1).width(15);
      s.column(2).width(20);
      s.column(3).width(20);
      s.column(4).width(20);
      return wb.outputAsync();
    }).then(blob => {
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = u;
      a.download = 'preferred_locations_template.xlsx';
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(u);
      document.body.removeChild(a); toast.success('Template downloaded');
    }).catch(() => toast.error('Download failed'));
  };

  const downloadHRSummaryPDF = async () => {
    try {
      const res = await api.get(`/reports/hr-summary-pdf/${getBatchParam()}`, { responseType: 'blob' });
      const u = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = u; a.download = `hr_summary_${selectedBatch || 'all'}.pdf`; document.body.appendChild(a);
      a.click(); URL.revokeObjectURL(u); document.body.removeChild(a);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  // ==================== Refresh & Backup ====================
  const refreshCurrentView = async () => { setLastRefresh(new Date()); if (activeTab === 'dashboard') await Promise.all([fetchJobs(), fetchTrainees(), fetchInterviewLocks(), fetchLockStats()]); else if (activeTab === 'talentSearch' && selectedJobForSearch) await handleJobSelectForSearch(selectedJobForSearch.id); else if (activeTab === 'recommendations') await fetchRecommendations(); else if (activeTab === 'demandSupply') await fetchDemandSupplyAnalysis(); else await Promise.all([fetchJobs(), fetchTrainees()]); toast.success('Data refreshed'); };
  const backupData = async () => { try { setBackupInProgress(true); const res = await api.get('/backup/', { responseType: 'blob' }); const u = URL.createObjectURL(new Blob([res.data], { type: 'application/json' })); const a = document.createElement('a'); a.href = u; a.download = `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(u); document.body.removeChild(a); toast.success('Backup created'); } catch { toast.error('Backup failed'); } finally { setBackupInProgress(false); } };
  const restoreBackup = async () => { if (!restoreFile) return; if (!window.confirm('Restore backup? This may overwrite existing data.')) return; const fd = new FormData(); fd.append('file', restoreFile); try { setLoading(true); await api.post('/restore/', fd); toast.success('Restore completed'); setRestoreFile(null); await refreshCurrentView(); } catch { toast.error('Restore failed'); } finally { setLoading(false); } };

  // ==================== Effects ====================
  useEffect(() => { fetchFullTraineeListForBatches(); fetchCoursesList(); fetchCourses(); fetchNotifications(); }, []);
  useEffect(() => { if (['dashboard', 'trainees', 'mapped', 'unmapped', 'openPool', 'interviewLocks'].includes(activeTab)) fetchTrainees(); }, [activeTab, selectedBatch]);
  useEffect(() => { if (['dashboard', 'jobs', 'createJob', 'talentSearch'].includes(activeTab)) fetchJobs(); }, [activeTab, selectedBatch]);
  useEffect(() => { if (allTrainees.length && activeTab === 'openPool') checkTraineesForOpenPool(); }, [allTrainees, activeTab, selectedBatch]);
  useEffect(() => { setSkillTrends(computeSkillTrends(jobs)); }, [jobs]);
  useEffect(() => { if (activeTab === 'dashboard') { fetchLockStats(); fetchDashboardAnalytics(); } }, [activeTab, jobs, selectedBatch]);
  useEffect(() => { if (activeTab === 'feedback') fetchFeedbackRecords(); if (activeTab === 'audit') fetchAuditLogs(); }, [activeTab, feedbackSearch]);
  useEffect(() => { let f = [...allTrainees]; if (searchQuery) f = f.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()) || t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))); if (locationFilter) f = f.filter(t => t.location.toLowerCase().includes(locationFilter.toLowerCase())); if (activeTab === 'mapped') f = f.filter(t => t.isMapped); else if (activeTab === 'unmapped') f = f.filter(t => !t.isMapped); else if (activeTab === 'openPool') { const ids = traineesWithNoMatches.map(t => t.id || t.trainee_id); f = f.filter(t => !t.isMapped && ids.includes(t.id)); } setTrainees(f); }, [searchQuery, locationFilter, activeTab, allTrainees, traineesWithNoMatches]);
  useEffect(() => { if (activeTab === 'interviewLocks') { fetchInterviewLocks(); fetchLockStats(); } }, [activeTab, lockFilter, selectedBatch]);
  useEffect(() => { if (activeTab === 'selected') fetchSelectedCandidates(); if (activeTab === 'rejected') fetchRejectedLocks(); }, [activeTab, allTrainees, selectedBatch]);
  useEffect(() => { if (activeTab === 'recommendations') fetchRecommendations(); }, [activeTab, selectedRecJobId, recStatusFilter, selectedBatch]);
  useEffect(() => { if (activeTab === 'demandSupply') fetchDemandSupplyAnalysis(); }, [activeTab, dsFilter, selectedBatch]);
  useEffect(() => { let interval; if (autoRefresh && activeTab === 'talentSearch' && selectedJobForSearch) interval = setInterval(() => handleJobSelectForSearch(selectedJobForSearch.id), 30000); return () => { if (interval) clearInterval(interval); }; }, [autoRefresh, activeTab, selectedJobForSearch, selectedBatch]);
  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    fetchJobs?.();
    fetchTrainees?.();
    fetchInterviewLocks?.();
    fetchLockStats?.();
    fetchDashboardAnalytics?.();
    fetchDemandSupplyAnalysis?.();
    // optional / heavier — throttle if needed:
    // fetchRecommendations?.();
  }, [activeTab, selectedBatch]);
  const computeSkillTrends = (jobs) => {
    const techMap = new Map(), softMap = new Map();
    for (const job of jobs || []) {
      const openings = Number(job?.openings ?? 0), filled = Number(job?.filled ?? 0), matches = Number(job?.matches ?? 0);
      const unfilled = Math.max(0, openings - filled);
      const weight = 1 + openings * 0.5 + matches * 0.25 + unfilled * 0.3;
      (job?.techSkills || []).forEach(raw => { const skill = normalizeSkill(raw); if (!skill) return; const cur = techMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 }; techMap.set(skill, { jobs: cur.jobs + 1, openings: cur.openings + openings, matches: cur.matches + matches, demand: cur.demand + weight }); });
    }
    const toSorted = (map) => { const arr = Array.from(map.entries()).map(([n, s]) => ({ name: n, jobs: s.jobs, openings: s.openings, matches: s.matches, demandRaw: s.demand })); const max = Math.max(...arr.map(a => a.demandRaw), 1); return arr.map(a => ({ ...a, demand: Math.round((a.demandRaw / max) * 100) })).sort((a, b) => b.demand - a.demand).slice(0, 5); };
    return { tech: toSorted(techMap), soft: toSorted(softMap) };
  };
  // ==================== RENDER FUNCTIONS ====================

  const renderDashboard = () => {
    const nearbyCount =
      bucketDistribution?.NEARBY ??
      dashboardAnalytics?.match_breakdown?.nearby ??
      0;

    const perfectCount =
      bucketDistribution?.PERFECT_MATCH ??
      dashboardAnalytics?.match_breakdown?.perfect_match ??
      0;

    const skillGapCount =
      dsAnalysis?.skillGaps?.filter((s) => Number(s.gap) > 0).length ?? null;

    const lockedCount = lockStats?.total_locked ?? 0;
    const selectedCount = lockStats?.total_selected ?? 0;
    const rejectedCount = lockStats?.total_rejected ?? 0;

    const matchBreakdownData = [
      { name: 'Perfect', value: perfectCount },
      {
        name: 'Skills',
        value:
          dashboardAnalytics?.match_breakdown?.skill_only ??
          bucketDistribution?.SKILLS_ONLY ??
          0,
      },
      {
        name: 'Location',
        value:
          dashboardAnalytics?.match_breakdown?.location_only ??
          bucketDistribution?.LOCATION_ONLY ??
          0,
      },
      { name: 'Proximity', value: nearbyCount },
    ].filter((d) => d.value > 0);

    const topSkillGaps = (dsAnalysis?.skillGaps || []).slice(0, 8);
    const locationDemand = (dashboardAnalytics?.location_demand || []).slice(0, 8);

    const queue = buildActionQueue();

    const health = {
      fill: stats.fillRate,
      unmapped: stats.unmappedTrainees,
      locked: lockStats?.total_locked ?? 0,
      pendingRec: (recommendations || []).filter((r) => r.status === 'Pending').length,
      criticalGaps: (dsAnalysis?.skillGaps || []).filter(
        (s) => s.status === 'Critical' || s.status === 'Shortage'
      ).length,
    };

    return (
      <div className="bento-dashboard">
        {/* ── Header ── */}
        <div className="section-header" style={{ marginBottom: '0.75rem' }}>
          <div className="header-title">
            <h2>
              <LayoutDashboard size={22} /> Operations Overview
            </h2>
            <p className="subtitle">
              Click any metric to explore. Batch: {selectedBatch || 'All'}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={refreshCurrentView}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (!dsAnalysis) fetchDemandSupplyAnalysis();
                setActiveTab('demandSupply');
              }}
            >
              <TrendingUp size={16} /> Full Demand-Supply
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('talentSearch')}
            >
              <Search size={16} /> Talent Search
            </button>
          </div>
        </div>

        {/* ── Clickable KPI row ── */}
        <div className="bento-stats">
          <ClickableStatCard
            label="Total Trainees"
            value={stats.totalTrainees}
            sub={`${stats.mappedTrainees} mapped`}
            icon={Users}
            tone="info"
            onClick={() => setActiveTab('trainees')}
          />
          <ClickableStatCard
            label="Mapped"
            value={stats.mappedTrainees}
            sub={`${stats.fillRate}% of openings`}
            icon={CheckCircle}
            tone="success"
            onClick={openMappedDrill}
          />
          <ClickableStatCard
            label="Unmapped"
            value={stats.unmappedTrainees}
            sub="Ready to assign"
            icon={Users}
            tone="warning"
            onClick={openUnmappedDrill}
          />
          <ClickableStatCard
            label="Active Jobs"
            value={stats.activeJobs}
            sub={`${stats.totalOpenings - stats.filledPositions} openings left`}
            icon={Briefcase}
            tone="info"
            onClick={() => setActiveTab('jobs')}
          />
          <ClickableStatCard
            label="Fill Rate"
            value={`${stats.fillRate}%`}
            sub={`${stats.filledPositions}/${stats.totalOpenings}`}
            icon={Target}
            tone={
              stats.fillRate >= 70
                ? 'success'
                : stats.fillRate >= 40
                  ? 'warning'
                  : 'danger'
            }
            onClick={openMappedDrill}
          />
          <ClickableStatCard
            label="Perfect Match"
            value={perfectCount}
            sub="Skills + location"
            icon={Star}
            tone="success"
            onClick={() => setActiveTab('talentSearch')}
          />
          <ClickableStatCard
            label="Proximity"
            value={nearbyCount}
            sub="Nearby locations"
            icon={MapPin}
            tone="info"
            onClick={openProximityDrill}
          />
          <ClickableStatCard
            label="Skill Gaps"
            value={skillGapCount != null ? skillGapCount : '—'}
            sub="Critical shortages"
            icon={AlertCircle}
            tone="danger"
            onClick={() => {
              if (!dsAnalysis) {
                fetchDemandSupplyAnalysis();
                toast.info('Loading skill gaps… click again in a moment');
              } else {
                openSkillGapDrill();
              }
            }}
          />
          <ClickableStatCard
            label="Interview Locks"
            value={lockedCount}
            sub={`${selectedCount} selected · ${rejectedCount} rejected`}
            icon={Lock}
            tone="info"
            onClick={() => setActiveTab('interviewLocks')}
          />
          <ClickableStatCard
            label="Open Pool"
            value={traineesWithNoMatches.length}
            sub="No job match"
            icon={XCircle}
            tone="warning"
            onClick={() => setActiveTab('openPool')}
          />
        </div>

        {/* ── Health strip ── */}
        <p
          className="text-muted"
          style={{ fontSize: '0.8rem', margin: '0.35rem 0 0.75rem' }}
        >
          Fill {health.fill}% · Unmapped {health.unmapped} · Locks {health.locked}
          {health.pendingRec > 0 ? ` · ${health.pendingRec} recs pending` : ''}
          {health.criticalGaps > 0
            ? ` · ${health.criticalGaps} critical skills`
            : ''}
        </p>

        {/* ── Action queue ── */}
        <div className="bento-panel" style={{ marginBottom: '0.75rem' }}>
          <div className="bento-panel-header">
            <h3>
              <Zap size={16} /> Action queue ({queue.length})
            </h3>
          </div>
          <div className="bento-panel-body">
            {queue.length === 0 ? (
              <p style={{ margin: 0, fontWeight: 600, color: '#059669' }}>
                No urgent actions — pipeline looks healthy.
              </p>
            ) : (
              <div className="drill-group-list">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="drill-group-row"
                    style={{ gridTemplateColumns: '1fr auto' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        <span
                          className={`badge badge-${item.severity === 'high'
                              ? 'danger'
                              : item.severity === 'medium'
                                ? 'warning'
                                : 'neutral'
                            }`}
                          style={{ marginRight: 8 }}
                        >
                          {item.severity}
                        </span>
                        {item.title}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: '0.8rem', marginTop: 2 }}
                      >
                        {item.detail}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={item.onAction}
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bento panels ── */}
        <div className="bento-grid" style={{ marginTop: '0.75rem' }}>
          {/* Match mix */}
          <div className="bento-panel">
            <div className="bento-panel-header">
              <h3>
                <BarChart2 size={16} /> Match mix
              </h3>
              <button
                className="btn-ghost btn-sm"
                onClick={() => setActiveTab('talentSearch')}
              >
                Open search
              </button>
            </div>
            <div className="bento-panel-body">
              {matchBreakdownData.length === 0 ? (
                <p className="no-data" style={{ padding: '1rem' }}>
                  No match data yet. Run matching on jobs.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart
                    data={matchBreakdownData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0070C0" radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top skill gaps */}
          <div className="bento-panel">
            <div className="bento-panel-header">
              <h3>
                <AlertCircle size={16} /> Top skill gaps
              </h3>
              <button
                className="btn-ghost btn-sm"
                onClick={() => {
                  if (!dsAnalysis) fetchDemandSupplyAnalysis();
                  else openSkillGapDrill();
                }}
              >
                Drill down
              </button>
            </div>
            <div className="bento-panel-body">
              {topSkillGaps.length === 0 ? (
                <p className="no-data" style={{ padding: '1rem' }}>
                  No gap data. Click “Drill down” or open Demand-Supply.
                </p>
              ) : (
                <div className="drill-group-list">
                  {topSkillGaps.map((s) => (
                    <div key={s.skill} className="drill-group-row">
                      <span style={{ fontWeight: 600 }}>{s.skill}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.min(100, Math.abs(s.gapPercent || 0))}%`,
                            background: s.gap > 0 ? '#ef4444' : '#10b981',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: s.gap > 0 ? '#dc2626' : '#059669',
                        }}
                      >
                        {s.gap > 0 ? `-${s.gap}` : `+${Math.abs(s.gap)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location demand */}
          <div className="bento-panel">
            <div className="bento-panel-header">
              <h3>
                <MapPin size={16} /> Location demand
              </h3>
            </div>
            <div className="bento-panel-body">
              {locationDemand.length === 0 ? (
                <p className="no-data" style={{ padding: '1rem' }}>
                  No location analytics yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart
                    data={locationDemand}
                    margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#5F68C3" radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bento-panel">
            <div className="bento-panel-header">
              <h3>
                <Activity size={16} /> Recent activity
              </h3>
            </div>
            <div className="bento-panel-body">
              {recentActivity.length === 0 ? (
                <p className="no-data" style={{ padding: '1rem' }}>
                  No recent actions yet.
                </p>
              ) : (
                <ul className="activity-list" style={{ margin: 0 }}>
                  {recentActivity.slice(0, 8).map((a, i) => (
                    <li
                      key={i}
                      className="activity-item"
                      style={{
                        gridTemplateColumns: '90px 1fr auto',
                        gap: '0.75rem',
                        padding: '0.65rem 0.5rem',
                      }}
                    >
                      <span
                        className={`activity-type ${String(a.type || '')
                            .toLowerCase()
                            .includes('map')
                            ? 'match'
                            : 'lock'
                          }`}
                      >
                        {a.type}
                      </span>
                      <span
                        className="activity-detail"
                        style={{ fontSize: '0.85rem' }}
                      >
                        {a.trainee} → {a.job}
                      </span>
                      <span
                        className="activity-time"
                        style={{ fontSize: '0.75rem' }}
                      >
                        {a.time}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick ops ── */}
        <div
          className="section-header"
          style={{
            marginTop: '0.75rem',
            marginBottom: 0,
            padding: '0.85rem 1rem',
          }}
        >
          <div className="header-title">
            <h2 style={{ fontSize: '0.95rem' }}>
              <Zap size={18} /> Quick operations
            </h2>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowExcelTemplate(true)}
            >
              <FileSpreadsheet size={14} /> Job Excel
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowWordTemplate(true)}
            >
              <File size={14} /> Job Word
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowBulkMappingModal(true)}
            >
              <Link size={14} /> Bulk map
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowBulkLockModal(true)}
            >
              <Lock size={14} /> Bulk lock
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPrefLocModal(true)}
            >
              <MapPin size={14} /> Pref. locations
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('recommendations')}
            >
              <ThumbsUp size={14} /> Recommendations
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('audit')}
            >
              <Shield size={14} /> Audit
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderJobManagement = () => (
    <div className="job-management">
      <div className="section-header">
        <div className="header-title"><h2><Briefcase size={24} /> Job Profiles</h2><p className="subtitle">Manage all job positions and bulk operations</p></div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading}><RefreshCw size={18} className={loading ? 'spinning' : ''} /> Refresh</button>
          <button className="btn btn-secondary" onClick={backupData} disabled={backupInProgress}><Database size={18} /> Backup</button>
          <button className="btn btn-secondary" onClick={() => setShowCreateInterviewerModal(true)} disabled={loading}><User size={18} /> Create Interviewer</button>
          <button className="btn btn-secondary" onClick={() => setShowBulkInterviewerModal(true)} disabled={loading}><Upload size={18} /> Bulk Interviewers</button>
          <div className="upload-buttons">
            <button className="btn btn-success" onClick={() => setShowExcelTemplate(true)} disabled={loading}><FileSpreadsheet size={18} /> Import Excel</button>
            <button className="btn btn-primary" onClick={() => setShowWordTemplate(true)} disabled={loading}><File size={18} /> Import Word</button>
            <button className="btn btn-warning" onClick={() => setShowPrefLocModal(true)} disabled={loading} title="Upload Preferred Locations"><MapPin size={18} /> Upload Locations</button>
          </div>
          <button className="btn btn-primary btn-cta" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('createJob'); }} disabled={loading}><Plus size={18} /> Create New Job</button>
          <div className="dropdown" style={{ position: 'relative' }}>
            <button className="btn btn-secondary dropdown-toggle" onClick={() => setBulkOpsOpen(!bulkOpsOpen)}><UploadCloud size={18} /> Bulk Ops <ChevronDown size={16} /></button>
            {bulkOpsOpen && (<div className="dropdown-menu"><button className="dropdown-item" onClick={() => { setShowBulkLockModal(true); setBulkOpsOpen(false); }}><Lock size={14} /> Bulk Interview Lock</button><button className="dropdown-item" onClick={() => { setShowBulkStatusModal(true); setBulkOpsOpen(false); }}><CheckCircle size={14} /> Bulk Status Update</button><button className="dropdown-item" onClick={() => { setShowBulkMappingModal(true); setBulkOpsOpen(false); }}><Link size={14} /> Bulk Mapping</button><button className="dropdown-item" onClick={() => downloadHRSummaryPDF()}><Download size={14} /> Download PDF Report</button></div>)}
          </div>
        </div>
      </div>
      {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading jobs...</p></div>}
      {error && <div className="error-message"><AlertCircle size={20} /><span>{error}</span></div>}
      {jobs.length === 0 && !loading && !error && (<div className="no-data"><Briefcase size={48} /><h3>No Jobs Found</h3></div>)}
      {jobs.length > 0 && (<div className="table-container"><table className="data-table"><thead><tr><th>Job Title</th><th>Department</th><th>Location(s)</th><th>Batch</th><th>Openings</th><th>Filled</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>{jobs.map((job) => { const remaining = Math.max(0, job.openings - job.filled); return (<tr key={job.id}><td><div className="job-title-cell"><div className="job-icon"><BriefcaseBusiness size={16} /></div><span className="font-medium">{job.project_name}</span></div></td><td><div className="department-cell"><Building size={14} />{job.department}</div></td><td><div className="location-cell"><MapPin size={14} />{Array.isArray(job.location) ? job.location.join(', ') : job.location}</div></td><td>{job.batch_name || '-'}</td><td className="openings-cell">{job.openings}</td><td className={`filled-cell ${job.filled === job.openings ? 'filled-complete' : ''}`}>{job.filled}</td><td className="remaining-cell">{remaining}</td><td><button className={`status-button ${job.status === 'active' ? 'status-active' : 'status-inactive'}`} onClick={() => toggleJobStatus(job.id)} disabled={loading}>{job.status === 'active' ? <><CheckCircle size={12} /> Active</> : <><X size={12} /> Inactive</>}</button></td><td><div className="action-buttons"><button className="btn-icon btn-icon-view" onClick={() => handleViewJobDetails(job)} title="View"><Eye size={16} /></button><button className="btn-icon btn-icon-edit" onClick={() => { setSelectedJob(job); setIsEditMode(true); setActiveTab('createJob'); }} title="Edit"><Edit size={16} /></button><button className="btn-icon btn-icon-delete" onClick={() => handleDeleteJob(job.id)} title="Delete"><Trash2 size={16} /></button><button className="btn-icon btn-icon-match" onClick={() => runMatchingEngine(job.id)} title="Generate Matches"><Sparkles size={16} /></button><button className="btn-icon btn-icon-notify" onClick={() => handleNotify(job.id)} title="Notify Course Owner"><Megaphone size={16} /></button></div></td></tr>); })}</tbody></table></div>)}
    </div>
  );

  const renderCreateJob = () => {
    const jobToEdit = selectedJob || newJob;
    const isEditing = !!selectedJob && isEditMode;
    const handleSubmit = async (e) => { e.preventDefault(); if (isEditing) await handleUpdateJob(jobToEdit); else await handleCreateJob(); };
    return (
      <div className="create-job">
        <div className="section-header"><div className="header-title"><h2>{isEditing ? <><Edit size={24} /> Edit Job Profile</> : <><Plus size={24} /> Create New Job Profile</>}</h2></div><button className="btn btn-secondary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('jobs'); }} disabled={loading}><ArrowLeft size={18} /> Back to Jobs</button></div>
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div></div>}
        <div className="form-card"><form onSubmit={handleSubmit}>
          <div className="form-section"><h3 className="form-section-title"><Briefcase size={20} /> Basic Information</h3>
            <div className="form-row"><div className="form-group"><label><span className="required">*</span> Project Name</label><input type="text" className="form-control" value={jobToEdit.project_name} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, project_name: e.target.value }) : setNewJob({ ...newJob, project_name: e.target.value })} required /></div>
              <div className="form-group">
                <label><span className="required">*</span> Location</label>
                <div className="skills-input">
                  <input type="text" className="form-control" placeholder="Type location and press Enter or comma" onKeyDown={handleLocationAdd} disabled={loading} />
                  <div className="skills-tags">
                    {(isEditing ? (jobToEdit.location || '').split(',').map(l => l.trim()).filter(l => l) : (newJob.location || '').split(',').map(l => l.trim()).filter(l => l)).map((loc, index) => (
                      <span key={index} className="skill-tag location-tag">{loc}<button type="button" className="tag-remove" onClick={() => removeLocation(index)} disabled={loading}><X size={12} /></button></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row"><div className="form-group"><label><span className="required">*</span> Demand ID</label><input type="text" className="form-control" value={jobToEdit.demand_id || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, demand_id: e.target.value }) : setNewJob({ ...newJob, demand_id: e.target.value })} required /></div>
              <div className="form-group"><label>BG</label><input type="text" className="form-control" value={jobToEdit.bg || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, bg: e.target.value }) : setNewJob({ ...newJob, bg: e.target.value })} /></div></div>
            <div className="form-row"><div className="form-group"><label>ISU/HSU</label><input type="text" className="form-control" value={jobToEdit.isu_hsu || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, isu_hsu: e.target.value }) : setNewJob({ ...newJob, isu_hsu: e.target.value })} /></div>
              <div className="form-group"><label>Stream</label><input type="text" className="form-control" value={jobToEdit.stream || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, stream: e.target.value }) : setNewJob({ ...newJob, stream: e.target.value })} /></div></div>
            <div className="form-row"><div className="form-group"><label>Role</label><input type="text" className="form-control" value={jobToEdit.role || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, role: e.target.value }) : setNewJob({ ...newJob, role: e.target.value })} /></div>
              <div className="form-group"><label>SPOC Name</label><input type="text" className="form-control" value={jobToEdit.spoc_name || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, spoc_name: e.target.value }) : setNewJob({ ...newJob, spoc_name: e.target.value })} /></div></div>
            <div className="form-row"><div className="form-group"><label>SPOC Emp ID</label><input type="text" className="form-control" value={jobToEdit.spoc_emp_id || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, spoc_emp_id: e.target.value }) : setNewJob({ ...newJob, spoc_emp_id: e.target.value })} /></div>
              <div className="form-group"><label>RMG Head</label><input type="text" className="form-control" value={jobToEdit.rmg_head || ''} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, rmg_head: e.target.value }) : setNewJob({ ...newJob, rmg_head: e.target.value })} /></div></div>
            <div className="form-row"><div className="form-group"><label>Visibility</label><select className="form-control" value={jobToEdit.is_public ? 'public' : 'private'} onChange={(e) => { const val = e.target.value === 'public'; if (isEditing) setSelectedJob({ ...jobToEdit, is_public: val }); else setNewJob({ ...newJob, is_public: val }); }}><option value="public">Public</option><option value="private">Private</option></select></div>
              <div className="form-group"><label>Course</label><select className="form-control" value={jobToEdit.course || ''} onChange={(e) => { const val = e.target.value ? parseInt(e.target.value) : ''; if (isEditing) setSelectedJob({ ...jobToEdit, course: val }); else setNewJob({ ...newJob, course: val }); }}><option value="">-- Select Course --</option>{coursesList.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}</select></div></div>
            <div className="form-group"><label><span className="required">*</span> Openings</label><input type="number" className="form-control" value={jobToEdit.openings} onChange={(e) => { const val = parseInt(e.target.value) || 1; if (isEditing) setSelectedJob({ ...jobToEdit, openings: val }); else setNewJob({ ...newJob, openings: val }); }} min="1" required /></div>
          </div>
          <div className="form-section"><h3 className="form-section-title"><BookOpen size={20} /> Skills</h3>
            <div className="form-group"><label><span className="required">*</span> Skills</label>
              <div className="skills-input"><input type="text" className="form-control" placeholder="Type skill and press Enter" onKeyDown={handleTechSkillAdd} />
                <div className="skills-tags">{(isEditing ? (jobToEdit.skills || '').split(',').map(s => s.trim()).filter(s => s) : (newJob.skills || '').split(',').map(s => s.trim()).filter(s => s)).map((skill, index) => (<span key={index} className="skill-tag tech-tag">{skill}<button type="button" className="tag-remove" onClick={() => removeTechSkill(index)}><X size={12} /></button></span>))}</div>
              </div>
            </div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('jobs'); }}>Cancel</button><button type="submit" className="btn btn-primary">{isEditing ? <><Check size={18} /> Update Job</> : <><Plus size={18} /> Create Job</>}</button></div>
        </form></div>
      </div>
    );
  };

  const renderTraineesList = () => {
    const uniqueLocations = [...new Set(allTrainees.map((t) => t.location).filter((loc) => loc))];
    const openPoolCount = traineesWithNoMatches.length;
    const indexOfLast = traineePage * traineesPerPage;
    const indexOfFirst = indexOfLast - traineesPerPage;
    const currentTrainees = trainees.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(trainees.length / traineesPerPage);
    return (
      <div className="trainees-list">
        <div className="section-header"><div className="header-title"><h2><Users size={24} /> Trainee Talent</h2></div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={refreshCurrentView} disabled={loading}><RefreshCw size={18} /> Refresh</button>
            <div className="view-options">
              <button className={`btn-view-option ${activeTab === 'trainees' ? 'active' : ''}`} onClick={() => setActiveTab('trainees')}>All</button>
              <button className={`btn-view-option ${activeTab === 'mapped' ? 'active' : ''}`} onClick={() => setActiveTab('mapped')}><CheckCircle size={16} /> Mapped ({stats.mappedTrainees})</button>
              <button className={`btn-view-option ${activeTab === 'unmapped' ? 'active' : ''}`} onClick={() => setActiveTab('unmapped')}><AlertCircle size={16} /> Unmapped ({stats.unmappedTrainees})</button>
              <button className={`btn-view-option ${activeTab === 'openPool' ? 'active' : ''}`} onClick={() => setActiveTab('openPool')}><Users2 size={16} /> Open Pool ({openPoolCount})</button>
            </div>
            <div className="download-buttons"><button className="btn btn-success" onClick={() => downloadReport('mapped')}><Download size={16} /> Mapped</button><button className="btn btn-danger" onClick={() => downloadReport('unmapped')}><Download size={16} /> Unmapped</button></div>
          </div>
        </div>
        <div className="search-filter"><div className="search-box"><input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div><div className="filter-group"><select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><option value="">All Locations</option>{uniqueLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}</select></div></div>
        {trainees.length === 0 ? (<div className="no-data"><Users size={48} /><h3>No Trainees Found</h3></div>) : (
          <><div className="table-container">
            <table className="data-table">

              <thead>
                <tr>

                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Batch</th>
                  <th>Skills</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Actions</th></tr>
              </thead>

              <tbody>{
                currentTrainees.map(
                  (trainee) => (<tr key={trainee.id}><td><div className="trainee-name-cell">
                    <div className="trainee-avatar-small">{trainee.name.charAt(0)}</div><span>{trainee.name}</span>
                  </div>
                  </td><td>{trainee.email}</td>
                    <td>
                      <div className="skills-cell">
                        {trainee.preferredLocation1 && <span className="skill-tag-small">{trainee.preferredLocation1}</span>}
                        {trainee.preferredLocation2 && <span className="skill-tag-small">{trainee.preferredLocation2}</span>}
                        {trainee.preferredLocation3 && <span className="skill-tag-small">{trainee.preferredLocation3}</span>}
                        {!trainee.preferredLocation1 && !trainee.preferredLocation2 && !trainee.preferredLocation3 && (
                          <span className="skill-tag-small">{trainee.location}</span>
                        )}
                      </div>
                    </td>
                    <td>{trainee.batch_name || '-'}</td>
                    <td><div className="skills-cell">{trainee.skills.slice(0, 3).map(skill => <span key={skill} className="skill-tag-small">{skill}</span>)}{trainee.skills.length > 3 && <span className="more-skills">+{trainee.skills.length - 3}</span>}</div>
                    </td><td><div className="score-cell"><div className="mini-progress"><div className="mini-fill" style={{ width: `${trainee.score}%` }} />
                    </div><span>{trainee.score}%</span></div></td><td><span className={`status-badge ${trainee.isMapped ? 'status-mapped' : 'status-unmapped'}`}>{trainee.isMapped ? 'Mapped' : 'Unmapped'}</span>
                    </td><td><button className="btn-icon btn-icon-view" onClick={() => handleViewTraineeProfile(trainee)}><Eye size={16} />
                    </button></td></tr>))}</tbody>
            </table></div>{totalPages > 1 && (<div className="pagination">
              <button disabled={traineePage === 1} onClick={() => setTraineePage(p => p - 1)}>&lt;</button>
              <span>Page {traineePage} of {totalPages}</span>
              <button disabled={traineePage === totalPages} onClick={() => setTraineePage(p => p + 1)}>&gt;</button></div>)}</>
        )}
      </div>
    );
  };


  const renderTraineeModal = () => { if (!selectedTrainee) return null; const traineeData = selectedTrainee.traineeData || selectedTrainee; const userInfo = traineeData.userInfo || {}; return (<div className="modal-overlay" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}><div className="modal-content trainee-profile-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><div className="modal-title"><User size={24} /><h2>{userInfo.name || selectedTrainee.name}</h2></div><button className="modal-close" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}><X size={24} /></button></div><div className="modal-body"><div className="profile-header"><div className="profile-avatar">{selectedTrainee.name.charAt(0)}</div><div className="profile-info"><h3>{userInfo.name || selectedTrainee.name}</h3><div className="profile-meta"><span><MapPin size={16} /> {userInfo.location || selectedTrainee.location}</span><span><Mail size={16} /> {selectedTrainee.email}</span><span><Target size={16} /> Score: {userInfo.averageScore || selectedTrainee.score}%</span></div></div></div><div className="skills-section"><h4>Strengths</h4><div className="skills-list">{traineeData.strengths?.map((s, i) => <span key={i} className="skill-tag tech-tag">{s.courseName} ({s.avgScore}%)</span>) || <span className="no-data">None</span>}</div><h4>Weaknesses</h4><div className="skills-list">{traineeData.weaknesses?.map((w, i) => <span key={i} className="skill-tag soft-tag">{w.courseName} ({w.avgScore}%)</span>) || <span className="no-data">None</span>}</div></div></div><div className="modal-footer"><button className="btn-secondary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>Close</button></div></div></div>); };

  const renderInterviewLocks = () => (<div className="interview-locks"><div className="section-header"><div className="header-title"><h2><Lock size={24} /> Interview Locks</h2></div><div className="header-actions"><button className="btn btn-secondary" onClick={() => requestDownload('lock-report', {})}><Download size={18} /> All Locks</button></div></div>{lockStats && (<div className="stats-grid small"><div className="stat-card"><div className="stat-icon"><Lock size={20} /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.total_locked}</div></div></div><div className="stat-card"><div className="stat-icon"><CheckCircle size={20} /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.total_selected}</div></div></div><div className="stat-card"><div className="stat-icon"><XCircle size={20} /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.total_rejected}</div></div></div></div>)}<div className="table-container"><table className="data-table"><thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Date/Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>{interviewLocks.map(lock => (<tr key={lock.id}><td>{lock.trainee_name}</td><td>{lock.job_title}</td><td>{lock.assigned_to_name || '-'}</td><td>{new Date(lock.interview_datetime).toLocaleString()}</td><td><span className={`status-badge status-${lock.status}`}>{lock.status}</span></td><td><button className="btn-icon btn-warning" onClick={() => handleUnlockInterview(lock)}><RefreshCw size={16} /></button></td></tr>))}</tbody></table></div></div>);

  const renderSelected = () => (<div className="selected-tab"><div className="section-header"><div className="header-title"><h2><CheckCircle size={24} /> Selected Candidates</h2></div><button className="btn btn-success" onClick={() => requestDownload('selected')}><Download size={18} /> Download All</button></div><div className="table-container"><table className="data-table"><thead><tr><th>Trainee</th><th>Project</th><th>Source</th><th>Actions</th></tr></thead><tbody>{selectedCandidates.map((c, idx) => (<tr key={c.trainee_id || idx}><td>{c.trainee_name}</td><td>{c.job_title || c.projectName}</td><td><span className={`source-badge source-${c.source === 'Interview' ? 'interview' : 'direct'}`}>{c.source}</span></td><td><button className="btn-icon btn-danger" onClick={() => { if (c.lock_id) handleCancelSelected(c.lock_id); else { const trainee = findTraineeByUserId(c.trainee_id); if (trainee && trainee.isMapped) handleUnmapFromProject(trainee); } }}><X size={16} /></button></td></tr>))}</tbody></table></div></div>);

  const renderRejected = () => (<div className="rejected-tab"><div className="section-header"><div className="header-title"><h2><XCircle size={24} /> Rejected Candidates</h2></div><button className="btn btn-danger" onClick={() => requestDownload('rejected')}><Download size={18} /> Download All</button></div><div className="table-container"><table className="data-table"><thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Actions</th></tr></thead><tbody>{rejectedLocks.map(lock => (<tr key={lock.id}><td>{lock.trainee_name}</td><td>{lock.job_title}</td><td>{lock.assigned_to_name || '-'}</td><td><button className="btn-icon btn-warning" onClick={() => handleCancelSelected(lock.id)}><X size={16} /></button></td></tr>))}</tbody></table></div></div>);

  const renderFeedbackList = () => (<div className="feedback-tab"><div className="section-header"><div className="header-title"><h2><MessageSquare size={24} /> Interview Feedback</h2></div></div><div className="table-container"><table className="data-table"><thead><tr><th>Interviewer</th><th>Candidate</th><th>Rating</th><th>Recommendation</th></tr></thead><tbody>{feedbackRecords.map(fb => (<tr key={fb.id}><td>{fb.interviewer_name || '-'}</td><td>{fb.trainee_name || '-'}</td><td>{fb.attitude_rating}/5</td><td><span className={`status-badge status-${fb.recommendation}`}>{fb.recommendation}</span></td></tr>))}</tbody></table></div></div>);

  const renderAuditTrail = () => (<div className="audit-tab"><div className="section-header"><div className="header-title"><h2><Shield size={24} /> Audit Trail</h2></div></div><div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead><tbody>{auditLogs.map(log => (<tr key={log.id}><td>{log.user_name || '-'}</td><td>{log.action}</td><td>{log.entity_type} #{log.entity_id}</td><td>{new Date(log.timestamp).toLocaleString()}</td></tr>))}</tbody></table></div></div>);


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
        <div className="search-job-selector">
          <label>Select Job:</label>
          <select className="form-control" value={selectedJobForSearch?.id || ''} onChange={(e) => handleJobSelectForSearch(e.target.value)} style={{ maxWidth: '400px' }}>
            <option value="">-- Choose a job --</option>
            {jobs.filter(job => job.status === 'active' && getRemainingOpenings(job) > 0).map(job => (
              <option key={job.id} value={job.id}>{job.project_name} (Openings: {getRemainingOpenings(job)})</option>
            ))}
          </select>
        </div>
        {selectedJobForSearch && (
          <>
            <div className="filters-panel">
              <div className="filter-group">
                <label>Bucket</label>
                <select className="filter-select" value={searchFilters.bucket} onChange={(e) => setSearchFilters({ ...searchFilters, bucket: e.target.value })}>
                  <option value="">All Buckets</option>
                  <option value="PERFECT_MATCH">Perfect Match</option>
                  <option value="SKILLS_ONLY">Skills Only</option>
                  <option value="LOCATION_ONLY">Location Only</option>
                  <option value="NEARBY">Proximity</option>
                  <option value="NO_MATCH">No Match</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Location</label>
                <input type="text" className="form-control" placeholder="Filter by location" value={searchFilters.location} onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })} />
              </div>
              <div className="filter-group">
                <label>Min Total %</label>
                <input type="number" className="form-control" min="0" max="100" value={searchFilters.minTotal} onChange={(e) => setSearchFilters({ ...searchFilters, minTotal: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="filter-group">
                <label>Skill Keyword</label>
                <input type="text" className="form-control" placeholder="e.g., React" value={searchFilters.skillKeyword} onChange={(e) => setSearchFilters({ ...searchFilters, skillKeyword: e.target.value })} />
              </div>
              <div className="filter-group align-end">
                <button className="btn-icon" onClick={() => setSearchFilters({ bucket: '', location: '', minTotal: 0, skillKeyword: '' })}><X size={18} /> Clear</button>
              </div>
            </div>
            <div className="table-actions">
              <div>
                <input type="checkbox" checked={selectAll && filtered.length > 0 && filtered.every(m => selectedSearchTraineeIds.includes(getMatchTraineeUserId(m)))} onChange={handleSelectAllSearch} disabled={!jobHasOpenings} />
                <span>Select All ({filtered.length} matches)</span>
                {!jobHasOpenings && <span className="warning-text">(No openings left)</span>}
              </div>
              <div className="action-buttons">
                <button className="btn btn-primary" onClick={() => { setSelectedTraineeIds(selectedSearchTraineeIds); setSelectedJob(selectedJobForSearch); fetchInterviewers(); setShowLockModal(true); }} disabled={selectedSearchTraineeIds.length === 0 || !jobHasOpenings}>
                  <Lock size={18} /> Lock Selected ({selectedSearchTraineeIds.length})
                </button>
                <button className="btn btn-secondary" onClick={() => requestDownload('search')} disabled={filtered.length === 0}>
                  <Download size={18} /> Download Filtered
                </button>
              </div>
            </div>
            {jobMatchesLoading ? (
              <div className="loading-overlay"><div className="loading-spinner"></div></div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Trainee Name</th>
                      <th>Pref. Locations</th>
                      <th>Bucket</th>
                      <th>Matched Loc</th>
                      <th>Skills %</th>
                      <th>Loc %</th>
                      <th>Total %</th>
                      <th>Matched Skills</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((match) => {
                      const disabled = !jobHasOpenings;
                      const traineeUserId = getMatchTraineeUserId(match);
                      const trainee = findTraineeByUserId(traineeUserId);
                      const preferredLocs = trainee ? [
                        trainee.preferredLocation1,
                        trainee.preferredLocation2,
                        trainee.preferredLocation3
                      ].filter(Boolean) : [];

                      return (
                        <tr key={traineeUserId || match.id}>
                          <td>
                            <input type="checkbox" checked={selectedSearchTraineeIds.includes(traineeUserId)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSearchTraineeIds([...selectedSearchTraineeIds, traineeUserId]);
                                else setSelectedSearchTraineeIds(selectedSearchTraineeIds.filter(pid => pid !== traineeUserId));
                              }} disabled={disabled || !traineeUserId} />
                          </td>
                          <td><span className="font-medium">{match.trainee_name}</span></td>
                          <td>
                            <div className="skills-cell">
                              {preferredLocs.length > 0 ? (
                                preferredLocs.map((loc, i) => <span key={i} className="skill-tag-small">{loc}</span>)
                              ) : (
                                <span className="skill-tag-small">{match.trainee_location}</span>
                              )}
                            </div>
                          </td>
                          <td><span className={`bucket-tag ${match.bucket?.toLowerCase()}`}>{match.bucket === 'NEARBY' ? 'Proximity' : match.bucket?.replace('_', ' ')}</span></td>
                          <td>{match.matched_location || '—'}</td>
                          <td>{Number(match.skills_percentage || 0).toFixed(1)}%</td>
                          <td>{Number(match.location_percentage || 0).toFixed(1)}%</td>
                          <td><strong>{Number(match.total_percentage || 0).toFixed(1)}%</strong></td>
                          <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={normalizeMatchedSkills(match.matched_skills).join(', ')}>
                            {(() => { const skills = normalizeMatchedSkills(match.matched_skills); return skills.length > 0 ? skills.join(', ') : '-'; })()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon btn-icon-view" onClick={() => handleViewTraineeProfileFromJob(match)} title="View Profile"><User size={16} /></button>
                              <button className="btn-icon btn-icon-map" onClick={() => { if (!jobHasOpenings) { toast.error('No openings left'); return; } handleMapToProject(match, selectedJobForSearch); }} disabled={!jobHasOpenings || !traineeUserId} title="Map to Project"><Link size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan="10" className="no-data">No matches match your filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderRecommendations = () => (
    <div className="recommendations-tab">
      <div className="section-header"><div className="header-title"><h2><ThumbsUp size={24} /> Recommendations</h2></div>
        <div className="header-actions">
          <select className="filter-select" value={selectedRecJobId} onChange={(e) => setSelectedRecJobId(e.target.value)}><option value="">All Jobs</option>{jobs.filter(j => j.recommendation_status !== 'not_requested').map(job => <option key={job.id} value={job.id}>{job.project_name} ({job.demand_id})</option>)}</select>
          <select className="filter-select" value={recStatusFilter} onChange={(e) => setRecStatusFilter(e.target.value)}><option value="">All Status</option><option value="Pending">Pending</option><option value="Accepted">Accepted</option><option value="Rejected">Rejected</option></select>
          <button className="btn btn-secondary" onClick={() => requestDownload('recommendations')} disabled={recommendations.length === 0}><Download size={18} /> Download</button>
        </div>
      </div>
      <div className="table-container"><table className="data-table"><thead><tr><th>Trainee Name</th><th>Employee ID</th><th>Email</th><th>Job Title</th><th>Demand ID</th><th>Status</th><th>Actions</th></tr></thead><tbody>{recommendations.map(rec => (<tr key={rec.id}><td>{rec.trainee_name || '—'}</td><td>{rec.trainee_employee_id || rec.trainee_id}</td><td>{rec.trainee_email || `${rec.trainee_employee_id || rec.trainee_id}@tcs.com`}</td><td>{rec.job_title}</td><td>{rec.demand_id || '—'}</td><td><span className={`status-badge status-${rec.status.toLowerCase()}`}>{rec.status}</span></td><td><button className="btn-icon btn-icon-view" onClick={() => { const trainee = findTraineeByUserId(rec.trainee_id); if (trainee) handleViewTraineeProfile(trainee); }}><Eye size={16} /></button></td></tr>))}{recommendations.length === 0 && <tr><td colSpan="7" className="no-data">No recommendations found</td></tr>}</tbody></table></div>
    </div>
  );

  const renderDemandSupplyAnalysis = () => {
    const analysis = dsAnalysis;
    if (!analysis) return (<div className="loading-overlay"><div className="loading-spinner"></div><p>Loading demand-supply analysis...</p></div>);
    const { summary, skillGaps, locationAnalysis, courseAnalysis } = analysis;
    const criticalSkills = skillGaps.filter(s => s.status === 'Critical' || s.status === 'Shortage').slice(0, 10);
    const topGapSkills = skillGaps.slice(0, 10);
    const locationData = locationAnalysis.slice(0, 10);
    return (
      <div className="demand-supply-tab">
        <div className="section-header"><div className="header-title"><h2><TrendingUp size={24} /> Demand-Supply Analysis</h2><p className="subtitle">Comprehensive skill gap and resource allocation insights</p></div><div className="header-actions"><button className="btn btn-secondary" onClick={fetchDemandSupplyAnalysis}><RefreshCw size={18} /> Refresh</button></div></div>
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card"><div className="stat-icon" style={{ color: '#3b82f6' }}><BriefcaseBusiness size={20} /></div><div className="stat-content"><h3>Total Demand (Openings)</h3><div className="stat-value">{summary.totalOpenings}</div><small>{summary.activeJobs} active jobs</small></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ color: '#10b981' }}><Users size={20} /></div><div className="stat-content"><h3>Total Supply (Trainees)</h3><div className="stat-value">{summary.totalTrainees}</div><small>{summary.mappedCount} mapped ({summary.fillRate}%)</small></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ color: '#f59e0b' }}><Target size={20} /></div><div className="stat-content"><h3>Filled Positions</h3><div className="stat-value">{summary.totalFilled}</div><small>{summary.totalOpenings - summary.totalFilled} remaining</small></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ color: '#ef4444' }}><AlertCircle size={20} /></div><div className="stat-content"><h3>Unmapped Trainees</h3><div className="stat-value">{summary.unmappedCount}</div><small>Available for assignment</small></div></div>
        </div>
        <div className="chart-grid" style={{ marginBottom: '2rem' }}>
          <div className="analytics-card chart-card"><h3>Top 10 Skill Gaps (Demand vs Supply)</h3><ResponsiveContainer width="100%" height={350}><ReBarChart data={topGapSkills} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="skill" width={90} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="demand" fill="#3b82f6" name="Demand" /><Bar dataKey="supply" fill="#10b981" name="Supply" /></ReBarChart></ResponsiveContainer></div>
          <div className="analytics-card chart-card"><h3>Location-wise Demand vs Supply</h3><ResponsiveContainer width="100%" height={350}><ReBarChart data={locationData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="location" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Legend /><Bar dataKey="demand" fill="#3b82f6" name="Demand" /><Bar dataKey="supply" fill="#10b981" name="Supply" /></ReBarChart></ResponsiveContainer></div>
        </div>
        {criticalSkills.length > 0 && (
          <div className="alert-section" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}><AlertCircle size={20} /> Critical Skill Shortages</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>{criticalSkills.map(skill => (<div key={skill.skill} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}><div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{skill.skill}</div><div style={{ fontSize: '0.85rem', color: '#666' }}>Demand: <strong>{skill.demand}</strong> | Supply: <strong>{skill.supply}</strong></div><div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>Gap: {skill.gap} ({skill.gapPercent}%)</div></div>))}</div>
          </div>
        )}
        <div className="content-card" style={{ marginBottom: '2rem' }}><div className="card-header"><h3>Complete Skill Gap Analysis</h3><span className="badge-outline">{skillGaps.length} skills analyzed</span></div><div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}><table className="data-table"><thead><tr><th>Skill</th><th>Demand</th><th>Supply</th><th>Gap</th><th>Fill Rate</th><th>Status</th></tr></thead><tbody>{skillGaps.map(skill => (<tr key={skill.skill}><td><strong>{skill.skill}</strong></td><td>{skill.demand}</td><td>{skill.supply}</td><td style={{ color: skill.gap > 0 ? '#dc2626' : '#10b981', fontWeight: 600 }}>{skill.gap > 0 ? `-${skill.gap}` : `+${Math.abs(skill.gap)}`}</td><td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="mini-progress" style={{ width: '80px' }}><div className="mini-fill" style={{ width: `${Math.min(skill.fillRate, 100)}%`, background: skill.fillRate >= 80 ? '#10b981' : skill.fillRate >= 50 ? '#f59e0b' : '#ef4444' }} /></div><span>{skill.fillRate}%</span></div></td><td><span className={`status-badge status-${skill.status.toLowerCase()}`}>{skill.status}</span></td></tr>))}</tbody></table></div></div>
        {courseAnalysis.length > 0 && (<div className="content-card"><div className="card-header"><h3>Course-wise Demand-Supply</h3></div><div className="table-container"><table className="data-table"><thead><tr><th>Course</th><th>Demand</th><th>Supply</th><th>Gap</th><th>Status</th></tr></thead><tbody>{courseAnalysis.map(course => (<tr key={course.course}><td><strong>{course.course}</strong></td><td>{course.demand}</td><td>{course.supply}</td><td style={{ color: course.gap > 0 ? '#dc2626' : '#10b981', fontWeight: 600 }}>{course.gap > 0 ? `-${course.gap}` : `+${Math.abs(course.gap)}`}</td><td><span className={`status-badge ${course.gap <= 0 ? 'status-accepted' : course.gap < 5 ? 'status-pending' : 'status-rejected'}`}>{course.gap <= 0 ? 'Sufficient' : course.gap < 5 ? 'Adequate' : 'Shortage'}</span></td></tr>))}</tbody></table></div></div>)}
      </div>
    );
  };

  const renderJobDetailsModal = () => {
    if (!showJobDetailsModal || !jobDetailsJob) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowJobDetailsModal(false)}>
        <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2><Briefcase size={24} /> {jobDetailsJob.project_name}</h2>
            <button className="modal-close" onClick={() => setShowJobDetailsModal(false)}><X /></button>
          </div>
          <div className="modal-tabs">
            <button className={jobDetailsTab === 'overview' ? 'active' : ''} onClick={() => setJobDetailsTab('overview')}>Overview</button>
            <button className={jobDetailsTab === 'mapped' ? 'active' : ''} onClick={() => setJobDetailsTab('mapped')}>Mapped ({mappedTrainees.length})</button>
            <button className={jobDetailsTab === 'rejected' ? 'active' : ''} onClick={() => setJobDetailsTab('rejected')}>Rejected ({rejectedTrainees.length})</button>
          </div>
          <div className="modal-body">
            {jobDetailsTab === 'overview' && (
              <div className="job-details">
                <p><strong>Department:</strong> {getJobDepartment(jobDetailsJob)}</p>
                <p><strong>Location(s):</strong> {Array.isArray(jobDetailsJob.location) ? jobDetailsJob.location.join(', ') : jobDetailsJob.location}</p>
                <p><strong>Openings:</strong> {jobDetailsJob.openings} ({jobDetailsJob.filled} filled)</p>
                <p><strong>Status:</strong> <span className={`status-badge status-${jobDetailsJob.status}`}>{jobDetailsJob.status}</span></p>
              </div>
            )}
            {jobDetailsTab === 'mapped' && (
              <div>
                {mappedTrainees.length === 0 ? (
                  <p className="no-data">No trainees mapped.</p>
                ) : (
                  <div className="trainee-list">
                    {mappedTrainees.map(t => (
                      <div key={t.id} className="trainee-item">
                        <User size={18} />
                        <span>{t.name}</span>
                        <button className="btn-icon" onClick={() => { setSelectedTrainee(t); setShowJobDetailsModal(false); fetchTraineeMatches(t.id); }}>
                          <Eye size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {jobDetailsTab === 'rejected' && (
              <div>
                {rejectedTrainees.length === 0 ? (
                  <p className="no-data">No rejected trainees.</p>
                ) : (
                  <div className="trainee-list">
                    {rejectedTrainees.map(lock => (
                      <div key={lock.id} className="trainee-item">
                        <User size={18} />
                        <span>{lock.trainee_name}</span>
                        {lock.feedback && (
                          <button className="btn-icon" onClick={() => setViewingFeedback(lock.feedback)}>
                            <FileText size={16} />
                          </button>
                        )}
                        <button className="btn-icon" onClick={() => {
                          const trainee = allTrainees.find(t => t.id === lock.trainee);
                          if (trainee) { setSelectedTrainee(trainee); setShowJobDetailsModal(false); fetchTraineeMatches(trainee.id); }
                        }}>
                          <Eye size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowJobDetailsModal(false)}>Close</button>
          </div>
        </div>
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
              <p>By downloading this file, you agree to comply with data privacy policy.</p>
              <p className="mt-2"><strong>Note:</strong> File is password‑protected.</p>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="privacyAgree" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
              <label htmlFor="privacyAgree">I agree to the data privacy policy</label>
            </div>
            <div className="form-group">
              <label>Download Password</label>
              <input type="password" className="form-control" value={downloadPassword} onChange={(e) => setDownloadPassword(e.target.value)} placeholder="Tcs#12345" />
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

  const renderNotifyModal = () => {
    if (!showNotifyModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowNotifyModal(false)}>
        <div className="modal-content modal-sm notify-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Megaphone size={20} /> Notify Course Owner</h3>
            <button className="modal-close" onClick={() => setShowNotifyModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>How many top candidates?</label>
              <input type="number" className="form-control" min="1" max="50" value={notifyCount}
                onChange={e => setNotifyCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 10)))} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowNotifyModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={executeNotify} disabled={loading}>
              {loading ? 'Notifying...' : 'Notify'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLockInterviewModal = () => {
    if (!showLockModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowLockModal(false)}>
        <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Lock size={20} /> Lock for Interview</h3>
            <button className="modal-close" onClick={() => setShowLockModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Interview Date & Time *</label>
              <input type="datetime-local" className="form-control" value={lockInterviewDatetime}
                onChange={(e) => setLockInterviewDatetime(e.target.value)} min={new Date().toISOString().slice(0, 16)} required />
            </div>
            <div className="form-group">
              <label>Assign to Interviewer *</label>
              <select className="form-control" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} required>
                <option value="">Select Interviewer</option>
                {interviewers.map(usr => <option key={usr.id} value={usr.id}>{usr.username}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowLockModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleLockForInterview} disabled={!lockInterviewDatetime || !assignedToId || loading}>
              {loading ? 'Locking...' : 'Lock for Interview'}
            </button>
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
              <input type="text" className="form-control" value={newInterviewer.username}
                onChange={(e) => setNewInterviewer({ ...newInterviewer, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={newInterviewer.email}
                onChange={(e) => setNewInterviewer({ ...newInterviewer, email: e.target.value })} placeholder="must end with @tcs.com" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Access Start</label>
                <input type="datetime-local" className="form-control" value={newInterviewer.access_start}
                  onChange={(e) => setNewInterviewer({ ...newInterviewer, access_start: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Access End</label>
                <input type="datetime-local" className="form-control" value={newInterviewer.access_end}
                  onChange={(e) => setNewInterviewer({ ...newInterviewer, access_end: e.target.value })} required />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowCreateInterviewerModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreateInterviewer}>Create Account</button>
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
              <p>1. Download template. 2. Fill job details. 3. Upload.</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDownloadExcelTemplate}><Download size={18} /> Download Template</button>
            <button className="btn btn-success" onClick={() => { document.getElementById('excelUpload').click(); setShowExcelTemplate(false); }}>
              <Upload size={18} /> Select & Upload Excel
            </button>
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
              <p>1. Download template. 2. Fill job description. 3. Upload.</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDownloadWordTemplate}><Download size={18} /> Download Template</button>
            <button className="btn btn-primary" onClick={() => { document.getElementById('wordUpload').click(); setShowWordTemplate(false); }}>
              <Upload size={18} /> Select & Upload Word
            </button>
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
          <div className="modal-header">
            <div className="modal-title"><Lock size={24} /><h2>Bulk Interview Lock</h2></div>
            <button className="modal-close" onClick={() => setShowBulkLockModal(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <button className="btn btn-secondary" onClick={downloadInterviewLockTemplate}><Download size={16} /> Download Template</button>
            </div>
            <div className="form-group">
              <input type="file" accept=".xlsx,.xls" onChange={e => setBulkLockFile(e.target.files[0])} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowBulkLockModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleBulkLockUpload} disabled={!bulkLockFile || loading}>
              <Upload size={16} /> Upload and Lock
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkStatusModal = () => {
    if (!showBulkStatusModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowBulkStatusModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><CheckCircle size={24} /><h2>Bulk Status Update</h2></div>
            <button className="modal-close" onClick={() => setShowBulkStatusModal(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <button className="btn btn-secondary" onClick={downloadStatusUpdateTemplate}><Download size={16} /> Download Template</button>
            </div>
            <div className="form-group">
              <input type="file" accept=".xlsx,.xls" onChange={e => setBulkStatusFile(e.target.files[0])} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowBulkStatusModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleBulkStatusUpload} disabled={!bulkStatusFile || loading}>
              <Upload size={16} /> Upload and Update
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkMappingModal = () => {
    if (!showBulkMappingModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowBulkMappingModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><Link size={24} /><h2>Bulk Mapping</h2></div>
            <button className="modal-close" onClick={() => setShowBulkMappingModal(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <button className="btn btn-secondary" onClick={downloadBulkMappingTemplate}><Download size={16} /> Download Template</button>
            </div>
            <div className="form-group">
              <input type="file" accept=".xlsx,.xls" onChange={e => setBulkMappingFile(e.target.files[0])} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowBulkMappingModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleBulkMappingUpload} disabled={!bulkMappingFile || loading}>
              <Upload size={16} /> Upload and Map
            </button>
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
            <div className="form-group">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setBulkInterviewerFile(e.target.files[0])} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowBulkInterviewerModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleBulkInterviewerUpload} disabled={!bulkInterviewerFile || loading}>
              <Upload size={16} /> Upload
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPrefLocModal = () => {
    if (!showPrefLocModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowPrefLocModal(false)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><MapPin size={24} /><h2>Upload Preferred Locations</h2></div>
            <button className="modal-close" onClick={() => setShowPrefLocModal(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="upload-instructions">
              <p>1. Download template. 2. Fill Employee ID and up to 3 preferred locations. 3. Upload.</p>
              <p style={{ marginTop: '0.75rem', color: '#f59e0b' }}>⚠ Trainees must already exist in the system.</p>
            </div>
            <div className="template-info" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>Template Columns:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <strong>Employee ID:</strong><span>Required</span>
                <strong>Preferred Location 1:</strong><span>Optional</span>
                <strong>Preferred Location 2:</strong><span>Optional</span>
                <strong>Preferred Location 3:</strong><span>Optional</span>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={downloadPrefLocTemplate}><Download size={18} /> Download Template</button>
            <label className="btn btn-success" style={{ cursor: 'pointer' }}>
              <Upload size={18} /> Select & Upload Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handlePrefLocUpload} />
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
            <div className="modal-title"><AlertCircle size={24} color="#ef4444" /><h2>Bulk Operation Errors</h2></div>
            <button className="modal-close" onClick={() => setShowErrorDetailsModal(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <div className="error-summary"><p><strong>Total Errors:</strong> {errorDetails.length}</p></div>
            <div className="error-list">
              {errorDetails.map((error, idx) => (
                <div key={idx} className="error-item">
                  <div className="error-header">
                    <XCircle size={16} color="#ef4444" />
                    <strong>Row {error.row}:</strong>
                    <span>{error.trainee || error.trainee_id}</span>
                  </div>
                  <div className="error-message">{error.message}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => setShowErrorDetailsModal(false)}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  const renderHiddenFileInputs = () => (
    <>
      <input type="file" id="excelUpload" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelUpload} />
      <input type="file" id="wordUpload" accept=".doc,.docx" style={{ display: 'none' }} onChange={handleWordUpload} />
    </>
  );

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      await jobAPI.uploadExcel(file);
      await fetchJobs();
      toast.success('Excel uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleWordUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      await jobAPI.uploadWord(file);
      await fetchJobs();
      toast.success('Word uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleDownloadExcelTemplate = async () => {
    try {
      const blob = await jobAPI.downloadExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDownloadWordTemplate = async () => {
    try {
      const blob = await jobAPI.downloadWordTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job_template.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch {
      toast.error('Download failed');
    }
  };
  // ==================== SIDEBAR & RENDER CONTENT ====================
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
    { id: 'demandSupply', label: 'Demand-Supply', icon: <TrendingUp size={20} /> },
    { id: 'recommendations', label: 'Recommendations', icon: <ThumbsUp size={20} /> },
    { id: 'workbook', label: 'Workbook', icon: <FileSpreadsheet size={20} /> },
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
      case 'demandSupply': return renderDemandSupplyAnalysis();
      case 'recommendations': return renderRecommendations();
      case 'workbook':  return renderWorkbook();
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
            <button className="btn-icon" onClick={refreshCurrentView} disabled={loading} title="Refresh"><RefreshCw size={18} className={loading ? 'spinning' : ''} /></button>
            <button className="btn-icon" onClick={backupData} disabled={backupInProgress} title="Backup"><Database size={18} /></button>
            <label className="btn-icon" title="Select restore file"><Upload size={18} /><input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => setRestoreFile(e.target.files[0])} /></label>
            {restoreFile && <button className="btn btn-secondary" onClick={restoreBackup} disabled={loading}>Restore</button>}
          </div>
        </div>
        <div className="dashboard-content"><div className="tab-panel">{renderContent()}</div></div>
      </div>
      {renderHiddenFileInputs()}
      {renderExcelTemplateModal()}
      {renderWordTemplateModal()}
      {renderJobDetailsModal()}
      {renderTraineeModal()}
      {renderLockInterviewModal()}
      {renderPrivacyModal()}
      {renderCreateInterviewerModal()}
      {renderBulkInterviewerModal()}
      {renderBulkLockModal()}
      {renderBulkStatusModal()}
      {renderBulkMappingModal()}
      {renderErrorDetailsModal()}
      {renderNotifyModal()}
      {renderPrefLocModal()}
      {drill && (
        <DrillDownModal
          open={!!drill}
          onClose={() => setDrill(null)}
          title={drill.title}
          chips={drill.chips}
          tabs={drill.tabs}
        />
      )}
    </div>
  );
}

export default DashboardHR;