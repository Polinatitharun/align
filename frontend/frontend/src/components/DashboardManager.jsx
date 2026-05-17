// DashboardManager.jsx – Complete Manager Dashboard with all features working
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "./Sidebar";
import "./styles/ManagerDashboard.css";
import {
  LayoutDashboard, Briefcase, Users, CheckCircle, MapPin, Target,
  BriefcaseBusiness, Clock, Calendar, User, Building, AlertCircle,
  Eye, X, BarChart2, Search, ArrowLeft, TrendingUp, TrendingDown,
  Layers, PieChart, Database, XCircle, Download, Lock, RefreshCw,
  Users2, Activity, Award, Globe, LineChart, Sparkles, GraduationCap,
  TrendingUp as TrendingUpIcon, MessageCircle, Zap, Filter, ChevronDown,
  ChevronUp, FileText, BarChart, Table, Grid, List, Sliders, Trash2,
  PlusCircle, MinusCircle, Copy, Check, Send, Paperclip, MoreHorizontal,
  BookOpen, Code, Cpu, Server, Wrench, Info, Loader, Bot, FileSpreadsheet
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import api from "../api/axios";

function DashboardManager({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // ---- Batch Selection ----
  const [selectedBatch, setSelectedBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [unfilteredTrainees, setUnfilteredTrainees] = useState([]);
  const [comparisonBatches, setComparisonBatches] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // ---- Data States ----
  const [jobs, setJobs] = useState([]);
  const [traineesList, setTraineesList] = useState([]);
  const [interviewLocks, setInterviewLocks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedJobForView, setSelectedJobForView] = useState(null);
  const [selectedTraineeForView, setSelectedTraineeForView] = useState(null);
  const [jobMatches, setJobMatches] = useState(null);
  const [traineeMatches, setTraineeMatches] = useState(null);
  const [openPoolTrainees, setOpenPoolTrainees] = useState([]);
  const [openPoolLoading, setOpenPoolLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---- Analytics State ----
  const [analyticsData, setAnalyticsData] = useState({
    skillProficiency: [],
    skillGaps: [],
    hiringFunnel: { matches: 0, locked: 0, selected: 0, mapped: 0 },
    interviewerPerformance: [],
    locationDemand: [],
    weeklyTrend: [],
    aiSummary: "",
    isLoading: false,
    lastAnalyzed: null,
  });

  // ---- Chatbot State ----
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState(true);
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);

  // ---- Filter States ----
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [traineeSearchTerm, setTraineeSearchTerm] = useState("");
  const [traineeLocationFilter, setTraineeLocationFilter] = useState("all");
  const [traineeMappingFilter, setTraineeMappingFilter] = useState("all");

  // ---- Talent Search State ----
  const [selectedJobForSearch, setSelectedJobForSearch] = useState(null);
  const [searchJobMatches, setSearchJobMatches] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    bucket: "", location: "", minTotal: 0, skillKeyword: "",
  });
  const [selectedSearchTraineeIds, setSelectedSearchTraineeIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockInterviewDatetime, setLockInterviewDatetime] = useState("");
  const [lockComments, setLockComments] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [interviewers, setInterviewers] = useState([]);

  // ---- Loading States ----
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [traineeMatchesLoading, setTraineeMatchesLoading] = useState(false);

  // ---- Skill Gap Analyzer State ----
  const [skillGapData, setSkillGapData] = useState([]);
  const [skillGapFilter, setSkillGapFilter] = useState("all");

  // ---- Last Refresh ----
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ==================== Helper Functions ====================
  const getBatchParam = () => (selectedBatch ? `?batch=${selectedBatch}` : '');
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  };
  const cap = (s) => (typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1) : s);

  // ==================== Data Fetching ====================
  const refreshCurrentView = async () => {
    setLastRefresh(new Date());
    setLoading(true);
    try {
      await Promise.all([
        fetchJobs(),
        fetchTrainees(),
        fetchLocks(),
        fetchRecommendations()
      ]);
      if (activeTab === "open-pool") await fetchOpenPoolTrainees();
      if (activeTab === "analytics") await runAnalytics();
      toast.success("Data refreshed");
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullTraineeListForBatches = async () => {
    try {
      const response = await api.get("/api/profiles/");
      const transformed = response.data.map(t => ({ ...t, batch_name: t.batch_name }));
      setUnfilteredTrainees(transformed);
      const batches = [...new Set(transformed.map(t => t.batch_name).filter(Boolean))];
      setAvailableBatches(batches);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  useEffect(() => {
    fetchFullTraineeListForBatches();
    fetchJobs();
    fetchTrainees();
    fetchLocks();
    fetchRecommendations();
    checkOllamaAvailability();
    fetchChatSessions();
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchTrainees();
    fetchLocks();
    fetchRecommendations();
    if (activeTab === "open-pool") fetchOpenPoolTrainees();
  }, [selectedBatch]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const url = `/jobs/${getBatchParam()}`;
      const response = await api.get(url);
      setJobs(Array.isArray(response.data) ? response.data : []);
      setJobsError(null);
    } catch (error) {
      setJobsError(error?.response?.data || error?.message || "Unknown error");
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchTrainees = async () => {
    try {
      const url = `/api/profiles/${getBatchParam()}`;
      const response = await api.get(url);
      if (Array.isArray(response.data)) setTraineesList(response.data);
    } catch (error) {
      toast.error("Failed to fetch trainee profiles");
    }
  };

  const fetchLocks = async () => {
    try {
      const url = `/interview-locks/${getBatchParam()}`;
      const response = await api.get(url);
      setInterviewLocks(response.data);
    } catch (error) {
      console.error("Error fetching locks:", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.get("/jobs/recommendations/");
      setRecommendations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
      setRecommendations([]);
    }
  };

  useEffect(() => {
    if (activeTab === "open-pool") fetchOpenPoolTrainees();
  }, [activeTab, traineesList, selectedBatch]);

  const fetchOpenPoolTrainees = async () => {
    setOpenPoolLoading(true);
    try {
      const allTrainees = normalizedTrainees;
      const noMatchTrainees = [];
      for (const trainee of allTrainees) {
        if (trainee.isMapped) continue;
        try {
          const res = await api.get(`/trainee-matches/${trainee.id}/${getBatchParam()}`);
          const data = res.data;
          const hasMatches = (data.perfect_match?.length || 0) + (data.skills_only?.length || 0) +
                            (data.location_only?.length || 0) + (data.nearby?.length || 0) > 0;
          if (!hasMatches) noMatchTrainees.push(trainee);
        } catch {
          noMatchTrainees.push(trainee);
        }
      }
      setOpenPoolTrainees(noMatchTrainees);
    } catch (error) {
      toast.error("Failed to fetch open pool");
    } finally {
      setOpenPoolLoading(false);
    }
  };

  // ==================== Analytics Computation ====================
  const runAnalytics = async () => {
    setAnalyticsData(prev => ({ ...prev, isLoading: true }));
    try {
      await Promise.all([fetchJobs(), fetchTrainees(), fetchLocks(), fetchRecommendations()]);
      
      const currentJobs = jobs.length ? jobs : await (await api.get(`/jobs/${getBatchParam()}`)).data;
      const currentTrainees = normalizedTrainees;
      const currentLocks = interviewLocks;

      // Skill Proficiency
      const skillScores = new Map();
      currentTrainees.forEach(t => {
        (t.strengths || []).forEach(s => {
          const name = s.courseName;
          const score = s.avgScore || 0;
          if (!skillScores.has(name)) skillScores.set(name, { sum: 0, count: 0 });
          const d = skillScores.get(name);
          d.sum += score;
          d.count++;
        });
      });
      const skillProficiency = Array.from(skillScores.entries())
        .map(([skill, { sum, count }]) => ({ skill, avgScore: sum / count }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      // Skill Gaps
      const demandMap = new Map();
      currentJobs.forEach(job => {
        const skills = job.skills ? job.skills.split(',').map(s => s.trim()) : [];
        skills.forEach(skill => {
          demandMap.set(skill, (demandMap.get(skill) || 0) + 1);
        });
      });
      const supplyMap = new Map();
      currentTrainees.forEach(t => {
        (t.skills || []).forEach(skill => {
          supplyMap.set(skill, (supplyMap.get(skill) || 0) + 1);
        });
      });
      const skillGaps = [];
      demandMap.forEach((demand, skill) => {
        const supply = supplyMap.get(skill) || 0;
        skillGaps.push({ skill, demand, supply, gap: demand - supply });
      });
      skillGaps.sort((a, b) => b.gap - a.gap);
      setSkillGapData(skillGaps);

      // Hiring Funnel
      const matchesCount = currentJobs.reduce((acc, job) => acc + (job.matches || 0), 0);
      const lockedCount = currentLocks.filter(l => l.status === "locked").length;
      const selectedCount = currentLocks.filter(l => l.status === "selected").length;
      const mappedCount = currentTrainees.filter(t => t.isMapped).length;
      const hiringFunnel = {
        matches: matchesCount,
        locked: lockedCount,
        selected: selectedCount,
        mapped: mappedCount,
      };

      // Interviewer Performance
      const interviewerMap = new Map();
      currentLocks.forEach(lock => {
        const name = lock.assigned_to_name || "Unknown";
        if (!interviewerMap.has(name)) {
          interviewerMap.set(name, { interviews: 0, selections: 0 });
        }
        const stats = interviewerMap.get(name);
        stats.interviews++;
        if (lock.status === "selected") stats.selections++;
      });
      const interviewerPerformance = Array.from(interviewerMap.entries())
        .map(([name, { interviews, selections }]) => ({
          name,
          interviews,
          selectionRate: interviews ? (selections / interviews) * 100 : 0,
        }))
        .sort((a, b) => b.selectionRate - a.selectionRate);

      // Location vs Demand
      const locationJobMap = new Map();
      currentJobs.forEach(job => {
        const locs = job.location ? (Array.isArray(job.location) ? job.location : [job.location]) : [];
        locs.forEach(loc => {
          if (loc) locationJobMap.set(loc, (locationJobMap.get(loc) || 0) + 1);
        });
      });
      const locationTraineeMap = new Map();
      currentTrainees.forEach(t => {
        if (t.location) locationTraineeMap.set(t.location, (locationTraineeMap.get(t.location) || 0) + 1);
      });
      const allLocations = new Set([...locationJobMap.keys(), ...locationTraineeMap.keys()]);
      const locationDemand = Array.from(allLocations).map(loc => ({
        location: loc,
        jobCount: locationJobMap.get(loc) || 0,
        traineeCount: locationTraineeMap.get(loc) || 0,
      }));

      // Weekly Trend (last 4 weeks)
      const weeklyMap = new Map();
      const today = new Date();
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - i * 7);
        const weekKey = weekStart.toISOString().slice(0, 10);
        weeklyMap.set(weekKey, { week: weekKey, selections: 0 });
      }
      currentLocks.forEach(lock => {
        if (lock.status === 'selected' && lock.created_at) {
          const lockDate = new Date(lock.created_at);
          for (let [key, value] of weeklyMap.entries()) {
            const weekStart = new Date(key);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            if (lockDate >= weekStart && lockDate < weekEnd) {
              value.selections += 1;
              break;
            }
          }
        }
      });
      const weeklyTrend = Array.from(weeklyMap.values());

      // AI Summary
      const selectionRate = lockedCount ? (selectedCount / lockedCount) * 100 : 0;
      const mappingRate = currentTrainees.length ? (mappedCount / currentTrainees.length) * 100 : 0;
      const topGaps = skillGaps.filter(g => g.gap > 0).slice(0, 3).map(g => g.skill).join(", ");
      const aiSummary = `📊 ${currentTrainees.length} trainees, mapping rate ${mappingRate.toFixed(1)}%. Top skill gaps: ${topGaps || "none"}. Selection rate: ${selectionRate.toFixed(1)}%.`;

      setAnalyticsData({
        skillProficiency,
        skillGaps: skillGaps.slice(0, 5),
        hiringFunnel,
        interviewerPerformance,
        locationDemand,
        weeklyTrend,
        aiSummary,
        isLoading: false,
        lastAnalyzed: new Date().toLocaleString(),
      });
    } catch (err) {
      console.error("Analytics error:", err);
      toast.error("Failed to run analytics");
      setAnalyticsData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Auto-run analytics when tab opens
  useEffect(() => {
    if (activeTab === "analytics" && !analyticsData.lastAnalyzed && !analyticsData.isLoading) {
      runAnalytics();
    }
  }, [activeTab]);

  // ==================== Computed Data ====================
  const normalizedTrainees = useMemo(() => {
    return traineesList.map((t) => {
      const strengthSkills = t.strengths ? t.strengths.map(s => s.courseName) : [];
      const upskillSkills = t.upskillCourses ? (Array.isArray(t.upskillCourses) ? t.upskillCourses : []) : [];
      const combinedSkills = [...new Set([...strengthSkills, ...upskillSkills])];
      return {
        ...t,
        id: t.id,
        userId: t.userInfo?.userId,
        name: t.userInfo?.name || "Unknown",
        location: (t.userInfo?.location || "").toLowerCase(),
        employeeId: t.userInfo?.employeeId || "—",
        averageScore: t.userInfo?.averageScore || 0,
        isMapped: t.userInfo?.isMapped || false,
        projectId: t.userInfo?.projectId || null,
        projectName: t.userInfo?.projectName || null,
        skills: combinedSkills,
        strengths: t.strengths || [],
        weaknesses: t.weaknesses || [],
        batch_name: t.batch_name,
      };
    });
  }, [traineesList]);

  const mappedUnmappedStats = useMemo(() => {
    const mapped = normalizedTrainees.filter(t => t.isMapped).length;
    const unmapped = normalizedTrainees.filter(t => !t.isMapped).length;
    return { mapped, unmapped, total: mapped + unmapped };
  }, [normalizedTrainees]);

  const lockStats = useMemo(() => {
    const locked = interviewLocks.filter(l => l.status === "locked").length;
    const selected = interviewLocks.filter(l => l.status === "selected").length;
    const rejected = interviewLocks.filter(l => l.status === "rejected").length;
    return { locked, selected, rejected };
  }, [interviewLocks]);

  const filteredTrainees = useMemo(() => {
    return normalizedTrainees.filter(t => {
      if (traineeSearchTerm.trim()) {
        const search = traineeSearchTerm.toLowerCase();
        if (!t.name.toLowerCase().includes(search) && !t.employeeId.toLowerCase().includes(search) && !t.location.includes(search))
          return false;
      }
      if (traineeLocationFilter !== "all" && t.location !== traineeLocationFilter) return false;
      if (traineeMappingFilter !== "all") {
        if (traineeMappingFilter === "mapped" && !t.isMapped) return false;
        if (traineeMappingFilter === "unmapped" && t.isMapped) return false;
      }
      return true;
    });
  }, [normalizedTrainees, traineeSearchTerm, traineeLocationFilter, traineeMappingFilter]);

  const uniqueLocations = useMemo(() => ["all", ...new Set(normalizedTrainees.map(t => t.location).filter(Boolean))], [normalizedTrainees]);

  // ==================== Job Details / Matches ====================
  useEffect(() => {
    if (selectedJobForView) fetchJobMatches(selectedJobForView.id);
  }, [selectedJobForView]);

  const fetchJobMatches = async (jobId) => {
    setMatchesLoading(true);
    try {
      const response = await api.get(`/matches/${jobId}/${getBatchParam()}`);
      setJobMatches(response.data);
    } catch {
      setJobMatches({ perfect_match: [], skills_only: [], location_only: [], nearby: [], no_match: [], total_matches: 0 });
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTraineeForView) {
      fetchTraineeMatches(selectedTraineeForView.id);
    }
  }, [selectedTraineeForView]);

  const fetchTraineeMatches = async (traineeId) => {
    setTraineeMatchesLoading(true);
    try {
      const response = await api.get(`/trainee-matches/${traineeId}/${getBatchParam()}`);
      setTraineeMatches(response.data);
    } catch {
      setTraineeMatches({ perfect_match: [], skills_only: [], location_only: [], nearby: [], no_match: [], total_matches: 0 });
    } finally {
      setTraineeMatchesLoading(false);
    }
  };

  // ==================== Talent Search ====================
  const handleJobSelectForSearch = (jobId) => {
    const job = jobs.find(j => j.id === parseInt(jobId));
    setSelectedJobForSearch(job);
    if (job) {
      setSearchLoading(true);
      api.get(`/matches/${job.id}/${getBatchParam()}`)
        .then(res => setSearchJobMatches(res.data))
        .catch(() => toast.error("Failed to fetch matches"))
        .finally(() => setSearchLoading(false));
      setSelectedSearchTraineeIds([]);
      setSelectAll(false);
    } else setSearchJobMatches(null);
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
    const filtered = filteredSearchMatches();
    if (selectAll) setSelectedSearchTraineeIds([]);
    else setSelectedSearchTraineeIds(filtered.map(m => String(m.trainee_id)));
    setSelectAll(!selectAll);
  };

  const handleLockFromSearch = async () => {
    if (selectedSearchTraineeIds.length === 0) return toast.error("Select at least one trainee");
    if (!lockInterviewDatetime) return toast.error("Select interview date/time");
    if (!assignedToId) return toast.error("Select an interviewer");
    try {
      await api.post("/interview-locks/bulk_create/", {
        trainee_ids: selectedSearchTraineeIds,
        job_id: selectedJobForSearch.id,
        interview_datetime: lockInterviewDatetime,
        comments: lockComments,
        assigned_to: assignedToId,
      });
      toast.success(`Locked ${selectedSearchTraineeIds.length} trainee(s)`);
      setShowLockModal(false);
      setSelectedSearchTraineeIds([]);
      setSelectAll(false);
      setLockInterviewDatetime("");
      setLockComments("");
      setAssignedToId("");
      handleJobSelectForSearch(selectedJobForSearch.id);
      fetchLocks();
    } catch {
      toast.error("Failed to lock trainees");
    }
  };

  const downloadFilteredSearch = () => {
    const filtered = filteredSearchMatches();
    if (!filtered.length) return toast.error("No data");
    const csvRows = [];
    csvRows.push(["Trainee Name", "Location", "Bucket", "Matched Location", "Skills %", "Location %", "Total %", "Matched Skills"].join(","));
    filtered.forEach(m => {
      const exportSkills = Array.isArray(m.matched_skills) ? m.matched_skills : m.matched_skills ? [m.matched_skills] : [];
      csvRows.push([
        `"${m.trainee_name}"`,
        `"${m.trainee_location || ""}"`,
        m.bucket,
        `"${m.matched_location || ""}"`,
        m.skills_percentage,
        m.location_percentage,
        m.total_percentage,
        `"${exportSkills.join("; ")}"`,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_matches_${selectedJobForSearch?.project_name || "search"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchInterviewers = async () => {
    try {
      const res = await api.get("/users/?role=interviewer");
      setInterviewers(res.data);
    } catch {
      toast.error("Failed to load interviewers");
    }
  };

  // ==================== Download Reports ====================
  const downloadReport = async (type) => {
    try {
      const response = await api.get(`/reports/${type}/${getBatchParam()}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  const downloadLockReport = async (status = "") => {
    try {
      const url = `/interview-locks/report/${status ? `?status=${status}${getBatchParam()}` : getBatchParam()}`;
      const response = await api.get(url, { responseType: "blob" });
      const urlBlob = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `interview_locks${status ? "_" + status : ""}.csv`;
      a.click();
      URL.revokeObjectURL(urlBlob);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
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

  // ==================== Chatbot ====================
  const fetchChatSessions = async () => {
    try {
      const res = await api.get('/manager/chat-sessions/');
      setChatSessions(res.data);
      if (res.data.length > 0) {
        setActiveSessionId(res.data[0].id);
        setChatMessages(res.data[0].messages || []);
      } else {
        createNewChatSession();
      }
    } catch (err) {
      console.error("Failed to fetch chat sessions", err);
      createNewChatSession();
    }
  };

  const createNewChatSession = async () => {
    try {
      const res = await api.post('/manager/chat-sessions/', {});
      setChatSessions(prev => [res.data, ...prev]);
      setActiveSessionId(res.data.id);
      setChatMessages([]);
    } catch (err) {
      toast.error("Failed to create chat session");
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !activeSessionId) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await api.post(`/manager/chat-sessions/${activeSessionId}/send_message/`, {
        message: userMsg,
        batch: selectedBatch,
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.bot_reply.content }]);
    } catch (err) {
      toast.error("Chatbot error");
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
      setChatLoading(false);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  };

  const checkOllamaAvailability = async () => {
    try {
      const res = await fetch("http://localhost:11434/api/tags", { method: "GET", signal: AbortSignal.timeout(2000) });
      setOllamaAvailable(res.ok);
    } catch {
      setOllamaAvailable(false);
    }
  };

  // ==================== Batch Comparison ====================
  useEffect(() => {
    if (activeTab === "batch-comparison" && comparisonBatches.length > 0) {
      fetchComparisonData();
    }
  }, [comparisonBatches, activeTab]);

  const fetchComparisonData = async () => {
    setComparisonLoading(true);
    try {
      const promises = comparisonBatches.map(async (batch) => {
        const [jobsRes, traineesRes, locksRes] = await Promise.all([
          api.get(`/jobs/?batch=${batch}`),
          api.get(`/api/profiles/?batch=${batch}`),
          api.get(`/interview-locks/?batch=${batch}`),
        ]);
        return {
          batch,
          jobs: jobsRes.data,
          trainees: traineesRes.data,
          locks: locksRes.data,
        };
      });
      const results = await Promise.all(promises);
      const data = results.map(({ batch, jobs, trainees, locks }) => {
        const mapped = trainees.filter(t => t.userInfo?.isMapped).length;
        const totalTrainees = trainees.length;
        const avgScore = trainees.reduce((sum, t) => sum + (t.userInfo?.averageScore || 0), 0) / (totalTrainees || 1);
        const activeJobs = jobs.filter(j => j.status === 'active').length;
        const selected = locks.filter(l => l.status === 'selected').length;
        const locked = locks.filter(l => l.status === 'locked').length;
        return {
          batch,
          totalTrainees,
          mapped,
          mappingRate: totalTrainees ? (mapped / totalTrainees) * 100 : 0,
          avgScore: avgScore.toFixed(1),
          activeJobs,
          selected,
          locked,
          selectionRate: locked ? (selected / locked) * 100 : 0,
        };
      });
      setComparisonData(data);
    } catch (err) {
      toast.error("Failed to fetch comparison data");
    } finally {
      setComparisonLoading(false);
    }
  };

  // ==================== Render Functions ====================
  const renderBatchSelector = () => (
    <div className="batch-selector">
      <Layers size={18} />
      <select value={selectedBatch} onChange={(e) => { setSelectedBatch(e.target.value); setLastRefresh(new Date()); }} className="batch-dropdown">
        <option value="">All Batches</option>
        {availableBatches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
      </select>
    </div>
  );

  const renderMultiBatchSelector = () => (
    <div className="multi-batch-selector">
      <label><Info size={16} /> Select batches to compare</label>
      <div className="batch-checkboxes">
        {availableBatches.map(batch => (
          <label key={batch} className="checkbox-label">
            <input
              type="checkbox"
              checked={comparisonBatches.includes(batch)}
              onChange={(e) => {
                if (e.target.checked) setComparisonBatches(prev => [...prev, batch]);
                else setComparisonBatches(prev => prev.filter(b => b !== batch));
              }}
            />
            {batch}
          </label>
        ))}
      </div>
      {comparisonLoading && <Loader className="spinner" size={16} />}
      <button onClick={fetchComparisonData} className="btn-secondary"><RefreshCw size={14} /> Refresh Comparison</button>
    </div>
  );

  const renderOverview = () => {
    const skillDemand = jobs.reduce((acc, job) => {
      const skills = job.skills ? job.skills.split(',').map(s => s.trim()) : [];
      skills.forEach(s => (acc[s] = (acc[s] || 0) + 1));
      return acc;
    }, {});
    const topSkills = Object.entries(skillDemand).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return (
      <div className="overview">
        <div className="section-header">
          <h2><LayoutDashboard size={24} /> Dashboard Overview</h2>
          <button onClick={refreshCurrentView} className="btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon"><Briefcase /></div><div className="stat-content"><h3>Active Jobs</h3><div className="stat-value">{jobs.filter(j => j.status === 'active').length}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Users /></div><div className="stat-content"><h3>Total Trainees</h3><div className="stat-value">{mappedUnmappedStats.total}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Mapped</h3><div className="stat-value">{mappedUnmappedStats.mapped}</div><div className="stat-detail">{mappedUnmappedStats.total ? Math.round((mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100) : 0}%</div></div></div>
          <div className="stat-card"><div className="stat-icon"><AlertCircle /></div><div className="stat-content"><h3>Unmapped</h3><div className="stat-value">{mappedUnmappedStats.unmapped}</div><div className="stat-detail">{mappedUnmappedStats.total ? Math.round((mappedUnmappedStats.unmapped / mappedUnmappedStats.total) * 100) : 0}%</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Database /></div><div className="stat-content"><h3>Open Pool</h3><div className="stat-value">{openPoolTrainees.length}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Lock /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.locked}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.selected}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><XCircle /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.rejected}</div></div></div>
        </div>
        <div className="charts-grid">
          <div className="chart-card"><h3>Top Skills in Demand</h3><div className="skills-chart">{topSkills.map(([skill, count]) => (<div key={skill} className="skill-row"><span>{skill}</span><div className="bar" style={{ width: `${(count / (topSkills[0]?.[1] || 1)) * 100}%` }}>{count}</div></div>))}</div></div>
          <div className="chart-card"><h3>Trainee Distribution</h3><div className="mapping-chart"><div className="bar-row"><span>Mapped</span><div className="bar" style={{ width: `${(mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100}%` }}>{mappedUnmappedStats.mapped}</div></div><div className="bar-row"><span>Unmapped (with matches)</span><div className="bar" style={{ width: `${((mappedUnmappedStats.unmapped - openPoolTrainees.length) / mappedUnmappedStats.total) * 100}%` }}>{mappedUnmappedStats.unmapped - openPoolTrainees.length}</div></div><div className="bar-row"><span>Open Pool</span><div className="bar" style={{ width: `${(openPoolTrainees.length / mappedUnmappedStats.total) * 100}%` }}>{openPoolTrainees.length}</div></div></div></div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const data = analyticsData;
    return (
      <div className="analytics-tab">
        <div className="section-header">
          <h2><Activity size={24} /> Analytics Dashboard</h2>
          <div className="header-actions">
            <button onClick={downloadHRSummaryPDF} className="btn btn-primary"><FileSpreadsheet size={16} /> Download PDF Report</button>
            <button onClick={runAnalytics} className="btn-primary" disabled={data.isLoading}>
              <RefreshCw size={16} className={data.isLoading ? 'spinning' : ''} /> {data.isLoading ? "Analyzing..." : "Refresh Analytics"}
            </button>
          </div>
        </div>
        {data.lastAnalyzed && <div className="last-analyzed">📊 Last updated: {data.lastAnalyzed}</div>}
        {data.isLoading ? <div className="loading-state"><div className="spinner" /></div> : (
          <div className="analytics-container">
            <div className="analytics-card"><h3><Target size={18} /> Top Skills by Proficiency</h3><div className="bar-chart">{data.skillProficiency.map(s => (<div key={s.skill} className="bar-row"><span>{s.skill}</span><div className="bar" style={{ width: `${s.avgScore}%` }}>{s.avgScore.toFixed(1)}%</div></div>))}</div></div>
            <div className="analytics-card"><h3><AlertCircle size={18} /> Top Skill Gaps</h3><table className="mini-table"><thead><tr><th>Skill</th><th>Demand</th><th>Supply</th><th>Gap</th></tr></thead><tbody>{data.skillGaps.map(g => (<tr key={g.skill}><td>{g.skill}</td><td>{g.demand}</td><td>{g.supply}</td><td style={{ color: g.gap > 0 ? '#ef4444' : '#10b981' }}>{g.gap > 0 ? g.gap : `+${-g.gap}`}</td></tr>))}</tbody></table></div>
            <div className="analytics-card"><h3><PieChart size={18} /> Hiring Funnel</h3><div className="funnel-horizontal"><div>Matches: {data.hiringFunnel.matches}</div><div>→ Locked: {data.hiringFunnel.locked}</div><div>→ Selected: {data.hiringFunnel.selected}</div><div>→ Mapped: {data.hiringFunnel.mapped}</div></div></div>
            <div className="analytics-card"><h3><Award size={18} /> Interviewer Performance</h3><table className="mini-table"><thead><tr><th>Interviewer</th><th>Interviews</th><th>Selection Rate</th></tr></thead><tbody>{data.interviewerPerformance.slice(0, 5).map(i => (<tr key={i.name}><td>{i.name}</td><td>{i.interviews}</td><td>{i.selectionRate.toFixed(1)}%</td></tr>))}</tbody></table></div>
            <div className="analytics-card"><h3><Globe size={18} /> Location Demand</h3><table className="mini-table"><thead><tr><th>Location</th><th>Jobs</th><th>Trainees</th></tr></thead><tbody>{data.locationDemand.map(l => (<tr key={l.location}><td>{cap(l.location)}</td><td>{l.jobCount}</td><td>{l.traineeCount}</td></tr>))}</tbody></table></div>
            <div className="analytics-card"><h3><LineChart size={18} /> Selections Trend (Last 4 Weeks)</h3><ResponsiveContainer width="100%" height={200}><ReBarChart data={data.weeklyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" tickFormatter={(d) => d.slice(5)} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="selections" fill="#3b82f6" /></ReBarChart></ResponsiveContainer></div>
            <div className="analytics-card full-width"><h3><Sparkles size={18} /> AI Summary</h3><div className="ai-summary">{data.aiSummary}</div></div>
          </div>
        )}
      </div>
    );
  };

  const renderJobProfiles = () => {
    const filtered = jobs.filter(j => !jobSearchTerm || j.project_name.toLowerCase().includes(jobSearchTerm.toLowerCase()));
    return (
      <div className="job-profiles">
        <div className="section-header">
          <h2><Briefcase size={24} /> Job Profiles ({jobs.length})</h2>
          <div className="search-box"><input value={jobSearchTerm} onChange={e => setJobSearchTerm(e.target.value)} placeholder="Search jobs..." className="search-input" /></div>
          <button onClick={fetchJobs} className="btn-secondary" disabled={jobsLoading}><RefreshCw size={16} /> Refresh</button>
        </div>
        {jobsLoading ? <div className="loading-state"><div className="spinner" /></div> : jobsError ? <div className="error-message">{JSON.stringify(jobsError)}</div> : (
          <div className="job-profiles-grid">
            {filtered.map(job => (
              <div key={job.id} className="job-profile-card">
                <h3>{job.project_name}</h3>
                <div className="meta"><Building size={14} /> {job.bg || 'N/A'} <MapPin size={14} /> {Array.isArray(job.location) ? job.location.join(", ") : job.location}</div>
                <div className="openings"><Users size={14} /> {job.openings} openings ({job.filled || 0} filled)</div>
                <button onClick={() => { setSelectedJobForView(job); setActiveTab("job-details"); }} className="view-details-btn"><Eye size={16} /> View Details</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderJobDetails = () => {
    if (!selectedJobForView) return null;
    const job = selectedJobForView;
    return (
      <div className="job-details-page">
        <div className="details-nav"><button onClick={() => { setSelectedJobForView(null); setActiveTab("job-profiles"); }} className="back-btn"><ArrowLeft size={18} /> Back to Job Profiles</button></div>
        <div className="job-details-header-card">
          <div className="header-main"><div className="job-icon-large"><BriefcaseBusiness size={32} /></div><div className="job-title-section"><h1>{job.project_name}</h1><div className="job-meta-row"><span className="meta-tag"><Building size={14} /> {job.bg || 'N/A'}</span><span className="meta-tag"><MapPin size={14} /> {Array.isArray(job.location) ? job.location.join(", ") : job.location}</span><span className="meta-tag"><Users size={14} /> {job.openings} openings ({job.filled || 0} filled)</span><span className="meta-tag"><Calendar size={14} /> Posted: {formatDate(job.postedDate)}</span></div></div></div>
          <div className="job-description-box"><h3>Description</h3><p>{job.description || 'No description provided'}</p></div>
          <div className="job-skills-box"><h3>Required Skills</h3><div className="skill-tags">{job.skills ? job.skills.split(',').map(s => <span key={s} className="skill-tag">{s.trim()}</span>) : <span>No skills listed</span>}</div></div>
        </div>
        <h3>Matching Candidates</h3>
        {matchesLoading ? <div className="loading-state"><div className="spinner" /></div> : (
          <div className="match-categories">
            {["perfect_match", "skills_only", "location_only", "nearby", "no_match"].map(cat => (
              <div key={cat} className="match-category">
                <h4 className={`category-title ${cat.replace('_', '')}`}>{cat.replace("_", " ").toUpperCase()} ({jobMatches?.[cat]?.length || 0})</h4>
                <div className="matched-jobs-grid">{(jobMatches?.[cat] || []).map(m => (<div key={m.trainee_id} className="matched-job-card" onClick={() => setSelectedTraineeForView(m)}><div className="job-match-header"><h4>{m.trainee_name}</h4><span className={`match-percentage ${cat.replace('_', '')}`}>{m.total_percentage}%</span></div><div className="match-row"><MapPin size={12} /> {m.trainee_location}</div><div className="match-stats"><div className="match-stat"><span className="stat-label">Skills</span><span className="stat-value">{m.skills_percentage}%</span></div><div className="match-stat"><span className="stat-label">Location</span><span className="stat-value">{m.location_percentage}%</span></div></div></div>))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTrainees = () => (
    <div className="trainees">
      <div className="section-header">
        <h2><Users size={24} /> All Trainees ({filteredTrainees.length})</h2>
        <div className="filter-options">
          <input value={traineeSearchTerm} onChange={e => setTraineeSearchTerm(e.target.value)} placeholder="Search..." className="search-input" />
          <select value={traineeLocationFilter} onChange={e => setTraineeLocationFilter(e.target.value)} className="filter-select"><option value="all">All Locations</option>{uniqueLocations.filter(l => l !== "all").map(l => <option key={l} value={l}>{cap(l)}</option>)}</select>
          <select value={traineeMappingFilter} onChange={e => setTraineeMappingFilter(e.target.value)} className="filter-select"><option value="all">All Status</option><option value="mapped">Mapped</option><option value="unmapped">Unmapped</option></select>
          <button onClick={() => downloadReport("mapped")} className="btn btn-success"><Download size={16} /> Mapped</button>
          <button onClick={() => downloadReport("unmapped")} className="btn btn-danger"><Download size={16} /> Unmapped</button>
          <button onClick={fetchTrainees} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Employee ID</th><th>Location</th><th>Batch</th><th>Avg Score</th><th>Mapping Status</th><th>Actions</th></tr></thead>
          <tbody>{filteredTrainees.map(t => (<tr key={t.id} className="clickable-row"><td><div className="trainee-info"><div className="avatar">{t.name.charAt(0)}</div>{t.name}</div></td><td>{t.employeeId}</td><td>{cap(t.location)}</td><td>{t.batch_name || '—'}</td><td><span className="score-badge">{t.averageScore}%</span></td><td>{t.isMapped ? <span className="status-badge status-approved"><CheckCircle size={12} /> Mapped</span> : <span className="status-badge status-rejected"><AlertCircle size={12} /> Unmapped</span>}</td><td><button className="btn-icon" onClick={() => setSelectedTraineeForView(t)}><Eye size={16} /></button></td></tr>))}</tbody>
        </table>
      </div>
      {/* Trainee Details Modal */}
      {selectedTraineeForView && (
        <div className="modal-overlay" onClick={() => setSelectedTraineeForView(null)}>
          <div className="modal-content trainee-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><User size={20} /> {selectedTraineeForView.name}</h3><button className="modal-close" onClick={() => setSelectedTraineeForView(null)}><X /></button></div>
            <div className="modal-body"><p><strong>Employee ID:</strong> {selectedTraineeForView.employeeId}</p><p><strong>Location:</strong> {cap(selectedTraineeForView.location)}</p><p><strong>Batch:</strong> {selectedTraineeForView.batch_name || 'N/A'}</p><p><strong>Average Score:</strong> {selectedTraineeForView.averageScore}%</p><p><strong>Status:</strong> {selectedTraineeForView.isMapped ? `Mapped to ${selectedTraineeForView.projectName}` : 'Unmapped'}</p><h4>Skills</h4><div className="skill-tags">{selectedTraineeForView.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}</div><h4>Matched Jobs</h4>{traineeMatchesLoading ? <div className="spinner" /> : <div>{(traineeMatches?.perfect_match?.length || 0) + (traineeMatches?.skills_only?.length || 0)} matches found</div>}</div>
            <div className="modal-actions"><button className="btn-secondary" onClick={() => setSelectedTraineeForView(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOpenPool = () => {
    const filtered = openPoolTrainees.filter(t => !traineeSearchTerm || t.name.toLowerCase().includes(traineeSearchTerm.toLowerCase()));
    return (
      <div className="open-pool">
        <div className="section-header">
          <h2><Database size={24} /> Open Pool ({openPoolTrainees.length})</h2>
          <input value={traineeSearchTerm} onChange={e => setTraineeSearchTerm(e.target.value)} placeholder="Search open pool..." className="search-input" />
          <button onClick={fetchOpenPoolTrainees} disabled={openPoolLoading} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
        </div>
        {openPoolLoading ? <div className="loading-state"><div className="spinner" /></div> : filtered.length === 0 ? <div className="empty-state"><Database size={40} /><h3>No open pool trainees</h3></div> : (
          <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Location</th><th>Batch</th><th>Avg Score</th><th>Actions</th></tr></thead><tbody>{filtered.map(t => (<tr key={t.id}><td><div className="trainee-info"><div className="avatar">{t.name.charAt(0)}</div>{t.name}</div></td><td>{cap(t.location)}</td><td>{t.batch_name || '—'}</td><td><span className="score-badge">{t.averageScore}%</span></td><td><button className="btn-icon" onClick={() => setSelectedTraineeForView(t)}><Eye size={16} /></button></td></tr>))}</tbody></table></div>
        )}
      </div>
    );
  };

  const renderTalentSearch = () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = normalizedTrainees.find(t => t.userId === m.trainee_id);
      return !(trainee?.isMapped && trainee.projectId === selectedJobForSearch?.id?.toString());
    });
    return (
      <div className="talent-search">
        <div className="section-header">
          <h2><Search size={24} /> Talent Search</h2>
          <select className="job-select filter-select" value={selectedJobForSearch?.id || ""} onChange={e => handleJobSelectForSearch(e.target.value)}><option value="">Select a job</option>{jobs.filter(j => j.status === 'active').map(j => <option key={j.id} value={j.id}>{j.project_name} (Openings: {j.openings - (j.filled || 0)})</option>)}</select>
          <button onClick={refreshCurrentView} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
        </div>
        {selectedJobForSearch && (
          <>
            <div className="filters-panel">
              <select value={searchFilters.bucket} onChange={e => setSearchFilters({ ...searchFilters, bucket: e.target.value })} className="filter-select"><option value="">All Buckets</option>{["PERFECT_MATCH", "SKILLS_ONLY", "LOCATION_ONLY", "NEARBY", "NO_MATCH"].map(b => <option key={b} value={b}>{b.replace("_", " ")}</option>)}</select>
              <input placeholder="Location" value={searchFilters.location} onChange={e => setSearchFilters({ ...searchFilters, location: e.target.value })} className="search-input" />
              <input type="number" placeholder="Min %" value={searchFilters.minTotal} onChange={e => setSearchFilters({ ...searchFilters, minTotal: parseInt(e.target.value) || 0 })} className="search-input" />
              <input placeholder="Skill" value={searchFilters.skillKeyword} onChange={e => setSearchFilters({ ...searchFilters, skillKeyword: e.target.value })} className="search-input" />
              <button onClick={() => setSearchFilters({ bucket: "", location: "", minTotal: 0, skillKeyword: "" })} className="btn-secondary">Clear</button>
            </div>
            <div className="table-actions">
              <label><input type="checkbox" checked={selectAll && filtered.length > 0} onChange={handleSelectAllSearch} disabled={filtered.length === 0} /> Select All ({filtered.length})</label>
              <button onClick={() => { fetchInterviewers(); setShowLockModal(true); }} disabled={!selectedSearchTraineeIds.length} className="btn-primary"><Lock size={16} /> Lock Selected ({selectedSearchTraineeIds.length})</button>
              <button onClick={downloadFilteredSearch} disabled={!filtered.length} className="btn btn-primary"><Download size={16} /> Download Filtered</button>
            </div>
            {searchLoading ? <div className="loading-state"><div className="spinner" /></div> : (
              <div className="table-container"><table className="data-table"><thead><tr><th>Select</th><th>Trainee</th><th>Location</th><th>Bucket</th><th>Matched Location</th><th>Skills %</th><th>Location %</th><th>Total %</th><th>Actions</th></tr></thead><tbody>{filtered.map(m => (<tr key={m.trainee_id}><td><input type="checkbox" checked={selectedSearchTraineeIds.includes(String(m.trainee_id))} onChange={e => { const id = String(m.trainee_id); if (e.target.checked) setSelectedSearchTraineeIds(prev => [...prev, id]); else setSelectedSearchTraineeIds(prev => prev.filter(pid => pid !== id)); }} /></td><td>{m.trainee_name}</td><td>{m.trainee_location}</td><td><span className={`bucket-tag ${m.bucket?.toLowerCase()}`}>{m.bucket?.replace("_", " ")}</span></td><td>{m.matched_location || '—'}</td><td>{m.skills_percentage.toFixed(1)}%</td><td>{m.location_percentage.toFixed(1)}%</td><td><strong>{m.total_percentage.toFixed(1)}%</strong></td><td><button className="btn-icon" onClick={() => setSelectedTraineeForView(m)}><Eye size={16} /></button></td></tr>))}</tbody></table></div>
            )}
          </>
        )}
        {showLockModal && (<div className="modal-overlay" onClick={() => setShowLockModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>Lock for Interview</h3><button className="modal-close" onClick={() => setShowLockModal(false)}><X /></button></div><div className="modal-body"><label>Date & Time <input type="datetime-local" value={lockInterviewDatetime} onChange={e => setLockInterviewDatetime(e.target.value)} /></label><label>Interviewer <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)}><option value="">Select</option>{interviewers.map(i => <option key={i.id} value={i.id}>{i.username}</option>)}</select></label><label>Comments <textarea value={lockComments} onChange={e => setLockComments(e.target.value)} /></label></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowLockModal(false)}>Cancel</button><button className="btn-primary" onClick={handleLockFromSearch}>Lock</button></div></div></div>)}
      </div>
    );
  };

  const renderSelected = () => {
    const selected = interviewLocks.filter(l => l.status === "selected");
    return (
      <div className="selected-tab">
        <div className="section-header">
          <h2><CheckCircle size={24} /> Selected Candidates ({selected.length})</h2>
          <button onClick={() => fetchLocks()} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
          <button onClick={() => downloadLockReport("selected")} className="btn btn-success"><Download size={16} /> Download</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Interview Date</th><th>Actions</th></tr></thead>
            <tbody>{selected.map(s => (<tr key={s.id}><td>{s.trainee_name}</td><td>{s.job_title}</td><td>{s.assigned_to_name || "-"}</td><td>{formatDate(s.interview_datetime)}</td><td><button className="btn-icon" onClick={() => setSelectedTraineeForView({ name: s.trainee_name, id: s.trainee })}><Eye size={16} /></button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRejected = () => {
    const rejected = interviewLocks.filter(l => l.status === "rejected");
    return (
      <div className="rejected-tab">
        <div className="section-header">
          <h2><XCircle size={24} /> Rejected Candidates ({rejected.length})</h2>
          <button onClick={() => fetchLocks()} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
          <button onClick={() => downloadLockReport("rejected")} className="btn btn-danger"><Download size={16} /> Download</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Interview Date</th><th>Actions</th></tr></thead>
            <tbody>{rejected.map(s => (<tr key={s.id}><td>{s.trainee_name}</td><td>{s.job_title}</td><td>{s.assigned_to_name || "-"}</td><td>{formatDate(s.interview_datetime)}</td><td><button className="btn-icon" onClick={() => setSelectedTraineeForView({ name: s.trainee_name, id: s.trainee })}><Eye size={16} /></button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDemandSupplyAnalysis = () => {
    const filteredGaps = skillGapFilter === "all" ? skillGapData : skillGapData.filter(g => Math.abs(g.gap) >= parseInt(skillGapFilter));
    const topDemandSkills = [...skillGapData].sort((a, b) => b.demand - a.demand).slice(0, 5);
    const surplusSkills = skillGapData.filter(g => g.gap < 0).sort((a, b) => a.gap - b.gap).slice(0, 5);
    const totalDemand = skillGapData.reduce((sum, g) => sum + g.demand, 0);
    const totalSupply = skillGapData.reduce((sum, g) => sum + g.supply, 0);

    return (
      <div className="skill-gap-analyzer">
        <div className="section-header">
          <h2><Target size={24} /> Demand & Supply Analysis</h2>
          <div className="filter-group">
            <select value={skillGapFilter} onChange={e => setSkillGapFilter(e.target.value)} className="filter-select"><option value="all">All Gaps</option><option value="1">|Gap| ≥ 1</option><option value="2">|Gap| ≥ 2</option><option value="3">|Gap| ≥ 3</option></select>
          </div>
          <button onClick={runAnalytics} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
        </div>
        <div className="stats-grid small">
          <div className="stat-card"><div className="stat-icon"><TrendingUpIcon /></div><div className="stat-content"><h3>Total Demand</h3><div className="stat-value">{totalDemand}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Users /></div><div className="stat-content"><h3>Total Supply</h3><div className="stat-value">{totalSupply}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><AlertCircle /></div><div className="stat-content"><h3>Skills with Gap</h3><div className="stat-value">{skillGapData.filter(g => g.gap > 0).length}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Skills with Surplus</h3><div className="stat-value">{skillGapData.filter(g => g.gap < 0).length}</div></div></div>
        </div>
        <div className="analytics-card"><ResponsiveContainer width="100%" height={400}><ReBarChart data={filteredGaps}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="skill" /><YAxis /><Tooltip /><Legend /><Bar dataKey="demand" fill="#3b82f6" name="Demand" /><Bar dataKey="supply" fill="#10b981" name="Supply" /></ReBarChart></ResponsiveContainer></div>
        <div className="dual-chart"><div className="analytics-card"><h3><Zap size={18} /> Top Skills in Demand</h3><table className="mini-table"><thead><tr><th>Skill</th><th>Demand</th></tr></thead><tbody>{topDemandSkills.map(s => (<tr key={s.skill}><td>{s.skill}</td><td>{s.demand}</td></tr>))}</tbody></table></div><div className="analytics-card"><h3><CheckCircle size={18} /> Skills with Surplus Supply</h3><table className="mini-table"><thead><tr><th>Skill</th><th>Surplus</th></tr></thead><tbody>{surplusSkills.map(s => (<tr key={s.skill}><td>{s.skill}</td><td>{-s.gap}</td></tr>))}{surplusSkills.length === 0 && <tr><td colSpan="2">No surplus skills</td></tr>}</tbody></table></div></div>
        <div className="table-container"><table className="data-table"><thead><tr><th>Skill</th><th>Demand</th><th>Supply</th><th>Gap</th><th>Recommended Action</th></tr></thead><tbody>{filteredGaps.map(gap => (<tr key={gap.skill}><td>{gap.skill}</td><td>{gap.demand}</td><td>{gap.supply}</td><td style={{ color: gap.gap > 0 ? '#ef4444' : '#10b981' }}>{gap.gap > 0 ? gap.gap : `+${-gap.gap}`}</td><td>{gap.gap > 0 ? `Upskill ${gap.gap} trainees in ${gap.skill}` : 'Sufficient supply'}</td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const renderBatchComparisonTab = () => (
    <div className="batch-comparison-tab">
      <div className="section-header"><h2><Layers size={24} /> Batch Comparison</h2><button onClick={refreshCurrentView} className="btn-secondary"><RefreshCw size={16} /> Refresh All</button></div>
      {renderMultiBatchSelector()}
      {comparisonData && (<div className="comparison-table-container"><table className="comparison-table"><thead><tr><th>Metric</th>{comparisonData.map(d => <th key={d.batch}>{d.batch}</th>)}</tr></thead><tbody>
        <tr><td>Total Trainees</td>{comparisonData.map(d => <td key={d.batch}>{d.totalTrainees}</td>)}</tr>
        <tr><td>Mapped Trainees</td>{comparisonData.map(d => <td key={d.batch}>{d.mapped}</td>)}</tr>
        <tr><td>Mapping Rate</td>{comparisonData.map(d => <td key={d.batch}>{d.mappingRate.toFixed(1)}%</td>)}</tr>
        <tr><td>Avg Score</td>{comparisonData.map(d => <td key={d.batch}>{d.avgScore}%</td>)}</tr>
        <tr><td>Active Jobs</td>{comparisonData.map(d => <td key={d.batch}>{d.activeJobs}</td>)}</tr>
        <tr><td>Locked Candidates</td>{comparisonData.map(d => <td key={d.batch}>{d.locked}</td>)}</tr>
        <tr><td>Selected Candidates</td>{comparisonData.map(d => <td key={d.batch}>{d.selected}</td>)}</tr>
        <tr><td>Selection Rate</td>{comparisonData.map(d => <td key={d.batch}>{d.selectionRate.toFixed(1)}%</td>)}</tr>
      </tbody></table></div>)}
    </div>
  );

  const renderChatbot = () => (
    <div className="chatbot-tab">
      <div className="chat-header"><p className="chat-title"><Bot size={20} /> ChatBot Assistant</p><div className="chat-session-controls"><select value={activeSessionId || ''} onChange={(e) => { const id = parseInt(e.target.value); setActiveSessionId(id); const session = chatSessions.find(s => s.id === id); if (session) setChatMessages(session.messages || []); }} className="filter-select">{chatSessions.map(s => (<option key={s.id} value={s.id}>{new Date(s.created_at).toLocaleString()}</option>))}</select><button onClick={createNewChatSession} className="btn-primary">New Chat</button></div>{!ollamaAvailable && <div className="ollama-warning">⚠️ Ollama not reachable.</div>}</div>
      <div className="chat-container" ref={chatContainerRef}><div className="chat-messages">{chatMessages.map((msg, idx) => (<div key={idx} className={`chat-message ${msg.role}`}><div className="chat-bubble">{msg.content}</div></div>))}{chatLoading && <div className="chat-message assistant"><div className="chat-bubble typing-indicator">...</div></div>}</div></div>
      <div className="chat-input-area"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleChatSend()} placeholder="Ask me anything..." disabled={chatLoading} ref={chatInputRef} /><button onClick={handleChatSend} disabled={chatLoading}><Send size={18} /></button></div>
      <div className="suggested-questions"><span>Try:</span>{["Show top skill gaps", "List unmapped trainees", "Compare batches", "What's the mapping rate?"].map(q => (<button key={q} onClick={() => setChatInput(q)} className="suggested-chip">{q}</button>))}</div>
    </div>
  );

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "analytics", label: "Analytics", icon: <Activity size={20} /> },
    { id: "batch-comparison", label: "Batch Comparison", icon: <Layers size={20} /> },
    { id: "skill-gaps", label: "Demand & Supply", icon: <Target size={20} /> },
    { id: "chatbot", label: "Chatbot", icon: <MessageCircle size={20} /> },
    { id: "job-profiles", label: "Job Profiles", icon: <Briefcase size={20} /> },
    { id: "trainees", label: "Trainees", icon: <Users size={20} /> },
    { id: "open-pool", label: "Open Pool", icon: <Database size={20} /> },
    { id: "talent-search", label: "Talent Search", icon: <Search size={20} /> },
    { id: "selected", label: "Selected", icon: <CheckCircle size={20} /> },
    { id: "rejected", label: "Rejected", icon: <XCircle size={20} /> },
  ];

  const renderContent = () => {
    if (activeTab === "job-details") return renderJobDetails();
    switch (activeTab) {
      case "overview": return renderOverview();
      case "analytics": return renderAnalytics();
      case "batch-comparison": return renderBatchComparisonTab();
      case "skill-gaps": return renderDemandSupplyAnalysis();
      case "chatbot": return renderChatbot();
      case "job-profiles": return renderJobProfiles();
      case "trainees": return renderTrainees();
      case "open-pool": return renderOpenPool();
      case "talent-search": return renderTalentSearch();
      case "selected": return renderSelected();
      case "rejected": return renderRejected();
      default: return renderOverview();
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1><LayoutDashboard size={20} style={{ marginRight: '0.5rem' }} />Manager Dashboard</h1>
          <div className="header-right">
            {renderBatchSelector()}
            <button onClick={refreshCurrentView} className="btn-icon" disabled={loading} title="Refresh"><RefreshCw size={18} className={loading ? 'spinning' : ''} /></button>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="tab-panel">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}

export default DashboardManager;