// DashboardHR.js – Complete updated version with batch filtering, table view, pagination

import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import XlsxPopulate from 'xlsx-populate';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart2,
  FileText,
  ExternalLink,
  Lightbulb,
  BarChart3,
  LogOut,
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  ChevronRight,
  User,
  Mail,
  Star,
  Award,
  Target,
  PieChart,
  Download,
  Bell,
  Settings,
  Plus,
  ArrowLeft,
  Check,
  AlertCircle,
  Link,
  GraduationCap,
  BriefcaseBusiness,
  Building,
  DollarSign as Dollar,
  CalendarDays,
  BookOpen,
  Brain,
  Sparkles,
  Zap,
  ThumbsUp,
  TrendingDown,
  FileSpreadsheet,
  File,
  Upload,
  Users2,
  Lock,
  XCircle,
  Sliders,
  Grid,
  List,
  RefreshCw,
  Shield,
  Layers,
} from 'lucide-react';
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
  const [unfilteredTrainees, setUnfilteredTrainees] = useState([]); // full list for batch dropdown

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

  // New Job State
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: [''],
    openings: 1,
    requirements: '',
    techSkills: [],
    softSkills: [],
    description: '',
    salary: '',
    expiryDate: '',
    is_public: true,
    batch_name: '',
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

  // Pagination for trainees table
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
  const [newInterviewer, setNewInterviewer] = useState({ username: '', password: '', email: '' });

  // ==================== Helper Functions ====================
  const normalizeSkill = (s) => (s || '').toString().trim().toLowerCase();

  const getBatchParam = () => (selectedBatch ? `?batch=${selectedBatch}` : '');

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

  // Fetch trainees (with optional batch filter)
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
          matchedJobs: [],
          certifications: trainee.certificates ? [trainee.certificates] : [],
          preferredLocation: userInfo.location || 'Unknown',
          isMapped: userInfo.isMapped || false,
          projectId: userInfo.projectId || '',
          projectName: userInfo.projectName || '',
          batch_name: trainee.batch_name,
          traineeData: trainee,
        };
      });
      setTrainees(transformed);
      setAllTrainees(transformed);

      // If no batch selected, also store unfiltered list for batch dropdown
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

  // Initial fetch for full trainee list (to populate batch dropdown) if not already done
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
          matchedJobs: [],
          certifications: trainee.certificates ? [trainee.certificates] : [],
          preferredLocation: userInfo.location || 'Unknown',
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
      const newFilled = (job.filled || 0) + 1;
      const newOpenings = Math.max(0, (job.openings || 0) - 1);
      const updated = { ...job, filled: newFilled, openings: newOpenings };
      await jobAPI.updateJob(job.id, updated);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      if (selectedJob?.id === job.id) setSelectedJob(updated);
      if (selectedJobForSearch?.id === job.id) setSelectedJobForSearch(updated);
      if (newOpenings === 0) await checkAndAutoDeactivateJob(updated);
      return updated;
    } catch (error) {
      toast.error('Failed to update job vacancies');
      throw error;
    }
  };

  const checkAndAutoDeactivateJob = async (job) => {
    if (job.openings <= 0) {
      const updated = { ...job, status: 'inactive' };
      await jobAPI.updateJob(job.id, updated);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      toast.success(`Job "${job.title}" auto‑deactivated.`);
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
        const found = allTrainees.find(t => t.userId === match.trainee_id);
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

      if (job.openings <= 0) {
        toast.error('No openings left for this job');
        return;
      }

      const mappingData = {
        isMapped: true,
        projectId: job.id.toString(),
        projectName: job.title,
      };
      await mappingAPI.updateMapping(userId, mappingData);
      const updatedJob = await updateJobVacancies(job);

      if (selectedJobForSearch && selectedJobForSearch.id === job.id) {
        setSelectedJobForSearch(updatedJob);
        handleJobSelectForSearch(job.id);
      }

      setTraineesWithNoMatches((prev) => prev.filter((t) => t.userId !== userId));

      setAllTrainees((prev) =>
        prev.map((t) => (t.userId === userId ? { ...t, isMapped: true, projectId: job.id, projectName: job.title } : t))
      );
      setTrainees((prev) =>
        prev.map((t) => (t.userId === userId ? { ...t, isMapped: true, projectId: job.id, projectName: job.title } : t))
      );

      if (jobMatches) {
        const bucket = Object.keys(jobMatches).find((key) =>
          Array.isArray(jobMatches[key]) && jobMatches[key].some((m) => m.trainee_id === userId)
        );
        if (bucket) {
          setJobMatches((prev) => ({
            ...prev,
            [bucket]: prev[bucket].filter((m) => m.trainee_id !== userId),
            total_matches: prev.total_matches - 1,
          }));
        }
      }

      if (searchJobMatches) {
        const bucket = Object.keys(searchJobMatches).find((key) =>
          Array.isArray(searchJobMatches[key]) && searchJobMatches[key].some((m) => m.trainee_id === userId)
        );
        if (bucket) {
          setSearchJobMatches((prev) => ({
            ...prev,
            [bucket]: prev[bucket].filter((m) => m.trainee_id !== userId),
            total_matches: prev.total_matches - 1,
          }));
        } else {
          const newSearchMatches = { ...searchJobMatches };
          let removed = false;
          Object.keys(newSearchMatches).forEach(key => {
            if (Array.isArray(newSearchMatches[key])) {
              const filtered = newSearchMatches[key].filter(m => m.trainee_id !== userId);
              if (filtered.length !== newSearchMatches[key].length) {
                newSearchMatches[key] = filtered;
                removed = true;
              }
            }
          });
          if (removed) {
            newSearchMatches.total_matches = (newSearchMatches.total_matches || 0) - 1;
            setSearchJobMatches(newSearchMatches);
          }
        }
      }

      setRecentActivity(prev => [
        { type: 'Mapped', trainee: traineeName, job: job.title, time: new Date().toLocaleString() },
        ...prev.slice(0, 4)
      ]);

      toast.success(`Mapped ${traineeName} to ${job.title}`);
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
            openings: (job.openings || 0) + 1,
          };
          if (job.status === 'inactive' && updated.openings > 0) updated.status = 'active';
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
    const trainee = allTrainees.find((at) => at.userId === match.trainee_id);
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

  const handleViewJobMatches = (job) => {
    setSelectedJob(job);
    fetchJobMatches(job.id);
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
    if (!newJob.title || !newJob.department || !newJob.description || !newJob.requirements) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      const jobData = {
        ...newJob,
        location: newJob.location.filter((loc) => loc.trim() !== ''),
        techSkills,
        softSkills,
        status: 'active',
        filled: 0,
        matches: 0,
        postedDate: new Date().toISOString().split('T')[0],
        is_public: newJob.is_public,
        batch_name: selectedBatch,
      };
      await jobAPI.createJob(jobData);
      await fetchJobs();
      setNewJob({
        title: '',
        department: '',
        location: [''],
        openings: 1,
        requirements: '',
        techSkills: [],
        softSkills: [],
        description: '',
        salary: '',
        expiryDate: '',
        is_public: true,
      });
      setTechSkills([]);
      setSoftSkills([]);
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
      if (skill && !techSkills.includes(skill)) {
        const updated = [...techSkills, skill];
        setTechSkills(updated);
        if (selectedJob && isEditMode) {
          setSelectedJob({ ...selectedJob, techSkills: updated });
        } else {
          setNewJob({ ...newJob, techSkills: updated });
        }
        e.target.value = '';
      }
    }
  };
  const handleSoftSkillAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = e.target.value.trim();
      if (skill && !softSkills.includes(skill)) {
        const updated = [...softSkills, skill];
        setSoftSkills(updated);
        if (selectedJob && isEditMode) {
          setSelectedJob({ ...selectedJob, softSkills: updated });
        } else {
          setNewJob({ ...newJob, softSkills: updated });
        }
        e.target.value = '';
      }
    }
  };
  const removeTechSkill = (index) => {
    const updated = techSkills.filter((_, i) => i !== index);
    setTechSkills(updated);
    if (selectedJob && isEditMode) {
      setSelectedJob({ ...selectedJob, techSkills: updated });
    } else {
      setNewJob({ ...newJob, techSkills: updated });
    }
  };
  const removeSoftSkill = (index) => {
    const updated = softSkills.filter((_, i) => i !== index);
    setSoftSkills(updated);
    if (selectedJob && isEditMode) {
      setSelectedJob({ ...selectedJob, softSkills: updated });
    } else {
      setNewJob({ ...newJob, softSkills: updated });
    }
  };

  // Location fields
  const addLocationField = () => setNewJob({ ...newJob, location: [...newJob.location, ''] });
  const removeLocationField = (index) => setNewJob({ ...newJob, location: newJob.location.filter((_, i) => i !== index) });
  const updateLocationField = (index, value) => {
    const newLocs = [...newJob.location];
    newLocs[index] = value;
    setNewJob({ ...newJob, location: newLocs });
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

  // ==================== Download Helpers (Excel with password) ====================
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
    data[0]?.forEach((_, colIndex) => {
      sheet.column(colIndex + 1).width(20);
    });
    return await workbook.outputAsync({ password: password, type: 'blob' });
  };

  const parseCSVToArray = (csvText) => {
    const lines = csvText.trim().split(/\r?\n/);
    return lines.map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
  };

  const getFilteredSearchData = async () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = allTrainees.find(t => t.userId === m.trainee_id);
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
        (m.matched_skills || []).join('; '),
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
    if (!privacyAgreed) {
      toast.error('You must agree to the privacy policy');
      return;
    }
    if (downloadPassword !== 'Tcs#12345') {
      toast.error('Incorrect password');
      setDownloadPassword('');
      return;
    }
    setShowPrivacyModal(false);

    const { type, params } = pendingDownload;
    try {
      let data = null;
      let filename = '';
      let sheetName = '';

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
        data = rows;
        filename = 'selected_candidates.xlsx';
        sheetName = 'Selected';
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
        data = rows;
        filename = 'rejected_candidates.xlsx';
        sheetName = 'Rejected';
      }

      if (!data || data.length === 0) {
        toast.error('No data to download');
        return;
      }

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

  const downloadReport = async (reportType) => {
    requestDownload('report', { reportType });
  };

  const fetchInterviewers = async () => {
    try {
      const res = await api.get('/users/?role=interviewer');
      setInterviewers(res.data);
    } catch (err) {
      toast.error('Failed to load interviewers');
    }
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
        ...interviewSelected.map(lock => ({
          ...lock,
          source: 'Interview',
          trainee_id: lock.trainee_id,
          name: lock.trainee_name,
          projectName: lock.job_title,
          lock_id: lock.id,
        })),
        ...directMapped.map(t => ({
          trainee_id: t.userId,
          trainee_name: t.name,
          job_title: t.projectName,
          assigned_to_name: 'HR Direct',
          interview_datetime: null,
          feedback: null,
          source: 'Direct',
        }))
      ];
      setSelectedCandidates(combined);
    } catch (err) {
      toast.error('Failed to fetch selected candidates');
    }
  };

  const fetchRejectedLocks = async () => {
    try {
      const res = await api.get(`/interview-locks/?status=rejected${selectedBatch ? `&batch=${selectedBatch}` : ''}`);
      setRejectedLocks(res.data);
    } catch (err) {
      toast.error('Failed to fetch rejected candidates');
    }
  };

  const handleLockForInterview = async () => {
    if (selectedTraineeIds.length === 0) {
      toast.error('Select at least one trainee');
      return;
    }
    if (!lockInterviewDatetime) {
      toast.error('Select interview date and time');
      return;
    }
    const selectedDate = new Date(lockInterviewDatetime);
    const now = new Date();
    if (selectedDate <= now) {
      toast.error('Interview date must be in the future');
      return;
    }
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
      toast.error('Weekends are not allowed for interviews');
      return;
    }
    if (!assignedToId) {
      toast.error('Select an interviewer');
      return;
    }
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

      setRecentActivity(prev => [
        { type: 'Locked', trainee: `${selectedTraineeIds.length} trainees`, job: selectedJob.title, time: new Date().toLocaleString() },
        ...prev.slice(0, 4)
      ]);

      setShowLockModal(false);
      setSelectedTraineeIds([]);
      setLockInterviewDatetime('');
      setLockComments('');
      setAssignedToId('');
      if (selectedJob) fetchJobMatches(selectedJob.id);
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
    } catch (err) {
      toast.error('Failed to cancel selection');
    }
  };

  const handleJobSelectForSearch = (jobId) => {
    const job = jobs.find(j => j.id === parseInt(jobId));
    if (!job) return;
    if (job.openings <= job.filled || job.status !== 'active') {
      toast.error('This job has no openings or is inactive');
      return;
    }
    setSelectedJobForSearch(job);
    if (job) {
      setJobMatchesLoading(true);
      api.get(`/matches/${job.id}/${getBatchParam()}`)
        .then(res => {
          setSearchJobMatches(res.data);
          setSelectedSearchTraineeIds([]);
          setSelectAll(false);
        })
        .catch(() => toast.error('Failed to fetch matches'))
        .finally(() => setJobMatchesLoading(false));
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
        const skills = m.matched_skills || [];
        if (!skills.some(s => s.toLowerCase().includes(searchFilters.skillKeyword.toLowerCase()))) return false;
      }
      return true;
    });
  };

  const handleSelectAllSearch = () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = allTrainees.find(t => t.userId === m.trainee_id);
      return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch.id.toString());
    });
    if (selectAll) {
      setSelectedSearchTraineeIds([]);
    } else {
      setSelectedSearchTraineeIds(filtered.map(m => String(m.trainee_id)));
    }
    setSelectAll(!selectAll);
  };

  const handleLockFromSearch = async () => {
    if (selectedSearchTraineeIds.length === 0) {
      toast.error('Select at least one trainee');
      return;
    }
    if (!lockInterviewDatetime) {
      toast.error('Select interview date and time');
      return;
    }
    const selectedDate = new Date(lockInterviewDatetime);
    const now = new Date();
    if (selectedDate <= now) {
      toast.error('Interview date must be in the future');
      return;
    }
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
      toast.error('Weekends are not allowed for interviews');
      return;
    }
    if (!assignedToId) {
      toast.error('Select an interviewer');
      return;
    }
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

      setRecentActivity(prev => [
        { type: 'Locked', trainee: `${selectedSearchTraineeIds.length} trainees`, job: selectedJobForSearch.title, time: new Date().toLocaleString() },
        ...prev.slice(0, 4)
      ]);

      setShowLockModal(false);
      setSelectedSearchTraineeIds([]);
      setSelectAll(false);
      setLockInterviewDatetime('');
      setLockComments('');
      setAssignedToId('');
      handleJobSelectForSearch(selectedJobForSearch.id);
    } catch (err) {
      toast.error('Failed to lock trainees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterviewer = async () => {
    if (!newInterviewer.username || !newInterviewer.password) {
      toast.error('Username and password required');
      return;
    }
    if (!newInterviewer.email.endsWith('@tcs.com')) {
      toast.error('Email must end with @tcs.com');
      return;
    }
    try {
      await api.post('/users/create-interviewer/', newInterviewer);
      toast.success('Interviewer created');
      setShowCreateInterviewerModal(false);
      setNewInterviewer({ username: '', password: '', email: '' });
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
        if (selectedJob && selectedJob.id === parseInt(jobId)) {
          fetchJobMatches(jobId);
        }
        if (selectedJobForSearch && selectedJobForSearch.id === parseInt(jobId)) {
          handleJobSelectForSearch(jobId);
        }
      } else {
        fetchJobs();
      }
    } catch (err) {
      toast.error('Failed to trigger matching engine');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      let totalMatches = 0;
      let totalPercentSum = 0;
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
        } catch (err) {
          console.error(`Failed to fetch matches for job ${job.id}`, err);
        }
      }
      setTotalMatchesCount(totalMatches);
      setAvgMatchPercent(totalMatches > 0 ? Math.round(totalPercentSum / totalMatches) : 0);
      setBucketDistribution(buckets);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [locksRes] = await Promise.all([
        api.get(`/interview-locks/${getBatchParam()}`),
      ]);
      const locks = locksRes.data.slice(0,5).map(lock => ({
        type: lock.status === 'selected' ? 'Selected' : lock.status === 'rejected' ? 'Rejected' : 'Locked',
        trainee: lock.trainee_name,
        job: lock.job_title,
        time: new Date(lock.created_at).toLocaleString(),
      }));
      setRecentActivity(prev => {
        const combined = [...locks, ...prev].sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0,5);
        return combined;
      });
    } catch (err) {
      console.error('Failed to fetch recent activity', err);
    }
  };

  // ==================== Effects ====================
  // On mount, fetch full trainee list to populate batch dropdown
  useEffect(() => {
    fetchFullTraineeListForBatches();
  }, []);

  useEffect(() => {
    if (['dashboard', 'trainees', 'mapped', 'unmapped', 'openPool', 'interviewLocks'].includes(activeTab)) {
      fetchTrainees();
    }
  }, [activeTab, selectedBatch]);

  useEffect(() => {
    if (['dashboard', 'jobs', 'createJob', 'talentSearch'].includes(activeTab)) fetchJobs();
  }, [activeTab, selectedBatch]);

  useEffect(() => {
    if (allTrainees.length && activeTab === 'openPool') checkTraineesForOpenPool();
  }, [allTrainees, activeTab, selectedBatch]);

  useEffect(() => {
    setSkillTrends(computeSkillTrends(jobs));
  }, [jobs]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchLockStats();
      fetchAnalytics();
      fetchRecentActivity();
    }
  }, [activeTab, jobs, selectedBatch]);

  useEffect(() => {
    let filtered = [...allTrainees];
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (locationFilter) {
      filtered = filtered.filter((t) => t.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }
    if (activeTab === 'mapped') filtered = filtered.filter((t) => t.isMapped);
    else if (activeTab === 'unmapped') filtered = filtered.filter((t) => !t.isMapped);
    else if (activeTab === 'openPool') {
      const noMatchIds = traineesWithNoMatches.map((t) => t.id || t.trainee_id);
      filtered = filtered.filter((t) => !t.isMapped && noMatchIds.includes(t.id));
    }
    setTrainees(filtered);
  }, [searchQuery, locationFilter, activeTab, allTrainees, traineesWithNoMatches]);

  useEffect(() => {
    if (activeTab === 'interviewLocks') {
      fetchInterviewLocks();
      fetchLockStats();
    }
  }, [activeTab, lockFilter, selectedBatch]);

  useEffect(() => {
    if (activeTab === 'selected') fetchSelectedCandidates();
    if (activeTab === 'rejected') fetchRejectedLocks();
  }, [activeTab, allTrainees, selectedBatch]);

  const computeSkillTrends = (jobs) => {
    const techMap = new Map();
    const softMap = new Map();
    const WEIGHTS = {
      basePerJob: 1,
      openingsWeight: 0.5,
      matchesWeight: 0.25,
      inactivePenalty: 0.4,
      unfilledBonus: 0.3,
    };
    for (const job of jobs || []) {
      const isActive = job?.status === 'active';
      const openings = Number(job?.openings ?? 0);
      const filled = Number(job?.filled ?? 0);
      const matches = Number(job?.matches ?? 0);
      const unfilled = Math.max(0, openings - filled);
      const jobWeight =
        WEIGHTS.basePerJob +
        openings * WEIGHTS.openingsWeight +
        matches * WEIGHTS.matchesWeight +
        unfilled * WEIGHTS.unfilledBonus;
      const effectiveWeight = isActive ? jobWeight : jobWeight * WEIGHTS.inactivePenalty;

      (job?.techSkills || []).forEach((raw) => {
        const skill = normalizeSkill(raw);
        if (!skill) return;
        const cur = techMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
        techMap.set(skill, {
          jobs: cur.jobs + 1,
          openings: cur.openings + openings,
          matches: cur.matches + matches,
          demand: cur.demand + effectiveWeight,
        });
      });

      (job?.softSkills || []).forEach((raw) => {
        const skill = normalizeSkill(raw);
        if (!skill) return;
        const cur = softMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
        softMap.set(skill, {
          jobs: cur.jobs + 1,
          openings: cur.openings + openings,
          matches: cur.matches + matches,
          demand: cur.demand + effectiveWeight,
        });
      });
    }

    const toSortedArray = (map) => {
      const arr = Array.from(map.entries()).map(([name, stats]) => ({
        name,
        jobs: stats.jobs,
        openings: stats.openings,
        matches: stats.matches,
        demandRaw: stats.demand,
      }));
      const maxDemand = Math.max(...arr.map((a) => a.demandRaw), 1);
      return arr
        .map((a) => ({
          ...a,
          demand: Math.round((a.demandRaw / maxDemand) * 100),
        }))
        .sort((a, b) => b.demand - a.demand || b.jobs - a.jobs)
        .slice(0, 5);
    };
    return { tech: toSortedArray(techMap), soft: toSortedArray(softMap) };
  };

  // ==================== Render Helpers ====================
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleDownloadExcelTemplate = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWordTemplate = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  // Modals
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
              <p>By downloading this file, you agree to comply with the company's data privacy policy.
                The information contained is confidential and intended solely for authorised personnel.
                Unauthorised distribution or misuse may result in disciplinary action.</p>
              <p className="mt-2"><strong>Note:</strong> The file will be downloaded as a password‑protected Excel file. You will need the password to open it.</p>
            </div>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="privacyAgree"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
              />
              <label htmlFor="privacyAgree">I have read and agree to the data privacy policy</label>
            </div>
            <div className="form-group">
              <label>Download Password</label>
              <input
                type="password"
                className="form-control"
                value={downloadPassword}
                onChange={(e) => setDownloadPassword(e.target.value)}
                placeholder="Enter password (Tcs#12345)"
              />
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
              <input
                type="text"
                className="form-control"
                value={newInterviewer.username}
                onChange={(e) => setNewInterviewer({ ...newInterviewer, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={newInterviewer.email}
                onChange={(e) => setNewInterviewer({ ...newInterviewer, email: e.target.value })}
                placeholder="must end with @tcs.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={newInterviewer.password}
                onChange={(e) => setNewInterviewer({ ...newInterviewer, password: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowCreateInterviewerModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreateInterviewer}>Create</button>
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
            <div className="modal-title"><FileSpreadsheet size={24} /><h2>Excel Upload Template</h2></div>
            <button className="modal-close" onClick={() => setShowExcelTemplate(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <h3>Download the template, fill it, and upload.</h3>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleDownloadExcelTemplate} disabled={loading}>
              <Download size={18} /> Download Template
            </button>
            <button className="btn-primary" onClick={() => { document.getElementById('excelUpload').click(); setShowExcelTemplate(false); }} disabled={loading}>
              <Upload size={18} /> Upload Excel
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
            <div className="modal-title"><File size={24} /><h2>Word Template</h2></div>
            <button className="modal-close" onClick={() => setShowWordTemplate(false)}><X size={24} /></button>
          </div>
          <div className="modal-body">
            <h3>Download the Word template, fill it, and upload.</h3>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleDownloadWordTemplate} disabled={loading}>
              <Download size={18} /> Download Template
            </button>
            <button className="btn-primary" onClick={() => { document.getElementById('wordUpload').click(); setShowWordTemplate(false); }} disabled={loading}>
              <Upload size={18} /> Upload Word
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard render
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
        <div className="stat-card"><div className="stat-icon"><Briefcase /></div><div className="stat-content"><h3>Fill Rate</h3><div className="stat-value">{stats.fillRate}%</div></div></div>
      </div>

      {lockStats && (
        <div className="stats-grid small margin-top-1">
          <div className="stat-card"><div className="stat-icon"><Lock size={20} /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.total_locked}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle size={20} /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.total_selected}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><XCircle size={20} /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.total_rejected}</div></div></div>
        </div>
      )}

      <div className="analytics-section margin-top-2">
        <h2 className="section-title">Matching Analytics</h2>
        <div className="analytics-grid">
          <div className="analytics-card"><h3>Total Matches</h3><div className="analytics-value">{totalMatchesCount}</div></div>
          <div className="analytics-card"><h3>Avg Match %</h3><div className="analytics-value">{avgMatchPercent}%</div></div>
          <div className="analytics-card"><h3>Perfect Matches</h3><div className="analytics-value">{bucketDistribution.PERFECT_MATCH}</div></div>
          <div className="analytics-card"><h3>Skills Only</h3><div className="analytics-value">{bucketDistribution.SKILLS_ONLY}</div></div>
          <div className="analytics-card"><h3>Location Only</h3><div className="analytics-value">{bucketDistribution.LOCATION_ONLY}</div></div>
          <div className="analytics-card"><h3>Proximity</h3><div className="analytics-value">{bucketDistribution.NEARBY}</div></div>
          <div className="analytics-card"><h3>No Match</h3><div className="analytics-value">{bucketDistribution.NO_MATCH}</div></div>
        </div>

        <h2 className="section-title">Recent Activity</h2>
        <div className="recent-activity">
          {recentActivity.length > 0 ? (
            <ul className="activity-list">
              {recentActivity.map((act, idx) => (
                <li key={idx} className="activity-item">
                  <span className={`activity-type ${act.type.toLowerCase()}`}>{act.type}</span>
                  <span className="activity-detail">{act.trainee} → {act.job}</span>
                  <span className="activity-time">{act.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity</p>
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

  // Job Management
  const renderJobManagement = () => (
    <div className="job-management">
      <div className="section-header">
        <div className="header-title"><h2><Briefcase size={24} /> Job Profiles</h2><p className="subtitle">Manage all job positions</p></div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateInterviewerModal(true)} disabled={loading}>
            <User size={18} /> Create Interviewer
          </button>
          <div className="upload-buttons">
            <button className="btn-secondary" onClick={() => setShowExcelTemplate(true)} disabled={loading}><FileSpreadsheet size={18} /> Upload Excel</button>
            <button className="btn-secondary" onClick={() => setShowWordTemplate(true)} disabled={loading}><File size={18} /> Upload Word</button>
          </div>
          <button className="btn-primary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('createJob'); }} disabled={loading}><Plus size={18} /> Create New Job</button>
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
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location(s)</th>
                <th>Batch</th>
                <th>Openings</th>
                <th>Filled</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Actions</th>
               </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const remaining = Math.max(0, job.openings - job.filled);
                return (
                  <tr key={job.id}>
                    <td>
                      <div className="job-title-cell">
                        <div className="job-icon"><BriefcaseBusiness size={16} /></div>
                        <span className="font-medium">{job.title}</span>
                      </div>
                    </td>
                    <td>
                      <div className="department-cell"><Building size={14} />{job.department}</div>
                    </td>
                    <td>
                      <div className="location-cell"><MapPin size={14} />{Array.isArray(job.location) ? job.location.join(', ') : job.location}</div>
                    </td>
                    <td>{job.batch_name || '-'}</td>
                    <td className="openings-cell">{job.openings}</td>
                    <td className={`filled-cell ${job.filled === job.openings ? 'filled-complete' : ''}`}>{job.filled}</td>
                    <td className="remaining-cell">{remaining}</td>
                    <td>
                      <button
                        className={`status-button ${job.status === 'active' ? 'status-active' : 'status-inactive'}`}
                        onClick={() => toggleJobStatus(job.id)}
                        disabled={loading}
                      >
                        {job.status === 'active' ? <><CheckCircle size={12} /> Active</> : <><X size={12} /> Inactive</>}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon btn-icon-view" onClick={() => handleViewJobDetails(job)} disabled={loading} title="View Details"><Eye size={16} /></button>
                        <button className="btn-icon btn-icon-edit" onClick={() => { setSelectedJob(job); setIsEditMode(true); setActiveTab('createJob'); setTechSkills(job.techSkills || []); setSoftSkills(job.softSkills || []); }} disabled={loading} title="Edit"><Edit size={16} /></button>
                        <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteJob(job.id)} disabled={loading} title="Delete"><Trash2 size={16} /></button>
                        <button className="btn-icon btn-icon-match" onClick={() => runMatchingEngine(job.id)} disabled={loading} title="Generate Matches"><RefreshCw size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Create/Edit Job Form
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
          <button className="btn-secondary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('jobs'); setNewJob({ title: '', department: '', location: [''], openings: 1, requirements: '', techSkills: [], softSkills: [], description: '', salary: '', expiryDate: '', is_public: true }); setTechSkills([]); setSoftSkills([]); }} disabled={loading}><ArrowLeft size={18} /> Back to Jobs</button>
        </div>
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>{isEditing ? 'Updating...' : 'Creating...'}</p></div>}
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="form-section-title"><Briefcase size={20} /> Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label><span className="required">*</span> Job Title</label>
                  <input type="text" className="form-control" value={jobToEdit.title} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, title: e.target.value }) : setNewJob({ ...newJob, title: e.target.value })} required placeholder="e.g., Senior Frontend Developer" disabled={loading} />
                </div>
                <div className="form-group">
                  <label><span className="required">*</span> Department</label>
                  <select className="form-control" value={jobToEdit.department} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, department: e.target.value }) : setNewJob({ ...newJob, department: e.target.value })} required disabled={loading}>
                    <option value="">Select Department</option>
                    <option value="Technology">Technology</option>
                    <option value="Analytics">Analytics</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Visibility</label>
                  <select className="form-control" value={jobToEdit.is_public ? 'public' : 'private'} onChange={(e) => { const val = e.target.value === 'public'; if (isEditing) setSelectedJob({ ...jobToEdit, is_public: val }); else setNewJob({ ...newJob, is_public: val }); }}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label><span className="required">*</span> Locations <span className="helper-text">(Add multiple)</span></label>
                {jobToEdit.location.map((loc, index) => (
                  <div key={index} className="location-input-group">
                    <input type="text" className="form-control" value={loc} onChange={(e) => { if (isEditing) { const newLocs = [...jobToEdit.location]; newLocs[index] = e.target.value; setSelectedJob({ ...jobToEdit, location: newLocs }); } else updateLocationField(index, e.target.value); }} required={index === 0} placeholder="e.g., Hyderabad" disabled={loading} />
                    {jobToEdit.location.length > 1 && <button type="button" className="btn-icon" onClick={() => { if (isEditing) { const newLocs = jobToEdit.location.filter((_, i) => i !== index); setSelectedJob({ ...jobToEdit, location: newLocs }); } else removeLocationField(index); }} disabled={loading}><X size={16} /></button>}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addLocationField} disabled={loading}><Plus size={16} /> Add Another</button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><span className="required">*</span> Openings</label>
                  <input type="number" className="form-control" value={jobToEdit.openings} onChange={(e) => { const val = parseInt(e.target.value) || 1; if (isEditing) setSelectedJob({ ...jobToEdit, openings: val }); else setNewJob({ ...newJob, openings: val }); }} min="1" required disabled={loading} />
                </div>
                <div className="form-group">
                  <label><Calendar size={16} /> Expiry Date</label>
                  <input type="date" className="form-control" value={jobToEdit.expiryDate} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, expiryDate: e.target.value }) : setNewJob({ ...newJob, expiryDate: e.target.value })} disabled={loading} />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3 className="form-section-title"><BookOpen size={20} /> Requirements & Skills</h3>
              <div className="form-group">
                <label><span className="required">*</span> Technical Skills</label>
                <div className="skills-input">
                  <input type="text" className="form-control" placeholder="Type skill and press Enter" onKeyDown={handleTechSkillAdd} disabled={loading} />
                  <div className="skills-tags">
                    {(isEditing ? jobToEdit.techSkills || [] : techSkills).map((skill, index) => (
                      <span key={index} className="skill-tag tech-tag">{skill}<button type="button" className="tag-remove" onClick={() => removeTechSkill(index)} disabled={loading}><X size={12} /></button></span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Soft Skills</label>
                <div className="skills-input">
                  <input type="text" className="form-control" placeholder="Type skill and press Enter" onKeyDown={handleSoftSkillAdd} disabled={loading} />
                  <div className="skills-tags">
                    {(isEditing ? jobToEdit.softSkills || [] : softSkills).map((skill, index) => (
                      <span key={index} className="skill-tag soft-tag">{skill}<button type="button" className="tag-remove" onClick={() => removeSoftSkill(index)} disabled={loading}><X size={12} /></button></span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label><span className="required">*</span> Job Description</label>
                <textarea className="form-control" rows="4" value={jobToEdit.description} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, description: e.target.value }) : setNewJob({ ...newJob, description: e.target.value })} placeholder="Describe the role..." required disabled={loading} />
              </div>
              <div className="form-group">
                <label><span className="required">*</span> Requirements</label>
                <textarea className="form-control" rows="4" value={jobToEdit.requirements} onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, requirements: e.target.value }) : setNewJob({ ...newJob, requirements: e.target.value })} placeholder="List required qualifications..." required disabled={loading} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setSelectedJob(null); setIsEditMode(false); setActiveTab('jobs'); setNewJob({ title: '', department: '', location: [''], openings: 1, requirements: '', techSkills: [], softSkills: [], description: '', salary: '', expiryDate: '', is_public: true }); setTechSkills([]); setSoftSkills([]); }} disabled={loading}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {isEditing ? <><Check size={18} /> {loading ? 'Updating...' : 'Update Job'}</> : <><Plus size={18} /> {loading ? 'Creating...' : 'Create Job'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Trainees List (Table with Pagination)
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
            <h2><Users size={24} /> Trainees</h2>
            <p className="subtitle">Manage all trainees</p>
          </div>
          <div className="view-options">
            <button className={`btn-view-option ${activeTab === 'trainees' ? 'active' : ''}`} onClick={() => setActiveTab('trainees')}>All</button>
            <button className={`btn-view-option ${activeTab === 'mapped' ? 'active' : ''}`} onClick={() => setActiveTab('mapped')}><CheckCircle size={16} /> Mapped ({stats.mappedTrainees})</button>
            <button className={`btn-view-option ${activeTab === 'unmapped' ? 'active' : ''}`} onClick={() => setActiveTab('unmapped')}><AlertCircle size={16} /> Unmapped ({stats.unmappedTrainees})</button>
            <button className={`btn-view-option ${activeTab === 'openPool' ? 'active' : ''}`} onClick={() => setActiveTab('openPool')}><Users2 size={16} /> Open Pool ({openPoolCount})</button>
          </div>
          <div className="download-buttons flex-row">
            <button className="btn-secondary" onClick={() => downloadReport('mapped')}><Download size={16} /> Mapped</button>
            <button className="btn-secondary" onClick={() => downloadReport('unmapped')}><Download size={16} /> Unmapped</button>
          </div>
        </div>

        <div className="search-filter">
          <div className="search-box">
            <input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {uniqueLocations.map((loc) => <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>)}
            </select>
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
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Batch</th>
                    <th>Skills</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrainees.map((trainee) => (
                    <tr key={trainee.id}>
                      <td>
                        <div className="trainee-name-cell">
                          <div className="trainee-avatar-small">{trainee.name.charAt(0)}</div>
                          <span>{trainee.name}</span>
                        </div>
                      </td>
                      <td>{trainee.email}</td>
                      <td>{trainee.location}</td>
                      <td>{trainee.batch_name || '-'}</td>
                      <td>
                        <div className="skills-cell">
                          {trainee.skills.slice(0, 3).map(skill => <span key={skill} className="skill-tag-small">{skill}</span>)}
                          {trainee.skills.length > 3 && <span className="more-skills">+{trainee.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="score-cell">
                          <div className="mini-progress"><div className="mini-fill" style={{ width: `${trainee.score}%` }} /></div>
                          <span>{trainee.score}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${trainee.isMapped ? 'status-mapped' : 'status-unmapped'}`}>
                          {trainee.isMapped ? 'Mapped' : 'Unmapped'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon btn-icon-view" onClick={() => handleViewTraineeProfile(trainee)} title="View Profile">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={traineePage === 1} onClick={() => setTraineePage(p => p - 1)}>&lt;</button>
                <span>Page {traineePage} of {totalPages}</span>
                <button disabled={traineePage === totalPages} onClick={() => setTraineePage(p => p + 1)}>&gt;</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Job Details Modal
  const renderJobDetailsModal = () => {
    if (!showJobDetailsModal || !jobDetailsJob) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowJobDetailsModal(false)}>
        <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2><Briefcase size={24} /> {jobDetailsJob.title}</h2>
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
                <p><strong>Department:</strong> {jobDetailsJob.department}</p>
                <p><strong>Location(s):</strong> {Array.isArray(jobDetailsJob.location) ? jobDetailsJob.location.join(', ') : jobDetailsJob.location}</p>
                <p><strong>Batch:</strong> {jobDetailsJob.batch_name || 'N/A'}</p>
                <p><strong>Openings:</strong> {jobDetailsJob.openings} ({jobDetailsJob.filled} filled)</p>
                <p><strong>Status:</strong> <span className={`status-badge status-${jobDetailsJob.status}`}>{jobDetailsJob.status}</span></p>
                <p><strong>Posted:</strong> {jobDetailsJob.postedDate}</p>
                <p><strong>Expires:</strong> {jobDetailsJob.expiryDate}</p>
                <p><strong>Salary:</strong> {jobDetailsJob.salary}</p>
                <div className="job-section">
                  <h4>Description</h4>
                  <p>{jobDetailsJob.description}</p>
                </div>
                <div className="job-section">
                  <h4>Requirements</h4>
                  <p>{jobDetailsJob.requirements}</p>
                </div>
                <div className="job-section">
                  <h4>Technical Skills</h4>
                  <div className="skills-list">
                    {jobDetailsJob.techSkills?.map(skill => <span key={skill} className="skill-tag tech-tag">{skill}</span>)}
                  </div>
                </div>
                <div className="job-section">
                  <h4>Soft Skills</h4>
                  <div className="skills-list">
                    {jobDetailsJob.softSkills?.map(skill => <span key={skill} className="skill-tag soft-tag">{skill}</span>)}
                  </div>
                </div>
              </div>
            )}
            {jobDetailsTab === 'mapped' && (
              <div>
                {mappedTrainees.length === 0 ? (
                  <p className="no-data">No trainees mapped to this job.</p>
                ) : (
                  <div className="trainee-list">
                    {mappedTrainees.map(t => (
                      <div key={t.id} className="trainee-item">
                        <User size={18} />
                        <span>{t.name}</span>
                        <span className="trainee-location">({t.location})</span>
                        <button className="btn-icon" onClick={() => { setSelectedTrainee(t); setShowJobDetailsModal(false); fetchTraineeMatches(t.id); }}><Eye size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {jobDetailsTab === 'rejected' && (
              <div>
                {rejectedTrainees.length === 0 ? (
                  <p className="no-data">No rejected trainees for this job.</p>
                ) : (
                  <div className="trainee-list">
                    {rejectedTrainees.map(lock => (
                      <div key={lock.id} className="trainee-item">
                        <User size={18} />
                        <span>{lock.trainee_name}</span>
                        <span className="trainee-location">({lock.trainee_location})</span>
                        {lock.feedback && (
                          <button className="btn-icon" onClick={() => setViewingFeedback(lock.feedback)}><FileText size={16} /></button>
                        )}
                        <button className="btn-icon" onClick={() => {
                          const trainee = allTrainees.find(t => t.id === lock.trainee);
                          if (trainee) { setSelectedTrainee(trainee); setShowJobDetailsModal(false); fetchTraineeMatches(trainee.id); }
                        }}><Eye size={16} /></button>
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

  // Trainee Profile Modal
  const renderTraineeModal = () => {
    if (!selectedTrainee) return null;
    const traineeData = selectedTrainee.traineeData || selectedTrainee;
    const userInfo = traineeData.userInfo || {};

    return (
      <div className="modal-overlay" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>
        <div className="modal-content trainee-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><User size={24} /><h2>{userInfo.name || selectedTrainee.name}</h2></div>
            <button className="modal-close" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}><X size={24} /></button>
          </div>
          <div className="modal-body">
            {traineeMatchesLoading ? (
              <div className="loading-state"><div className="loading-spinner"></div><p>Loading trainee matches...</p></div>
            ) : (
              <>
                <div className="trainee-details-section">
                  <div className="mapping-status-section">
                    <h4>Project Mapping</h4>
                    <div className={`mapping-status ${selectedTrainee.isMapped ? 'mapped' : 'unmapped'}`}>
                      <div className="status-indicator">
                        {selectedTrainee.isMapped ? (
                          <><CheckCircle size={20} /><div><strong>Mapped to Project</strong><p>{selectedTrainee.projectName || 'Unknown Project'}</p><small>Project ID: {selectedTrainee.projectId || 'N/A'}</small></div></>
                        ) : (
                          <><AlertCircle size={20} /><div><strong>Not Assigned</strong><p>This trainee is available for project assignment</p></div></>
                        )}
                      </div>
                      {selectedTrainee.isMapped ? (
                        <button className="btn-danger" onClick={() => handleUnmapFromProject(selectedTrainee)} disabled={loading}>
                          <X size={18} /> Unmap
                        </button>
                      ) : (
                        <div className="available-for-mapping"><p>Available for mapping</p></div>
                      )}
                    </div>
                  </div>
                  <div className="profile-header">
                    <div className="profile-avatar">{selectedTrainee.name.charAt(0)}</div>
                    <div className="profile-info">
                      <h3>{userInfo.name || selectedTrainee.name}</h3>
                      <div className="profile-role">TRAINEE</div>
                      <div className="profile-meta">
                        <span className="profile-meta-item"><MapPin size={16} /> {userInfo.location || selectedTrainee.location}</span>
                        <span className="profile-meta-item"><Mail size={16} /> {selectedTrainee.email}</span>
                        <span className="profile-meta-item"><Target size={16} /> DPI: {traineeData.dpi || 'N/A'}</span>
                        <span className="profile-meta-item"><BarChart2 size={16} /> Score: {userInfo.averageScore || selectedTrainee.score}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="trainee-details-grid">
                    <div className="detail-item"><span className="detail-label">User ID</span><span className="detail-value">{userInfo.userId || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Employee ID</span><span className="detail-value">{userInfo.employeeId || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">ISU</span><span className="detail-value">{userInfo.isu || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Batch</span><span className="detail-value">{traineeData.batch_name || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Batch Rank</span><span className="detail-value">{traineeData.batchRank || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Group Rank</span><span className="detail-value">{traineeData.groupRank || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Avg Score</span><span className="detail-value">{userInfo.averageScore || 0}%</span></div>
                  </div>
                  <div className="skills-section">
                    <h4>Strengths</h4>
                    <div className="skills-list">
                      {traineeData.strengths?.map((strength, index) => (
                        <span key={index} className="skill-tag tech-tag">{strength.courseName} ({strength.avgScore}%)</span>
                      )) || <span className="no-data">None</span>}
                    </div>
                    <h4>Weaknesses</h4>
                    <div className="skills-list">
                      {traineeData.weaknesses?.map((weakness, index) => (
                        <span key={index} className="skill-tag soft-tag">{weakness.courseName} ({weakness.avgScore}%)</span>
                      )) || <span className="no-data">None</span>}
                    </div>
                    <h4>Certificates</h4>
                    <div className="skills-list">
                      {traineeData.certificates ? <span className="skill-tag">{traineeData.certificates}</span> : <span className="no-data">None</span>}
                    </div>
                  </div>
                </div>
                {!selectedTrainee.isMapped && (
                  <div className="projects-section">
                    <div className="projects-header">
                      <h3 className="section-title"><Briefcase size={18} /> Project Matches {traineeMatches && <span className="project-count">({traineeMatches.total_matches} matches)</span>}</h3>
                    </div>
                    {traineeMatches ? (
                      <>
                        {traineeMatches.total_matches === 0 ? (
                          <div className="no-matches open-pool-message">
                            <Users2 size={48} /><h3>No Job Matches Found</h3><p>This trainee has no matches.</p>
                            <div className="open-pool-info"><p><strong>Open Pool</strong></p>
                              <button className="btn-primary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); setActiveTab('createJob'); }}><Plus size={18} /> Create New Job</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {traineeMatches.perfect_match?.length > 0 && (
                              <div className="bucket-section bucket-perfect">
                                <h3 className="bucket-title">Perfect Match ({traineeMatches.perfect_match.length})</h3>
                                <div className="projects-grid">
                                  {traineeMatches.perfect_match.map((match) => {
                                    const job = jobs.find(j => j.id === match.job_id);
                                    if (job && job.openings <= 0) return null;
                                    return (
                                      <div key={match.match_id} className="project-match-card">
                                        <div className="match-card-header">
                                          <div className="project-title">
                                            <h4>{match.job_title}</h4>
                                            <div className="project-meta"><span><Building size={14} /> Job ID: #{match.job_id}</span><span><MapPin size={14} /> {Array.isArray(match.job_location) ? match.job_location.join(', ') : match.job_location}</span></div>
                                          </div>
                                          <div className={`match-score ${match.total_percentage >= 80 ? 'high' : match.total_percentage >= 50 ? 'medium' : 'low'}`}><Target size={14} /> {match.total_percentage.toFixed(1)}%</div>
                                        </div>
                                        <div className="match-details">
                                          <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
                                          <span>Location: {match.location_percentage.toFixed(1)}%</span>
                                          <span><Calendar size={14} /> Posted: {match.posted_date}</span>
                                        </div>
                                        <div className="project-actions">
                                          <button className="map-to-project-btn" onClick={() => {
                                            const job = jobs.find(j => j.id === match.job_id);
                                            if (job) {
                                              if (job.openings <= 0) { toast.error('No openings'); return; }
                                              handleMapToProject(selectedTrainee, job);
                                            }
                                          }} disabled={job && job.openings <= 0}><Link size={16} /> {job && job.openings <= 0 ? 'Full' : 'Map'}</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {/* Additional buckets can be added similarly */}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="no-matches-data">
                        <Users size={48} /><h3>No match data</h3><p>Click to fetch matches.</p>
                        <button className="btn-primary" onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}><Search size={18} /> Find Matches</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>Close</button>
            {!selectedTrainee.isMapped && !traineeMatches && !traineeMatchesLoading && (
              <button className="btn-primary" onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}><Search size={18} /> Find Matches</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Interview Locks Tab
  const renderInterviewLocks = () => {
    return (
      <div className="interview-locks">
        <div className="section-header">
          <div className="header-title"><h2><Lock size={24} /> Interview Locks</h2><p className="subtitle">Track locked candidates</p></div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => requestDownload('lock-report', {})}><Download size={18} /> All</button>
            <button className="btn-secondary" onClick={() => requestDownload('lock-report', { status: 'selected' })}><CheckCircle size={18} /> Selected</button>
            <button className="btn-secondary" onClick={() => requestDownload('lock-report', { status: 'rejected' })}><XCircle size={18} /> Rejected</button>
          </div>
        </div>
        {lockStats && (
          <div className="stats-grid small">
            <div className="stat-card"><div className="stat-icon"><Lock size={20} /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.total_locked}</div></div></div>
            <div className="stat-card"><div className="stat-icon"><CheckCircle size={20} /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.total_selected}</div></div></div>
            <div className="stat-card"><div className="stat-icon"><XCircle size={20} /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.total_rejected}</div></div></div>
          </div>
        )}
        <div className="search-filter">
          <div className="filter-group">
            <select className="filter-select" value={lockFilter.status} onChange={(e) => setLockFilter({ ...lockFilter, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="locked">Locked</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}>
              <option value="">All Jobs</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            <button className="btn-icon" onClick={() => setLockFilter({ status: '', job: '' })}><X size={18} /></button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="loading-spinner"></div></div> : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Job</th>
                  <th>Interviewer</th>
                  <th>Date/Time</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Locked By</th>
                  <th>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {interviewLocks.map(lock => (
                  <tr key={lock.id}>
                    <td><span className="font-medium">{lock.trainee_name}</span></td>
                    <td>{lock.job_title}</td>
                    <td>{lock.assigned_to_name || '-'}</td>
                    <td>{new Date(lock.interview_datetime).toLocaleString()}</td>
                    <td><span className={`status-badge status-${lock.status}`}>{lock.status}</span></td>
                    <td>{lock.comments || '-'}</td>
                    <td>{lock.locked_by_name}</td>
                    <td>
                      <button className="btn-icon btn-icon-view" onClick={() => {
                        const trainee = allTrainees.find(t => t.id === lock.trainee);
                        if (trainee) handleViewTraineeProfile(trainee);
                      }}><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
                {interviewLocks.length === 0 && (
                  <tr><td colSpan="8" className="no-data">No locks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex-end margin-top-1">
          <button className="btn-secondary" onClick={() => requestDownload('interview-filtered')} disabled={interviewLocks.length === 0}>
            <Download size={18} /> Download Filtered
          </button>
        </div>
      </div>
    );
  };

  // Selected Tab
  const renderSelected = () => (
    <div className="selected-tab">
      <div className="section-header">
        <h2><CheckCircle size={24} /> Selected Candidates</h2>
        <div className="flex-row gap-1">
          <select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}>
            <option value="">All Jobs</option>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => requestDownload('selected')}><Download size={18} /> Download All</button>
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
                  <button className="btn-icon" onClick={() => {
                    const trainee = allTrainees.find(t => t.userId === c.trainee_id);
                    if (trainee) handleViewTraineeProfile(trainee);
                  }}><User size={16} /></button>
                  {c.source === 'Interview' && c.lock_id && (
                    <button className="btn-icon btn-danger" onClick={() => handleCancelSelected(c.lock_id)} title="Cancel Selection">
                      <X size={16} />
                    </button>
                  )}
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

  // Rejected Tab
  const renderRejected = () => (
    <div className="rejected-tab">
      <div className="section-header">
        <h2><XCircle size={24} /> Rejected Candidates</h2>
        <div className="flex-row gap-1">
          <select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}>
            <option value="">All Jobs</option>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => requestDownload('rejected')}><Download size={18} /> Download All</button>
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
                  <button className="btn-icon" onClick={() => {
                    const trainee = allTrainees.find(t => t.id === lock.trainee);
                    if (trainee) handleViewTraineeProfile(trainee);
                  }}><User size={16} /></button>
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

  // Feedback Modal
  const renderFeedbackModal = () => {
    if (!viewingFeedback) return null;
    const fb = viewingFeedback;
    return (
      <div className="modal-overlay" onClick={() => setViewingFeedback(null)}>
        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Interview Feedback</h3>
            <button className="modal-close" onClick={() => setViewingFeedback(null)}><X /></button>
          </div>
          <div className="modal-body">
            <p><strong>Interviewer:</strong> {fb.interviewer_name}</p>
            <p><strong>Date:</strong> {new Date(fb.feedback_date).toLocaleString()}</p>
            <p><strong>Questions:</strong> {fb.questions_asked} asked, {fb.questions_answered} answered</p>
            <p><strong>Attitude Rating:</strong> {fb.attitude_rating}/5</p>
            {fb.behaviour_notes && <p><strong>Behaviour Notes:</strong> {fb.behaviour_notes}</p>}
            {fb.technical_skills_assessed?.length > 0 && (
              <div><strong>Skills Assessed:</strong> {fb.technical_skills_assessed.join(', ')}</div>
            )}
            {fb.strengths && <p><strong>Strengths:</strong> {fb.strengths}</p>}
            {fb.weaknesses && <p><strong>Weaknesses:</strong> {fb.weaknesses}</p>}
            {fb.upskill_needed && <p><strong>Upskilling Needed:</strong> {fb.upskill_needed}</p>}
            {fb.overall_comments && <p><strong>Overall Comments:</strong> {fb.overall_comments}</p>}
            <p><strong>Recommendation:</strong> {fb.recommendation === 'selected' ? '✅ Selected' : '❌ Rejected'}</p>
          </div>
          <div className="modal-actions"><button className="btn-secondary" onClick={() => setViewingFeedback(null)}>Close</button></div>
        </div>
      </div>
    );
  };

  // Lock Interview Modal
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
              <input
                type="datetime-local"
                className="form-control"
                value={lockInterviewDatetime}
                onChange={(e) => setLockInterviewDatetime(e.target.value)}
                min={new Date().toISOString().slice(0,16)}
                required
              />
            </div>
            <div className="form-group">
              <label>Assign to Interviewer *</label>
              <select className="form-control" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} required>
                <option value="">Select Interviewer</option>
                {interviewers.map(usr => <option key={usr.id} value={usr.id}>{usr.username}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Comments (optional)</label>
              <textarea className="form-control" rows="3" value={lockComments} onChange={(e) => setLockComments(e.target.value)} placeholder="Add notes..." />
            </div>
            <p>Selected trainees: {selectedTraineeIds.length}</p>
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

  // Talent Search Tab
  const renderTalentSearch = () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = allTrainees.find(t => t.userId === m.trainee_id);
      return !(trainee && trainee.isMapped && trainee.projectId === selectedJobForSearch.id.toString());
    });
    const jobHasOpenings = selectedJobForSearch && (selectedJobForSearch.openings > selectedJobForSearch.filled);

    return (
      <div className="talent-search">
        <div className="section-header">
          <h2><Users size={24} /> Talent Search</h2>
          <p className="subtitle">Find the best candidates for your job</p>
        </div>

        <div className="search-job-selector">
          <label>Select Job:</label>
          <select
            className="form-control"
            value={selectedJobForSearch?.id || ''}
            onChange={(e) => handleJobSelectForSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          >
            <option value="">-- Choose a job --</option>
            {jobs.filter(job => job.status === 'active' && job.openings > job.filled).map(job => (
              <option key={job.id} value={job.id}>{job.title} (Openings: {job.openings - job.filled})</option>
            ))}
          </select>
        </div>

        {selectedJobForSearch && (
          <>
            <div className="filters-panel">
              <div className="filter-group">
                <label>Bucket</label>
                <select
                  className="filter-select"
                  value={searchFilters.bucket}
                  onChange={(e) => setSearchFilters({ ...searchFilters, bucket: e.target.value })}
                >
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
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by location"
                  value={searchFilters.location}
                  onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
                />
              </div>
              <div className="filter-group">
                <label>Min Total %</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="100"
                  value={searchFilters.minTotal}
                  onChange={(e) => setSearchFilters({ ...searchFilters, minTotal: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="filter-group">
                <label>Skill Keyword</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., React"
                  value={searchFilters.skillKeyword}
                  onChange={(e) => setSearchFilters({ ...searchFilters, skillKeyword: e.target.value })}
                />
              </div>
              <div className="filter-group align-end">
                <button className="btn-icon" onClick={() => setSearchFilters({ bucket: '', location: '', minTotal: 0, skillKeyword: '' })}>
                  <X size={18} /> Clear
                </button>
              </div>
            </div>

            <div className="table-actions">
              <div>
                <input
                  type="checkbox"
                  checked={selectAll && filtered.length > 0 && filtered.every(m => selectedSearchTraineeIds.includes(String(m.trainee_id)))}
                  onChange={handleSelectAllSearch}
                  disabled={!jobHasOpenings}
                /> Select All ({filtered.length} matches)
                {!jobHasOpenings && <span className="warning-text">(No openings left)</span>}
              </div>
              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedTraineeIds(selectedSearchTraineeIds);
                    setSelectedJob(selectedJobForSearch);
                    fetchInterviewers();
                    setShowLockModal(true);
                  }}
                  disabled={selectedSearchTraineeIds.length === 0 || !jobHasOpenings}
                >
                  <Lock size={18} /> Lock Selected ({selectedSearchTraineeIds.length})
                </button>
                <button className="btn-secondary" onClick={() => requestDownload('search')} disabled={filtered.length === 0}>
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
                      <th>Location</th>
                      <th>Bucket</th>
                      <th>Skills %</th>
                      <th>Location %</th>
                      <th>Total %</th>
                      <th>Matched Skills</th>
                      <th>Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                    {filtered.map((match) => {
                      const disabled = !jobHasOpenings;
                      return (
                        <tr key={match.trainee_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedSearchTraineeIds.includes(String(match.trainee_id))}
                              onChange={(e) => {
                                const id = String(match.trainee_id);
                                if (e.target.checked) {
                                  setSelectedSearchTraineeIds([...selectedSearchTraineeIds, id]);
                                } else {
                                  setSelectedSearchTraineeIds(selectedSearchTraineeIds.filter(pid => pid !== id));
                                  setSelectAll(false);
                                }
                              }}
                              disabled={disabled}
                            />
                          </td>
                          <td><span className="font-medium">{match.trainee_name}</span></td>
                          <td>{match.trainee_location}</td>
                          <td>
                            <span className={`bucket-tag ${match.bucket?.toLowerCase()}`}>
                              {match.bucket === 'NEARBY' ? 'Proximity' : match.bucket?.replace('_', ' ')}
                            </span>
                          </td>
                          <td>{match.skills_percentage.toFixed(1)}%</td>
                          <td>{match.location_percentage.toFixed(1)}%</td>
                          <td><strong>{match.total_percentage.toFixed(1)}%</strong></td>
                          <td>
                            {match.matched_skills?.length > 0
                              ? match.matched_skills.join(', ')
                              : '-'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-icon-view"
                                onClick={() => handleViewTraineeProfileFromJob(match)}
                                title="View Profile"
                              >
                                <User size={16} />
                              </button>
                              <button
                                className="btn-icon btn-icon-map"
                                onClick={() => {
                                  if (!jobHasOpenings) {
                                    toast.error('No openings left');
                                    return;
                                  }
                                  handleMapToProject(match, selectedJobForSearch);
                                }}
                                disabled={!jobHasOpenings}
                                title="Map to Project"
                              >
                                <Link size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan="9" className="no-data">No matches match your filters</td></tr>
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

  // Sidebar items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'jobs', label: 'Job Management', icon: <Briefcase size={20} /> },
    { id: 'trainees', label: 'Trainees', icon: <Users size={20} /> },
    { id: 'talentSearch', label: 'Talent Search', icon: <Search size={20} /> },
    { id: 'interviewLocks', label: 'Interview Locks', icon: <Lock size={20} /> },
    { id: 'selected', label: 'Selected', icon: <CheckCircle size={20} /> },
    { id: 'rejected', label: 'Rejected', icon: <XCircle size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'jobs': return renderJobManagement();
      case 'createJob': return renderCreateJob();
      case 'trainees':
      case 'mapped':
      case 'unmapped':
      case 'openPool':
        return renderTraineesList();
      case 'talentSearch': return renderTalentSearch();
      case 'interviewLocks': return renderInterviewLocks();
      case 'selected': return renderSelected();
      case 'rejected': return renderRejected();
      default: return renderDashboard();
    }
  };

  // Batch selector
  const renderBatchSelector = () => (
    <div className="batch-selector">
      <Layers size={18} />
      <select
        value={selectedBatch}
        onChange={(e) => {
          setSelectedBatch(e.target.value);
          setTraineePage(1); // reset pagination
        }}
        className="batch-dropdown"
      >
        <option value="">All Batches</option>
        {availableBatches.map(batch => (
          <option key={batch} value={batch}>{batch}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="dashboard">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-title">
            <h1><LayoutDashboard size={28} /> HR Dashboard</h1>
            <div className="header-subtitle">Welcome back, {userData?.name || 'HR Manager'} | Talent Management</div>
          </div>
          <div className="header-actions">
            {renderBatchSelector()}
            {loading && <div className="loading-indicator"><div className="loading-spinner small"></div><span>Processing...</span></div>}
          </div>
        </div>
        {renderContent()}
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
    </div>
  );
}

export default DashboardHR;