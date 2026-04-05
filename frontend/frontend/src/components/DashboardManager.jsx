// DashboardManager.js – Full Manager Dashboard with Enhanced LLM Context (Fixed)
import React, { useState, useEffect, useMemo } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "./Sidebar";
import "./styles/ManagerDashboard.css";

import {
  LayoutDashboard,
  Briefcase,
  Users,
  CheckCircle,
  MapPin,
  Target,
  BriefcaseBusiness,
  Clock,
  Calendar,
  User,
  Building,
  AlertCircle,
  Eye,
  X,
  BarChart2,
  Search,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart,
  Database,
  XCircle,
  Download,
  Lock,
  RefreshCw,
  Users2,
  Activity,
  Award,
  Globe,
  LineChart,
  Sparkles,
  GraduationCap,
  TrendingUp as TrendingUpIcon,
  MessageCircle,
  Zap,
} from "lucide-react";
import api from "../api/axios";

function DashboardManager({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

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

  // ---- Analytics State ----
  const [analyticsData, setAnalyticsData] = useState({
    skillProficiency: [],
    interviewSuccessByJob: [],
    trendOverTime: [],
    batchComparison: [],
    recommendationEffectiveness: { recommended: 0, locked: 0, selected: 0 },
    skillClusters: [],
    hiringFunnel: { matches: 0, locked: 0, interviewed: 0, selected: 0, mapped: 0 },
    timeToFill: [],
    interviewerPerformance: [],
    skillDevelopmentRecs: [],
    demandForecast: [],
    openPoolDepth: [],
    locationDemand: [],
    retentionRisk: [],
    aiSummary: "",
    isLoading: false,
    lastAnalyzed: null,
  });

  // ---- Chatbot State ----
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", content: "Hello! I'm your AI HR assistant. Ask me anything about jobs, skill gaps, matches, or trainees." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(true);
  const [ollamaAvailable, setOllamaAvailable] = useState(true);

  // ---- Filter States ----
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [traineeSearchTerm, setTraineeSearchTerm] = useState("");
  const [traineeLocationFilter, setTraineeLocationFilter] = useState("all");
  const [traineeMappingFilter, setTraineeMappingFilter] = useState("all");

  // ---- Talent Search State ----
  const [selectedJobForSearch, setSelectedJobForSearch] = useState(null);
  const [searchJobMatches, setSearchJobMatches] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    bucket: "",
    location: "",
    minTotal: 0,
    skillKeyword: "",
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

  // ==================== Data Fetching ====================
  useEffect(() => {
    fetchJobs();
    fetchTrainees();
    fetchLocks();
    fetchRecommendations();
    checkOllamaAvailability();
  }, []);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await api.get("/jobs/");
      setJobs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setJobsError(error?.response?.data || error?.message || "Unknown error");
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchTrainees = async () => {
    try {
      const response = await api.get("api/profiles/");
      if (Array.isArray(response.data)) setTraineesList(response.data);
    } catch (error) {
      toast.error("Failed to fetch trainee profiles");
    }
  };

  const fetchLocks = async () => {
    try {
      const response = await api.get("/interview-locks/");
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
  }, [activeTab, traineesList]);

  const fetchOpenPoolTrainees = async () => {
    setOpenPoolLoading(true);
    try {
      const allTrainees = normalizedTrainees;
      const noMatchTrainees = [];
      for (const trainee of allTrainees) {
        if (trainee.isMapped) continue;
        try {
          const res = await api.get(`/trainee-matches/${trainee.traineeId}/`);
          const data = res.data;
          const hasMatches =
            (data.perfect_match && data.perfect_match.length > 0) ||
            (data.skills_only && data.skills_only.length > 0) ||
            (data.location_only && data.location_only.length > 0) ||
            (data.nearby && data.nearby.length > 0);
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
      await fetchOpenPoolTrainees();

      setTimeout(() => {
        const currentJobs = jobs;
        const currentTrainees = normalizedTrainees;
        const currentLocks = interviewLocks;
        const currentRecs = recommendations;
        const currentOpenPool = openPoolTrainees;

        // ----- 1. Skill Proficiency -----
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
          (t.weaknesses || []).forEach(w => {
            const name = w.courseName;
            const score = w.avgScore || 0;
            if (!skillScores.has(name)) skillScores.set(name, { sum: 0, count: 0 });
            const d = skillScores.get(name);
            d.sum += score;
            d.count++;
          });
        });
        const skillProficiency = Array.from(skillScores.entries())
          .map(([skill, { sum, count }]) => ({ skill, avgScore: sum / count }))
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 10);

        // ----- 2. Interview Success by Job -----
        const jobSuccessMap = new Map();
        currentLocks.forEach(lock => {
          const jobTitle = lock.job_title;
          if (!jobSuccessMap.has(jobTitle)) {
            jobSuccessMap.set(jobTitle, { locked: 0, selected: 0, rejected: 0 });
          }
          const stats = jobSuccessMap.get(jobTitle);
          if (lock.status === "locked") stats.locked++;
          else if (lock.status === "selected") stats.selected++;
          else if (lock.status === "rejected") stats.rejected++;
        });
        const interviewSuccessByJob = Array.from(jobSuccessMap.entries())
          .map(([jobTitle, stats]) => ({ jobTitle, ...stats }));

        // ----- 3. Trend Over Time (last 6 weeks) -----
        const now = new Date();
        const weeks = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i * 7);
          weeks.push(d.toISOString().slice(0, 10));
        }
        const trendMap = new Map();
        weeks.forEach(w => trendMap.set(w, { matches: 0, selections: 0 }));
        currentLocks.forEach(lock => {
          if (!lock.created_at) return;
          const weekStart = new Date(lock.created_at);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().slice(0, 10);
          if (trendMap.has(weekKey)) {
            if (lock.status === "selected") trendMap.get(weekKey).selections++;
          }
        });
        const trendOverTime = Array.from(trendMap.entries()).map(([period, data]) => ({ period, ...data }));

        // ----- 4. Batch Comparison -----
        const batchMap = new Map();
        currentTrainees.forEach(t => {
          const batch = t.batch_name || "Unknown";
          if (!batchMap.has(batch)) {
            batchMap.set(batch, { total: 0, sumScore: 0, openPool: 0 });
          }
          const stats = batchMap.get(batch);
          stats.total++;
          stats.sumScore += t.averageScore || 0;
        });
        currentOpenPool.forEach(t => {
          const batch = t.batch_name || "Unknown";
          if (batchMap.has(batch)) batchMap.get(batch).openPool++;
          else batchMap.set(batch, { total: 0, sumScore: 0, openPool: 1 });
        });
        const batchComparison = Array.from(batchMap.entries()).map(([batch, stats]) => ({
          batch,
          avgScore: stats.total ? stats.sumScore / stats.total : 0,
          matchRate: stats.total ? ((stats.total - stats.openPool) / stats.total) * 100 : 0,
          openPoolCount: stats.openPool,
        }));

        // ----- 5. Recommendation Effectiveness -----
        let recommendedCount = currentRecs.length;
        let lockedCount = 0, selectedCount = 0;
        currentRecs.forEach(rec => {
          const lock = currentLocks.find(l => l.trainee_id == rec.trainee_id && l.job_id == rec.job_id);
          if (lock) {
            lockedCount++;
            if (lock.status === "selected") selectedCount++;
          }
        });
        const recommendationEffectiveness = { recommended: recommendedCount, locked: lockedCount, selected: selectedCount };

        // ----- 6. Skill Clustering -----
        const coOccurrence = new Map();
        currentTrainees.forEach(t => {
          const skills = t.skills || [];
          for (let i = 0; i < skills.length; i++) {
            for (let j = i + 1; j < skills.length; j++) {
              const pair = [skills[i], skills[j]].sort().join("|");
              coOccurrence.set(pair, (coOccurrence.get(pair) || 0) + 1);
            }
          }
        });
        const skillClusters = Array.from(coOccurrence.entries())
          .map(([pair, count]) => {
            const [skill1, skill2] = pair.split("|");
            return { skill1, skill2, cooccurrence: count };
          })
          .sort((a, b) => b.cooccurrence - a.cooccurrence)
          .slice(0, 10);

        // ----- 7. Hiring Funnel -----
        const matchesCount = currentJobs.reduce((acc, job) => acc + (job.matches || 0), 0);
        const lockedCountFunnel = currentLocks.filter(l => l.status === "locked").length;
        const interviewedCount = currentLocks.filter(l => ["locked", "selected", "rejected"].includes(l.status)).length;
        const selectedCountFunnel = currentLocks.filter(l => l.status === "selected").length;
        const mappedCount = currentTrainees.filter(t => t.isMapped).length;
        const hiringFunnel = {
          matches: matchesCount,
          locked: lockedCountFunnel,
          interviewed: interviewedCount,
          selected: selectedCountFunnel,
          mapped: mappedCount,
        };

        // ----- 8. Time-to-Fill -----
        const timeToFill = currentJobs
          .filter(job => job.filled >= job.openings && job.postedDate)
          .map(job => {
            const posted = new Date(job.postedDate);
            const filled = new Date();
            const days = Math.ceil((filled - posted) / (1000 * 60 * 60 * 24));
            return { jobTitle: job.title, daysToFill: days };
          });

        // ----- 9. Interviewer Performance -----
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

        // ----- 10. Skill Development Recommendations -----
        const demandMap = new Map();
        currentJobs.forEach(job => {
          [...(job.techSkills || []), ...(job.softSkills || [])].forEach(skill => {
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
          if (demand > supply) {
            skillGaps.push({ skill, demand, supply, gap: demand - supply });
          }
        });
        skillGaps.sort((a, b) => b.gap - a.gap);
        const skillDevelopmentRecs = skillGaps.slice(0, 5).map(gap => ({
          skill: gap.skill,
          recommendedCourses: [`Advanced ${gap.skill}`, `Practical ${gap.skill} Workshop`],
        }));

        // ----- 11. Demand Forecast -----
        const demandForecast = skillGaps.slice(0, 5).map(gap => ({
          skill: gap.skill,
          demandNextMonth: Math.ceil(gap.demand * 1.1),
        }));

        // ----- 12. Open Pool Depth per Job -----
        const openPoolDepth = currentJobs.map(job => ({
          jobTitle: job.title,
          openPoolCandidates: currentOpenPool.length,
        }));

        // ----- 13. Location vs Demand -----
        const locationJobMap = new Map();
        currentJobs.forEach(job => {
          const locs = Array.isArray(job.location) ? job.location : [job.location];
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

        // ----- 14. Retention Risk -----
        const retentionRisk = [];
        for (const trainee of currentTrainees) {
          let matchPercent = 0;
          try {
            const res =  api.get(`/trainee-matches/${trainee.traineeId}/`);
            const matches = res.data;
            if (matches.total_matches > 0) {
              let sum = 0;
              const buckets = ["perfect_match", "skills_only", "location_only", "nearby", "no_match"];
              buckets.forEach(b => {
                (matches[b] || []).forEach(m => (sum += m.total_percentage));
              });
              matchPercent = sum / matches.total_matches;
            }
          } catch (e) {}
          if (trainee.averageScore < 50 && matchPercent < 30) {
            retentionRisk.push({
              traineeName: trainee.name,
              avgScore: trainee.averageScore,
              matchPercent: matchPercent,
            });
          }
        }
        retentionRisk.sort((a, b) => a.avgScore - b.avgScore).slice(0, 10);

        // ----- 15. AI Summary -----
        const selectionRate = hiringFunnel.locked ? (hiringFunnel.selected / hiringFunnel.locked) * 100 : 0;
        const mappingRate = currentTrainees.length ? (hiringFunnel.mapped / currentTrainees.length) * 100 : 0;
        const topGaps = skillGaps.slice(0, 3).map(g => g.skill).join(", ");
        const aiSummary = `📊 The talent pool has ${currentTrainees.length} trainees with a mapping rate of ${mappingRate.toFixed(1)}%. Top skill gaps are ${topGaps || "none"}. Focus upskilling on these areas to improve selection rates. The selection rate of locked candidates is ${selectionRate.toFixed(1)}%. Consider targeted training programs.`;

        setAnalyticsData({
          skillProficiency,
          interviewSuccessByJob,
          trendOverTime,
          batchComparison,
          recommendationEffectiveness,
          skillClusters,
          hiringFunnel,
          timeToFill,
          interviewerPerformance,
          skillDevelopmentRecs,
          demandForecast,
          openPoolDepth,
          locationDemand,
          retentionRisk,
          aiSummary,
          isLoading: false,
          lastAnalyzed: new Date().toLocaleString(),
        });
      }, 1000);
    } catch (err) {
      toast.error("Failed to run analytics");
      setAnalyticsData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ==================== Helpers ====================
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    return String(val).split(/,|\n/).map(s => s.trim()).filter(Boolean);
  };
  const cap = (s) => (typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1) : s);
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  };

  const normalizedTrainees = useMemo(() => {
    return traineesList.map((t, index) => {
      const strengthSkills = t.strengths ? t.strengths.map(s => s.courseName) : [];
      const upskillSkills = t.upskillCourses ? toArray(t.upskillCourses) : [];
      const combinedSkills = [...new Set([...strengthSkills, ...upskillSkills])];
      return {
        ...t,
        id: t.id,
        userId: t.userInfo?.userId,
        traineeId: index + 1,
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
      const response = await api.get(`/matches/${jobId}/`);
      setJobMatches(response.data);
    } catch {
      setJobMatches({ perfect_match: [], skills_only: [], location_only: [], nearby: [], no_match: [], total_matches: 0 });
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTraineeForView) {
      const idx = traineesList.findIndex(t => t.id === selectedTraineeForView.id);
      if (idx !== -1) fetchTraineeMatches(idx + 1);
    }
  }, [selectedTraineeForView]);

  const fetchTraineeMatches = async (traineeIdx) => {
    setTraineeMatchesLoading(true);
    try {
      const response = await api.get(`/trainee-matches/${traineeIdx}/`);
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
      api.get(`/matches/${job.id}/`)
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
    } catch {
      toast.error("Failed to lock trainees");
    }
  };

  const downloadFilteredSearch = () => {
    const filtered = filteredSearchMatches();
    if (!filtered.length) return toast.error("No data");
    const csvRows = [];
    csvRows.push(["Trainee Name", "Location", "Bucket", "Skills %", "Location %", "Total %", "Matched Skills"].join(","));
    filtered.forEach(m => {
      csvRows.push([
        `"${m.trainee_name}"`,
        `"${m.trainee_location || ""}"`,
        m.bucket,
        m.skills_percentage,
        m.location_percentage,
        m.total_percentage,
        `"${(m.matched_skills || []).join("; ")}"`,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_matches_${selectedJobForSearch?.title}.csv`;
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
      const response = await api.get(`/reports/${type}/`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  const downloadLockReport = async (status = "") => {
    try {
      const url = `/interview-locks/report/${status ? `?status=${status}` : ""}`;
      const response = await api.get(url, { responseType: "blob" });
      const urlBlob = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `interview_locks${status ? "_" + status : ""}.csv`;
      a.click();
      URL.revokeObjectURL(urlBlob);
    } catch {
      toast.error("Download failed");
    }
  };

  // ==================== Chatbot with Enhanced Context ====================
  const checkOllamaAvailability = async () => {
    try {
      const res = await fetch("http://localhost:11434/api/tags", { method: "GET", signal: AbortSignal.timeout(2000) });
      if (res.ok) setOllamaAvailable(true);
      else setOllamaAvailable(false);
    } catch {
      setOllamaAvailable(false);
    }
  };

  const buildContextForLLM = () => {
    const currentJobs = jobs;
    const currentTrainees = normalizedTrainees;
    const currentLocks = interviewLocks;
    const currentOpenPool = openPoolTrainees;

    const allTraineeSkills = new Set();
    currentTrainees.forEach(t => (t.skills || []).forEach(s => allTraineeSkills.add(s.toLowerCase())));

    const jobDetailsWithGaps = currentJobs.map(job => {
      const requiredSkills = [...(job.techSkills || []), ...(job.softSkills || [])];
      const missingSkills = requiredSkills.filter(skill => !allTraineeSkills.has(skill.toLowerCase()));
      return `- ${job.title} (${job.department}): ${job.openings} openings, ${job.filled} filled. Requires: ${requiredSkills.join(", ")}. ${missingSkills.length > 0 ? `Missing skills: ${missingSkills.join(", ")}` : "All skills available."}`;
    }).join("\n");

    const mappedTraineesList = currentTrainees.filter(t => t.isMapped).slice(0, 20);
    const mappedStr = mappedTraineesList.map(t => `  • ${t.name} → ${t.projectName || "Unknown project"}`).join("\n");
    const mappedCount = currentTrainees.filter(t => t.isMapped).length;
    const mappedSummary = mappedCount > 0 ? `Mapped trainees (${mappedCount}):\n${mappedStr}${mappedCount > 20 ? `\n  ... and ${mappedCount - 20} more` : ""}` : "No mapped trainees.";

    const unmappedTraineesList = currentTrainees.filter(t => !t.isMapped).slice(0, 20);
    const unmappedStr = unmappedTraineesList.map(t => `  • ${t.name} (Score: ${t.averageScore}%)`).join("\n");
    const unmappedCount = currentTrainees.filter(t => !t.isMapped).length;
    const unmappedSummary = unmappedCount > 0 ? `Unmapped trainees (${unmappedCount}):\n${unmappedStr}${unmappedCount > 20 ? `\n  ... and ${unmappedCount - 20} more` : ""}` : "No unmapped trainees.";

    const openPoolList = currentOpenPool.slice(0, 20);
    const openPoolStr = openPoolList.map(t => `  • ${t.name}`).join("\n");
    const openPoolCount = currentOpenPool.length;
    const openPoolSummary = openPoolCount > 0 ? `Open pool (no job matches) (${openPoolCount}):\n${openPoolStr}${openPoolCount > 20 ? `\n  ... and ${openPoolCount - 20} more` : ""}` : "No open pool trainees.";

    const locked = currentLocks.filter(l => l.status === "locked").length;
    const selected = currentLocks.filter(l => l.status === "selected").length;
    const rejected = currentLocks.filter(l => l.status === "rejected").length;
    const lockSummary = `Interview locks: Locked: ${locked}, Selected: ${selected}, Rejected: ${rejected}.`;

    const demandMap = new Map();
    currentJobs.forEach(job => {
      [...(job.techSkills || []), ...(job.softSkills || [])].forEach(skill => {
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
      if (demand > supply) {
        skillGaps.push({ skill, demand, supply, gap: demand - supply });
      }
    });
    skillGaps.sort((a,b) => b.gap - a.gap);
    const topGaps = skillGaps.slice(0, 10).map(g => `  • ${g.skill}: demand ${g.demand}, supply ${g.supply}, gap ${g.gap}`).join("\n");
    const gapSummary = skillGaps.length > 0 ? `Top skill gaps (demand - supply):\n${topGaps}` : "No significant skill gaps.";

    return `
You are an AI assistant for an HR manager. You have access to the following live data from the talent management system:

**JOBS (${currentJobs.length}):**
${jobDetailsWithGaps}

**TRAINEES (${currentTrainees.length}):**
all trainess: ${currentTrainees}
${mappedSummary}
${unmappedSummary}
${openPoolSummary}

**INTERVIEW LOCKS:**
${lockSummary}

**SKILL GAP ANALYSIS:**
${gapSummary}

When answering:
- Be concise and helpful.
- Use the data above exactly as given.
- If asked for a list (e.g., "show mapped trainees"), output the list from the data.
- If asked for skill gaps for a specific job, refer to the job details above.
- Do not invent data not present.
- If the answer is not in the data, say "I don't have that information in the current data."
    `;
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    if (!aiModeEnabled || !ollamaAvailable) {
      const fallbackReply = processQueryBasic(userMsg);
      setChatMessages(prev => [...prev, { role: "bot", content: fallbackReply }]);
      setChatLoading(false);
      return;
    }

    try {
      const context = buildContextForLLM();
      const conversationHistory = chatMessages.slice(-5).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
      const prompt = `${context}\n\nConversation history:\n${conversationHistory}\n\nUser: ${userMsg}\nAssistant:`;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3:latest",
          prompt: prompt,
          stream: false,
          options: { temperature: 0.7, max_tokens: 500 }
        })
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
      const data = await response.json();
      const botReply = data.response || "Sorry, I couldn't generate a response.";
      setChatMessages(prev => [...prev, { role: "bot", content: botReply }]);
    } catch (error) {
      console.error("Ollama error:", error);
      toast.error("AI unavailable. Using basic mode.");
      setOllamaAvailable(false);
      const fallbackReply = processQueryBasic(userMsg);
      setChatMessages(prev => [...prev, { role: "bot", content: fallbackReply }]);
    } finally {
      setChatLoading(false);
    }
  };

  const processQueryBasic = (query) => {
    const lowerQuery = query.toLowerCase();
    const currentJobs = jobs;
    const currentTrainees = normalizedTrainees;
    const currentLocks = interviewLocks;

    if (lowerQuery.includes("list jobs") || lowerQuery.includes("show jobs")) {
      if (currentJobs.length === 0) return "No jobs found.";
      const jobList = currentJobs.map(j => `• ${j.title} (${j.department})`).join("\n");
      return `Here are all current job openings:\n${jobList}`;
    }

    const skillGapMatch = lowerQuery.match(/skill gaps? for (?:the )?["']?(.+?)["']?(?: job)?/i);
    if (skillGapMatch || (lowerQuery.includes("skill gap") && lowerQuery.includes("job"))) {
      let jobTitle = skillGapMatch ? skillGapMatch[1] : null;
      if (!jobTitle) {
        const forMatch = lowerQuery.match(/for (.*)/);
        if (forMatch) jobTitle = forMatch[1];
      }
      if (jobTitle) {
        const job = currentJobs.find(j => j.title.toLowerCase().includes(jobTitle.toLowerCase()));
        if (!job) return `I couldn't find a job titled "${jobTitle}".`;
        const requiredSkills = [...(job.techSkills || []), ...(job.softSkills || [])];
        const allTraineeSkills = new Set();
        currentTrainees.forEach(t => (t.skills || []).forEach(s => allTraineeSkills.add(s.toLowerCase())));
        const missing = requiredSkills.filter(skill => !allTraineeSkills.has(skill.toLowerCase()));
        if (missing.length === 0) return `All required skills for "${job.title}" are available.`;
        return `Skill gaps for "${job.title}":\nMissing: ${missing.join(", ")}.`;
      }
      return "Please specify a job title, e.g., 'skill gaps for Frontend Developer'.";
    }

    if (lowerQuery.includes("how many trainees") || lowerQuery.includes("total trainees")) {
      return `Total trainees: ${currentTrainees.length}. Mapped: ${currentTrainees.filter(t => t.isMapped).length}, Unmapped: ${currentTrainees.filter(t => !t.isMapped).length}.`;
    }
    if (lowerQuery.includes("open pool")) {
      return `Open pool (trainees with no job matches): ${openPoolTrainees.length}.`;
    }
    if (lowerQuery.includes("locked") && lowerQuery.includes("interview")) {
      return `Locked: ${currentLocks.filter(l => l.status === "locked").length}, Selected: ${currentLocks.filter(l => l.status === "selected").length}, Rejected: ${currentLocks.filter(l => l.status === "rejected").length}.`;
    }
    if (lowerQuery.includes("help")) {
      return `I can answer:\n- "List all jobs"\n- "Skill gaps for Data Scientist"\n- "How many trainees are mapped?"\n- "What is the open pool size?"\n- "Show mapped trainees"`;
    }
    return "I'm not sure. Try 'help' for examples.";
  };

  // ==================== Render Functions ====================
  const renderOverview = () => {
    const skillDemand = jobs.reduce((acc, job) => {
      (job.techSkills || []).forEach(s => (acc[s] = (acc[s] || 0) + 1));
      (job.softSkills || []).forEach(s => (acc[s] = (acc[s] || 0) + 1));
      return acc;
    }, {});
    const topSkills = Object.entries(skillDemand).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return (
      <div className="overview">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon"><Briefcase /></div><div className="stat-content"><h3>Active Jobs</h3><div className="stat-value">{jobs.length}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Users /></div><div className="stat-content"><h3>Total Trainees</h3><div className="stat-value">{mappedUnmappedStats.total}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Mapped</h3><div className="stat-value">{mappedUnmappedStats.mapped}</div><div className="stat-detail">{Math.round((mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100)}%</div></div></div>
          <div className="stat-card"><div className="stat-icon"><AlertCircle /></div><div className="stat-content"><h3>Unmapped</h3><div className="stat-value">{mappedUnmappedStats.unmapped}</div><div className="stat-detail">{Math.round((mappedUnmappedStats.unmapped / mappedUnmappedStats.total) * 100)}%</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Database /></div><div className="stat-content"><h3>Open Pool</h3><div className="stat-value">{openPoolTrainees.length}</div><div className="stat-detail">{Math.round((openPoolTrainees.length / mappedUnmappedStats.unmapped) * 100) || 0}% of unmapped</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Lock /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.locked}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.selected}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><XCircle /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.rejected}</div></div></div>
        </div>
        <div className="charts-grid">
          <div className="chart-card"><h3>Top Skills in Demand</h3><div className="skills-chart">{topSkills.map(([skill, count]) => (<div key={skill} className="skill-row"><span>{skill}</span><div className="bar" style={{ width: `${(count / topSkills[0][1]) * 100}%` }}>{count}</div></div>))}</div></div>
          <div className="chart-card"><h3>Trainee Distribution</h3><div className="mapping-chart"><div className="bar-row"><span>Mapped</span><div className="bar" style={{ width: `${(mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100}%` }}>{mappedUnmappedStats.mapped}</div></div><div className="bar-row"><span>Unmapped (matched)</span><div className="bar" style={{ width: `${((mappedUnmappedStats.unmapped - openPoolTrainees.length) / mappedUnmappedStats.total) * 100}%` }}>{mappedUnmappedStats.unmapped - openPoolTrainees.length}</div></div><div className="bar-row"><span>Open Pool</span><div className="bar" style={{ width: `${(openPoolTrainees.length / mappedUnmappedStats.total) * 100}%` }}>{openPoolTrainees.length}</div></div></div></div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const data = analyticsData;
    return (
      <div className="analytics-tab">
        <div className="section-header">
          <h2><Activity size={24} /> Complete Analytics Dashboard</h2>
          <button className="btn-primary" onClick={runAnalytics} disabled={data.isLoading}>
            <RefreshCw size={16} /> {data.isLoading ? "Analyzing..." : "Analyze Now"}
          </button>
        </div>
        {data.lastAnalyzed && <div className="last-analyzed">📊 Last analyzed: {data.lastAnalyzed}</div>}
        {data.isLoading ? <div className="loading-spinner" /> : (
          <div className="analytics-container">
            <div className="analytics-card"><h3><Target size={18} /> 1. Skill Proficiency Levels</h3><div className="bar-chart">{data.skillProficiency.map(s => (<div key={s.skill} className="bar-row"><span>{s.skill}</span><div className="bar" style={{ width: `${s.avgScore}%`, background: "#10b981" }}>{s.avgScore.toFixed(1)}%</div></div>))}</div></div>
            <div className="analytics-card"><h3><BarChart2 size={18} /> 2. Interview Success Rate by Job</h3>{data.interviewSuccessByJob.map(job => {
              const total = job.locked + job.selected + job.rejected;
              if (total === 0) return null;
              return (
                <div key={job.jobTitle}>
                  <strong>{job.jobTitle}</strong>
                  <div className="stacked-bar">
                    <div style={{ width: `${(job.locked / total) * 100}%`, background: "#f59e0b" }}>Locked {job.locked}</div>
                    <div style={{ width: `${(job.selected / total) * 100}%`, background: "#10b981" }}>Selected {job.selected}</div>
                    <div style={{ width: `${(job.rejected / total) * 100}%`, background: "#ef4444" }}>Rejected {job.rejected}</div>
                  </div>
                </div>
              );
            })}</div>
            <div className="analytics-card"><h3><LineChart size={18} /> 3. Trend Over Time (Last 6 weeks)</h3><div className="line-chart">{data.trendOverTime.map(t => (<div key={t.period} className="trend-point"><span>{t.period.slice(5)}</span><div className="trend-bars"><div className="trend-bar matches" style={{ height: `${Math.min(t.matches * 5, 100)}px` }}>{t.matches}</div><div className="trend-bar selections" style={{ height: `${Math.min(t.selections * 5, 100)}px` }}>{t.selections}</div></div></div>))}</div></div>
            <div className="analytics-card"><h3><Users2 size={18} /> 4. Batch Comparison</h3><table className="mini-table">
              <thead>
                <tr><th>Batch</th><th>Avg Score</th><th>Match Rate</th><th>Open Pool</th></tr>
              </thead>
              <tbody>
                {data.batchComparison.map(b => (
                  <tr key={b.batch}>
                    <td>{b.batch}</td>
                    <td>{b.avgScore.toFixed(1)}%</td>
                    <td>{b.matchRate.toFixed(1)}%</td>
                    <td>{b.openPoolCount}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="analytics-card"><h3><Sparkles size={18} /> 5. Recommendation Effectiveness</h3><div className="funnel"><div>Recommended: {data.recommendationEffectiveness.recommended}</div><div>→ Locked: {data.recommendationEffectiveness.locked}</div><div>→ Selected: {data.recommendationEffectiveness.selected}</div><div className="funnel-rate">Conversion: {data.recommendationEffectiveness.recommended ? ((data.recommendationEffectiveness.selected / data.recommendationEffectiveness.recommended) * 100).toFixed(1) : 0}%</div></div></div>
            <div className="analytics-card"><h3><Layers size={18} /> 6. Skill Clusters (Co-occurrence)</h3><div className="cluster-list">{data.skillClusters.map(c => (<div key={`${c.skill1}-${c.skill2}`} className="cluster-item">{c.skill1} ↔ {c.skill2} <span className="badge">{c.cooccurrence} trainees</span></div>))}</div></div>
            <div className="analytics-card"><h3><PieChart size={18} /> 7. Hiring Funnel</h3><div className="funnel-horizontal"><div>Matches {data.hiringFunnel.matches}</div><div>→ Locked {data.hiringFunnel.locked}</div><div>→ Interviewed {data.hiringFunnel.interviewed}</div><div>→ Selected {data.hiringFunnel.selected}</div><div>→ Mapped {data.hiringFunnel.mapped}</div></div></div>
            <div className="analytics-card"><h3><Clock size={18} /> 8. Time-to-Fill (avg days)</h3><div className="bar-chart">{data.timeToFill.map(t => (<div key={t.jobTitle} className="bar-row"><span>{t.jobTitle}</span><div className="bar" style={{ width: `${Math.min(t.daysToFill / 100, 100)}%` }}>{t.daysToFill} days</div></div>))}</div></div>
            <div className="analytics-card"><h3><Award size={18} /> 9. Interviewer Performance</h3><table className="mini-table"><thead><tr><th>Interviewer</th><th>Interviews</th><th>Selection Rate</th></tr></thead><tbody>{data.interviewerPerformance.map(i => (<tr key={i.name}><td>{i.name}</td>
              <td>{i.interviews}</td>
              <td>{i.selectionRate.toFixed(1)}%</td>
              </tr>))}</tbody></table></div>
            <div className="analytics-card"><h3><GraduationCap size={18} /> 10. Skill Development Recommendations</h3><div className="rec-list">{data.skillDevelopmentRecs.map(r => (<div key={r.skill} className="rec-item"><strong>{r.skill}</strong> → {r.recommendedCourses.join(", ")}</div>))}</div></div>
            <div className="analytics-card"><h3><TrendingUpIcon size={18} /> 11. Demand Forecast (Next Month)</h3><div className="forecast-list">{data.demandForecast.map(f => (<div key={f.skill} className="forecast-item">{f.skill}: {f.demandNextMonth} openings</div>))}</div></div>
            <div className="analytics-card"><h3><Database size={18} /> 12. Open Pool Depth per Job</h3><div className="bar-chart">{data.openPoolDepth.slice(0, 8).map(j => (<div key={j.jobTitle} className="bar-row"><span>{j.jobTitle}</span><div className="bar" style={{ width: `${Math.min(j.openPoolCandidates / 50 * 100, 100)}%` }}>{j.openPoolCandidates} candidates</div></div>))}</div></div>
            <div className="analytics-card"><h3><Globe size={18} /> 13. Location vs. Demand</h3><table className="mini-table"><thead><tr><th>Location</th><th>Jobs</th><th>Trainees</th></tr></thead><tbody>{data.locationDemand.map(l => (<tr key={l.location}><td>{cap(l.location)}</td>
              <td>{l.jobCount}</td>
              <td>{l.traineeCount}</td>
              </tr>))}</tbody></table></div>
            <div className="analytics-card"><h3><AlertCircle size={18} /> 14. Retention Risk (Low Score & Low Match)</h3><div className="risk-list">{data.retentionRisk.map(r => (<div key={r.traineeName} className="risk-item">{r.traineeName} – Score: {r.avgScore}%, Match: {r.matchPercent.toFixed(1)}%</div>))}</div></div>
            <div className="analytics-card full-width"><h3><Sparkles size={18} /> 15. AI‑Powered Executive Summary</h3><div className="ai-summary">{data.aiSummary}</div><button className="btn-secondary" onClick={runAnalytics}>Regenerate Summary</button></div>
          </div>
        )}
      </div>
    );
  };

  const renderJobProfiles = () => {
    const filtered = jobs.filter(j => !jobSearchTerm || j.title.toLowerCase().includes(jobSearchTerm.toLowerCase()));
    return (
      <div className="job-profiles">
        <div className="section-header">
          <h2><Briefcase size={24} /> Job Profiles ({jobs.length})</h2>
          <div className="search-box"><input value={jobSearchTerm} onChange={e => setJobSearchTerm(e.target.value)} placeholder="Search jobs..." /></div>
        </div>
        <div className="job-profiles-grid">
          {filtered.map(job => (
            <div key={job.id} className="job-profile-card">
              <h3>{job.title}</h3>
              <div className="meta"><Building size={14} /> {job.department} <MapPin size={14} /> {Array.isArray(job.location) ? job.location.join(", ") : job.location}</div>
              <div className="openings"><Users size={14} /> {job.openings} openings</div>
              <button onClick={() => { setSelectedJobForView(job); setActiveTab("job-details"); }} className="view-details-btn"><Eye size={16} /> View Details</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderJobDetails = () => {
    if (!selectedJobForView) return null;
    const job = selectedJobForView;
    return (
      <div className="job-details-page">
        <div className="details-nav"><button onClick={() => { setSelectedJobForView(null); setActiveTab("job-profiles"); }}><ArrowLeft size={18} /> Back</button></div>
        <h1>{job.title}</h1>
        <div className="job-info">
          <p><Building /> {job.department}</p>
          <p><MapPin /> {Array.isArray(job.location) ? job.location.join(", ") : job.location}</p>
          <p><Users /> {job.openings} openings ({job.filled} filled)</p>
          <p><Calendar /> Posted: {formatDate(job.postedDate)}</p>
        </div>
        <h3>Matching Candidates</h3>
        {matchesLoading ? <div className="loading-spinner" /> : (
          <div className="match-categories">
            {["perfect_match", "skills_only", "location_only", "nearby", "no_match"].map(cat => (
              <div key={cat} className="match-category">
                <h4>{cat.replace("_", " ").toUpperCase()} ({jobMatches?.[cat]?.length || 0})</h4>
                <div className="match-grid">
                  {(jobMatches?.[cat] || []).map(m => (
                    <div key={m.trainee_id} className="match-card" onClick={() => setSelectedTraineeForView(m)}>
                      <div className="match-name">{m.trainee_name}</div>
                      <div className="match-location"><MapPin size={12} /> {m.trainee_location}</div>
                      <div className="match-score">{m.total_percentage}% match</div>
                    </div>
                  ))}
                </div>
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
          <input value={traineeSearchTerm} onChange={e => setTraineeSearchTerm(e.target.value)} placeholder="Search..." />
          <select value={traineeLocationFilter} onChange={e => setTraineeLocationFilter(e.target.value)}>
            <option value="all">All Locations</option>
            {uniqueLocations.filter(l => l !== "all").map(l => <option key={l} value={l}>{cap(l)}</option>)}
          </select>
          <select value={traineeMappingFilter} onChange={e => setTraineeMappingFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="mapped">Mapped</option>
            <option value="unmapped">Unmapped</option>
          </select>
          <button onClick={() => downloadReport("mapped")}><Download size={16} /> Mapped</button>
          <button onClick={() => downloadReport("unmapped")}><Download size={16} /> Unmapped</button>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Name</th><th>Employee ID</th><th>Location</th><th>Mapping Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filteredTrainees.map(t => (
            <tr key={t.id} onClick={() => setSelectedTraineeForView(t)} className="clickable-row">
              <td><div className="trainee-info"><div className="avatar">{t.name.charAt(0)}</div>{t.name}</div></td>
              <td>{t.employeeId}</td>
              <td>{cap(t.location)}</td>
              <td>{t.isMapped ? <span className="badge mapped"><CheckCircle size={12} /> Mapped</span> : <span className="badge unmapped"><AlertCircle size={12} /> Unmapped</span>}</td>
              <td><Eye size={16} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOpenPool = () => {
    const filtered = openPoolTrainees.filter(t => !traineeSearchTerm || t.name.toLowerCase().includes(traineeSearchTerm.toLowerCase()));
    return (
      <div className="open-pool">
        <div className="section-header"><h2><Database size={24} /> Open Pool ({openPoolTrainees.length})</h2><input value={traineeSearchTerm} onChange={e => setTraineeSearchTerm(e.target.value)} placeholder="Search..." /></div>
        {openPoolLoading ? <div className="loading-spinner" /> : filtered.length === 0 ? <div className="empty-state"><Database size={40} /><h3>No open pool trainees</h3></div> : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Location</th><th>Score</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} onClick={() => setSelectedTraineeForView(t)} className="clickable-row">
                  <td>{t.name}</td>
                  <td>{cap(t.location)}</td>
                  <td>{t.averageScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderTalentSearch = () => {
    const baseFiltered = filteredSearchMatches();
    const filtered = baseFiltered.filter(m => {
      const trainee = normalizedTrainees.find(t => t.userId === m.trainee_id);
      return !(trainee?.isMapped && trainee.projectId === selectedJobForSearch?.id.toString());
    });
    return (
      <div className="talent-search">
        <div className="section-header"><h2><Search size={24} /> Talent Search</h2></div>
        <select className="job-select" value={selectedJobForSearch?.id || ""} onChange={e => handleJobSelectForSearch(e.target.value)}>
          <option value="">Select a job</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        {selectedJobForSearch && (
          <>
            <div className="filters">
              <select value={searchFilters.bucket} onChange={e => setSearchFilters({ ...searchFilters, bucket: e.target.value })}>
                <option value="">All Buckets</option>
                {["PERFECT_MATCH", "SKILLS_ONLY", "LOCATION_ONLY", "NEARBY", "NO_MATCH"].map(b => <option key={b} value={b}>{b.replace("_", " ")}</option>)}
              </select>
              <input placeholder="Location" value={searchFilters.location} onChange={e => setSearchFilters({ ...searchFilters, location: e.target.value })} />
              <input type="number" placeholder="Min %" value={searchFilters.minTotal} onChange={e => setSearchFilters({ ...searchFilters, minTotal: parseInt(e.target.value) || 0 })} />
              <input placeholder="Skill" value={searchFilters.skillKeyword} onChange={e => setSearchFilters({ ...searchFilters, skillKeyword: e.target.value })} />
              <button onClick={() => setSearchFilters({ bucket: "", location: "", minTotal: 0, skillKeyword: "" })}>Clear</button>
            </div>
            <div className="table-actions">
              <label><input type="checkbox" checked={selectAll} onChange={handleSelectAllSearch} /> Select All ({filtered.length})</label>
              <button onClick={() => { fetchInterviewers(); setShowLockModal(true); }} disabled={!selectedSearchTraineeIds.length}><Lock size={16} /> Lock Selected ({selectedSearchTraineeIds.length})</button>
              <button onClick={downloadFilteredSearch} disabled={!filtered.length}><Download size={16} /> Download Filtered</button>
            </div>
            {searchLoading ? <div className="loading-spinner" /> : (
              <table className="data-table">
                <thead>
                  <tr><th>Select</th><th>Trainee</th><th>Location</th><th>Bucket</th><th>Skills %</th><th>Location %</th><th>Total %</th><th>Matched Skills</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.trainee_id}>
                      <td><input type="checkbox" checked={selectedSearchTraineeIds.includes(String(m.trainee_id))} onChange={e => {
                        const id = String(m.trainee_id);
                        if (e.target.checked) setSelectedSearchTraineeIds(prev => [...prev, id]);
                        else setSelectedSearchTraineeIds(prev => prev.filter(pid => pid !== id));
                      }} /></td>
                      <td>{m.trainee_name}</td>
                      <td>{m.trainee_location}</td>
                      <td><span className={`bucket-tag ${m.bucket?.toLowerCase()}`}>{m.bucket?.replace("_", " ")}</span></td>
                      <td>{m.skills_percentage.toFixed(1)}%</td>
                      <td>{m.location_percentage.toFixed(1)}%</td>
                      <td><strong>{m.total_percentage.toFixed(1)}%</strong></td>
                      <td>{m.matched_skills?.slice(0, 3).join(", ")}{m.matched_skills?.length > 3 && "..."}</td>
                      <td><button className="btn-icon" onClick={() => setSelectedTraineeForView(m)}><Eye size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        {showLockModal && (
          <div className="modal-overlay" onClick={() => setShowLockModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Lock for Interview</h3>
              <label>Date & Time <input type="datetime-local" value={lockInterviewDatetime} onChange={e => setLockInterviewDatetime(e.target.value)} /></label>
              <label>Interviewer <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                <option value="">Select</option>
                {interviewers.map(i => <option key={i.id} value={i.id}>{i.username}</option>)}
              </select></label>
              <label>Comments <textarea value={lockComments} onChange={e => setLockComments(e.target.value)} /></label>
              <div className="modal-actions">
                <button onClick={() => setShowLockModal(false)}>Cancel</button>
                <button onClick={handleLockFromSearch}>Lock</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSelected = () => {
    const selected = interviewLocks.filter(l => l.status === "selected");
    return (
      <div className="selected-tab">
        <div className="section-header">
          <h2><CheckCircle size={24} /> Selected Candidates ({selected.length})</h2>
          <button onClick={() => downloadLockReport("selected")}><Download size={16} /> Download</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Date</th></tr>
          </thead>
          <tbody>
            {selected.map(s => (
              <tr key={s.id}>
                <td>{s.trainee_name}</td>
                <td>{s.job_title}</td>
                <td>{s.assigned_to_name || "-"}</td>
                <td>{formatDate(s.interview_datetime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRejected = () => {
    const rejected = interviewLocks.filter(l => l.status === "rejected");
    return (
      <div className="rejected-tab">
        <div className="section-header">
          <h2><XCircle size={24} /> Rejected Candidates ({rejected.length})</h2>
          <button onClick={() => downloadLockReport("rejected")}><Download size={16} /> Download</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Date</th></tr>
          </thead>
          <tbody>
            {rejected.map(s => (
              <tr key={s.id}>
                <td>{s.trainee_name}</td>
                <td>{s.job_title}</td>
                <td>{s.assigned_to_name || "-"}</td>
                <td>{formatDate(s.interview_datetime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChatbot = () => {
    return (
      <div className="chatbot-tab">
        <div className="chat-header">
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${aiModeEnabled && ollamaAvailable ? 'active' : ''}`}
              onClick={() => { if(ollamaAvailable) setAiModeEnabled(true); else toast.error("Ollama not available"); }}
              disabled={!ollamaAvailable}
            >
              <Zap size={14} /> AI Mode
            </button>
            <button 
              className={`mode-btn ${!aiModeEnabled ? 'active' : ''}`}
              onClick={() => setAiModeEnabled(false)}
            >
              Basic Mode
            </button>
          </div>
          {!ollamaAvailable && <div className="ollama-warning">⚠️ Ollama not reachable. Using Basic Mode.</div>}
        </div>
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-message bot">
                <div className="chat-bubble typing-indicator">...</div>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleChatSend()}
              placeholder="Ask me anything about jobs, skills, matches..."
              disabled={chatLoading}
            />
            <button onClick={handleChatSend} disabled={chatLoading}>Send</button>
          </div>
        </div>
      </div>
    );
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "analytics", label: "Analytics", icon: <Activity size={20} /> },
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
    <div className="dashboard">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="main-content">
        <div className="dashboard-header">
          <h1><LayoutDashboard size={28} /> Manager Dashboard</h1>
          <div className="header-subtitle">Welcome, {userData?.name || "Manager"}</div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

export default DashboardManager;