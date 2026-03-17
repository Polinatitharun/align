// DashboardManager.js – Enhanced with all insights and downloads
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
  Mail,
  Building,
  BookOpen,
  AlertCircle,
  Eye,
  X,
  BarChart2,
  Search,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  Layers,
  PieChart,
  Database,
  XCircle,
  Download,
  Filter,
  Lock,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  File,
  Upload,
  Users2,
} from "lucide-react";
import api from "../api/axios";

function DashboardManager({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // ---- Data States ----
  const [jobs, setJobs] = useState([]);
  const [traineesList, setTraineesList] = useState([]);
  const [interviewLocks, setInterviewLocks] = useState([]);
  const [selectedJobForView, setSelectedJobForView] = useState(null);
  const [selectedTraineeForView, setSelectedTraineeForView] = useState(null);
  const [jobMatches, setJobMatches] = useState(null);
  const [traineeMatches, setTraineeMatches] = useState(null);
  const [openPoolTrainees, setOpenPoolTrainees] = useState([]);
  const [openPoolLoading, setOpenPoolLoading] = useState(false);

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
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ==================== Data Fetching ====================
  useEffect(() => {
    fetchJobs();
    fetchTrainees();
    fetchLocks();
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
        } catch (error) {
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
    return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  };

  // Normalize trainees
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
        email: "user@example.com",
        location: (t.userInfo?.location || "").toLowerCase(),
        employeeId: t.userInfo?.employeeId || "—",
        averageScore: t.userInfo?.averageScore || 0,
        isMapped: t.userInfo?.isMapped || false,
        projectId: t.userInfo?.projectId || null,
        projectName: t.userInfo?.projectName || null,
        skills: combinedSkills,
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
      handleJobSelectForSearch(selectedJobForSearch.id); // refresh
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

  // ==================== Render Functions ====================

  const renderOverview = () => {
    const skillDemand = jobs.reduce((acc, job) => {
      (job.techSkills || []).forEach(s => acc[s] = (acc[s] || 0) + 1);
      (job.softSkills || []).forEach(s => acc[s] = (acc[s] || 0) + 1);
      return acc;
    }, {});
    const topSkills = Object.entries(skillDemand).sort((a,b) => b[1]-a[1]).slice(0,5);

    return (
      <div className="overview">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon"><Briefcase /></div><div className="stat-content"><h3>Active Jobs</h3><div className="stat-value">{jobs.length}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Users /></div><div className="stat-content"><h3>Total Trainees</h3><div className="stat-value">{mappedUnmappedStats.total}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Mapped</h3><div className="stat-value">{mappedUnmappedStats.mapped}</div><div className="stat-detail">{Math.round((mappedUnmappedStats.mapped/mappedUnmappedStats.total)*100)}%</div></div></div>
          <div className="stat-card"><div className="stat-icon"><AlertCircle /></div><div className="stat-content"><h3>Unmapped</h3><div className="stat-value">{mappedUnmappedStats.unmapped}</div><div className="stat-detail">{Math.round((mappedUnmappedStats.unmapped/mappedUnmappedStats.total)*100)}%</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Database /></div><div className="stat-content"><h3>Open Pool</h3><div className="stat-value">{openPoolTrainees.length}</div><div className="stat-detail">{Math.round((openPoolTrainees.length/mappedUnmappedStats.unmapped)*100)||0}% of unmapped</div></div></div>
          <div className="stat-card"><div className="stat-icon"><Lock /></div><div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.locked}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.selected}</div></div></div>
          <div className="stat-card"><div className="stat-icon"><XCircle /></div><div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.rejected}</div></div></div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Top Skills in Demand</h3>
            <div className="skills-chart">
              {topSkills.map(([skill, count]) => (
                <div key={skill} className="skill-row"><span>{skill}</span><div className="bar" style={{width: `${(count/topSkills[0][1])*100}%`}}>{count}</div></div>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <h3>Trainee Distribution</h3>
            <div className="mapping-chart">
              <div className="bar-row"><span>Mapped</span><div className="bar" style={{width: `${(mappedUnmappedStats.mapped/mappedUnmappedStats.total)*100}%`}}>{mappedUnmappedStats.mapped}</div></div>
              <div className="bar-row"><span>Unmapped (matched)</span><div className="bar" style={{width: `${((mappedUnmappedStats.unmapped-openPoolTrainees.length)/mappedUnmappedStats.total)*100}%`}}>{mappedUnmappedStats.unmapped-openPoolTrainees.length}</div></div>
              <div className="bar-row"><span>Open Pool</span><div className="bar" style={{width: `${(openPoolTrainees.length/mappedUnmappedStats.total)*100}%`}}>{openPoolTrainees.length}</div></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderJobProfiles = () => {
    const filtered = jobs.filter(j => !jobSearchTerm || j.title.toLowerCase().includes(jobSearchTerm.toLowerCase()));
    return (
      <div className="job-profiles">
        <div className="section-header">
          <h2><Briefcase size={24} /> Job Profiles ({jobs.length})</h2>
          <div className="search-box"><input value={jobSearchTerm} onChange={e=>setJobSearchTerm(e.target.value)} placeholder="Search jobs..." /></div>
        </div>
        <div className="job-profiles-grid">
          {filtered.map(job => (
            <div key={job.id} className="job-profile-card">
              <h3>{job.title}</h3>
              <div className="meta"><Building size={14} /> {job.department} <MapPin size={14} /> {Array.isArray(job.location)?job.location.join(", "):job.location}</div>
              <div className="openings"><Users size={14} /> {job.openings} openings</div>
              <button onClick={()=>{ setSelectedJobForView(job); setActiveTab("job-details"); }} className="view-details-btn"><Eye size={16} /> View Details</button>
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
        <div className="details-nav"><button onClick={()=>{ setSelectedJobForView(null); setActiveTab("job-profiles"); }}><ArrowLeft size={18} /> Back</button></div>
        <h1>{job.title}</h1>
        <div className="job-info">
          <p><Building/> {job.department}</p><p><MapPin/> {Array.isArray(job.location)?job.location.join(", "):job.location}</p>
          <p><Users/> {job.openings} openings ({job.filled} filled)</p><p><Calendar/> Posted: {formatDate(job.postedDate)}</p>
        </div>
        <h3>Matching Candidates</h3>
        {matchesLoading ? <div className="loading-spinner"/> : (
          <div className="match-categories">
            {["perfect_match","skills_only","location_only","nearby","no_match"].map(cat => (
              <div key={cat} className="match-category">
                <h4>{cat.replace("_"," ").toUpperCase()} ({jobMatches?.[cat]?.length||0})</h4>
                <div className="match-grid">
                  {(jobMatches?.[cat]||[]).map(m => (
                    <div key={m.trainee_id} className="match-card" onClick={()=> setSelectedTraineeForView(m)}>
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
          <input value={traineeSearchTerm} onChange={e=>setTraineeSearchTerm(e.target.value)} placeholder="Search..." />
          <select value={traineeLocationFilter} onChange={e=>setTraineeLocationFilter(e.target.value)}>
            <option value="all">All Locations</option>
            {uniqueLocations.filter(l=>l!=="all").map(l=><option key={l} value={l}>{cap(l)}</option>)}
          </select>
          <select value={traineeMappingFilter} onChange={e=>setTraineeMappingFilter(e.target.value)}>
            <option value="all">All Status</option><option value="mapped">Mapped</option><option value="unmapped">Unmapped</option>
          </select>
          <button onClick={()=>downloadReport("mapped")}><Download size={16} /> Mapped</button>
          <button onClick={()=>downloadReport("unmapped")}><Download size={16} /> Unmapped</button>
        </div>
      </div>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Employee ID</th><th>Location</th><th>Mapping Status</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredTrainees.map(t => (
            <tr key={t.id} onClick={()=>setSelectedTraineeForView(t)} className="clickable-row">
              <td><div className="trainee-info"><div className="avatar">{t.name.charAt(0)}</div>{t.name}</div></td>
              <td>{t.employeeId}</td><td>{cap(t.location)}</td>
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
        <div className="section-header"><h2><Database size={24} /> Open Pool ({openPoolTrainees.length})</h2><input value={traineeSearchTerm} onChange={e=>setTraineeSearchTerm(e.target.value)} placeholder="Search..." /></div>
        {openPoolLoading ? <div className="loading-spinner"/> : filtered.length===0 ? <div className="empty-state"><Database size={40} /><h3>No open pool trainees</h3></div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Location</th><th>Score</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} onClick={()=>setSelectedTraineeForView(t)} className="clickable-row">
                  <td>{t.name}</td><td>{cap(t.location)}</td><td>{t.averageScore}</td>
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
        <select className="job-select" value={selectedJobForSearch?.id || ""} onChange={e=>handleJobSelectForSearch(e.target.value)}>
          <option value="">Select a job</option>
          {jobs.map(j=> <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        {selectedJobForSearch && (
          <>
            <div className="filters">
              <select value={searchFilters.bucket} onChange={e=>setSearchFilters({...searchFilters, bucket:e.target.value})}>
                <option value="">All Buckets</option>
                {["PERFECT_MATCH","SKILLS_ONLY","LOCATION_ONLY","NEARBY","NO_MATCH"].map(b=><option key={b} value={b}>{b.replace("_"," ")}</option>)}
              </select>
              <input placeholder="Location" value={searchFilters.location} onChange={e=>setSearchFilters({...searchFilters, location:e.target.value})} />
              <input type="number" placeholder="Min %" value={searchFilters.minTotal} onChange={e=>setSearchFilters({...searchFilters, minTotal:parseInt(e.target.value)||0})} />
              <input placeholder="Skill" value={searchFilters.skillKeyword} onChange={e=>setSearchFilters({...searchFilters, skillKeyword:e.target.value})} />
              <button onClick={()=>setSearchFilters({bucket:"",location:"",minTotal:0,skillKeyword:""})}>Clear</button>
            </div>
            <div className="table-actions">
              <label><input type="checkbox" checked={selectAll} onChange={handleSelectAllSearch} /> Select All ({filtered.length})</label>
              <button onClick={()=>{ fetchInterviewers(); setShowLockModal(true); }} disabled={!selectedSearchTraineeIds.length}><Lock size={16} /> Lock Selected ({selectedSearchTraineeIds.length})</button>
              <button onClick={downloadFilteredSearch} disabled={!filtered.length}><Download size={16} /> Download Filtered</button>
            </div>
            {searchLoading ? <div className="loading-spinner"/> : (
              <table className="data-table">
                <thead><tr><th>Select</th><th>Trainee</th><th>Location</th><th>Bucket</th><th>Skills %</th><th>Location %</th><th>Total %</th><th>Matched Skills</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.trainee_id}>
                      <td><input type="checkbox" checked={selectedSearchTraineeIds.includes(String(m.trainee_id))} onChange={e=>{
                        const id = String(m.trainee_id);
                        if(e.target.checked) setSelectedSearchTraineeIds(prev=>[...prev,id]);
                        else setSelectedSearchTraineeIds(prev=>prev.filter(pid=>pid!==id));
                      }}/></td>
                      <td>{m.trainee_name}</td><td>{m.trainee_location}</td>
                      <td><span className={`bucket-tag ${m.bucket?.toLowerCase()}`}>{m.bucket?.replace("_"," ")}</span></td>
                      <td>{m.skills_percentage.toFixed(1)}%</td><td>{m.location_percentage.toFixed(1)}%</td>
                      <td><strong>{m.total_percentage.toFixed(1)}%</strong></td>
                      <td>{m.matched_skills?.slice(0,3).join(", ")}{m.matched_skills?.length>3 && "..."}</td>
                      <td><button className="btn-icon" onClick={()=>setSelectedTraineeForView(m)}><Eye size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        {showLockModal && (
          <div className="modal-overlay" onClick={()=>setShowLockModal(false)}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
              <h3>Lock for Interview</h3>
              <label>Date & Time <input type="datetime-local" value={lockInterviewDatetime} onChange={e=>setLockInterviewDatetime(e.target.value)} /></label>
              <label>Interviewer <select value={assignedToId} onChange={e=>setAssignedToId(e.target.value)}>
                <option value="">Select</option>
                {interviewers.map(i=><option key={i.id} value={i.id}>{i.username}</option>)}
              </select></label>
              <label>Comments <textarea value={lockComments} onChange={e=>setLockComments(e.target.value)} /></label>
              <div className="modal-actions">
                <button onClick={()=>setShowLockModal(false)}>Cancel</button>
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
        <div className="section-header"><h2><CheckCircle size={24} /> Selected Candidates ({selected.length})</h2><button onClick={()=>downloadLockReport("selected")}><Download size={16} /> Download</button></div>
        <table className="data-table">
          <thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Date</th></tr></thead>
          <tbody>
            {selected.map(s=><tr key={s.id}><td>{s.trainee_name}</td><td>{s.job_title}</td><td>{s.assigned_to_name||"-"}</td><td>{formatDate(s.interview_datetime)}</td></tr>)}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRejected = () => {
    const rejected = interviewLocks.filter(l => l.status === "rejected");
    return (
      <div className="rejected-tab">
        <div className="section-header"><h2><XCircle size={24} /> Rejected Candidates ({rejected.length})</h2><button onClick={()=>downloadLockReport("rejected")}><Download size={16} /> Download</button></div>
        <table className="data-table">
          <thead><tr><th>Trainee</th><th>Job</th><th>Interviewer</th><th>Date</th></tr></thead>
          <tbody>
            {rejected.map(s=><tr key={s.id}><td>{s.trainee_name}</td><td>{s.job_title}</td><td>{s.assigned_to_name||"-"}</td><td>{formatDate(s.interview_datetime)}</td></tr>)}
          </tbody>
        </table>
      </div>
    );
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
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