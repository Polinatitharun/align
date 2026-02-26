import React, { useState, useEffect, useMemo } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "./Sidebar";
import "./styles/ManagerDashboard.css";

import {
  GraduationCap,
  ThumbsUp,
  LayoutDashboard,
  Briefcase,
  Users,
  CheckCircle,
  MapPin,
  Target,
  BriefcaseBusiness,
  Clock,
  Lightbulb,
  Check,
  Calendar,
  User,
  Mail,
  Building,
  BookOpen,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
  BarChart2,
  Search,
  ArrowLeft,
  Navigation,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  Layers,
  Filter,
  PieChart,
  Database,
  XCircle,
} from "lucide-react";
import api from "../api/axios";

function DashboardManager({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // --- View States ---
  const [selectedJobForView, setSelectedJobForView] = useState(null);
  const [selectedTraineeForView, setSelectedTraineeForView] = useState(null);

  // --- Filters ---
  const [matchFilter, setMatchFilter] = useState("perfect");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [traineeSearchTerm, setTraineeSearchTerm] = useState("");
  const [recommendationSearchTerm, setRecommendationSearchTerm] = useState("");

  const [traineeLocationFilter, setTraineeLocationFilter] = useState("all");
  const [traineeStatusFilter, setTraineeStatusFilter] = useState("all");
  const [traineeMappingFilter, setTraineeMappingFilter] = useState("all");

  // --- Data States ---
  const [jobs, setJobs] = useState([]);
  const [traineesList, setTraineesList] = useState([]);
  const [recommendationsList, setRecommendationsList] = useState([]);
  const [jobMatches, setJobMatches] = useState(null);
  const [traineeMatches, setTraineeMatches] = useState(null);

  // --- Open Pool States ---
  const [openPoolTrainees, setOpenPoolTrainees] = useState([]);
  const [openPoolLoading, setOpenPoolLoading] = useState(false);
  const [openPoolError, setOpenPoolError] = useState(null);

  // --- Loading States ---
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [traineeMatchesLoading, setTraineeMatchesLoading] = useState(false);

  // 1. Fetch Jobs
  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const response = await api.get("/jobs/");
        const data = Array.isArray(response.data) ? response.data : [];
        if (!cancelled) setJobs(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        if (!cancelled)
          setJobsError(
            error?.response?.data || error?.message || "Unknown error"
          );
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };
    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Fetch Trainees
  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const response = await api.get("api/profiles/");
        if (Array.isArray(response.data)) {
          setTraineesList(response.data);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast.error("Failed to fetch trainee profiles");
      }
    };
    fetchTrainees();
  }, []);

  // 3. Fetch Recommendations
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await api.get("jobs/recommendations/");
        if (Array.isArray(response.data)) {
          setRecommendationsList(response.data);
        }
      } catch (error) {
        console.error("Error fetching recommendations", error);
      }
    };
    fetchRecs();
  }, []);

  // 4. Fetch Open Pool trainees when tab is active
  useEffect(() => {
    if (activeTab === "open-pool") {
      fetchOpenPoolTrainees();
    }
  }, [activeTab, traineesList]);

  // Function to fetch Open Pool trainees
  const fetchOpenPoolTrainees = async () => {
    setOpenPoolLoading(true);
    setOpenPoolError(null);
    
    try {
      // Get all trainees
      const allTrainees = normalizedTrainees;
      
      // Array to store trainees with zero matches
      const noMatchTrainees = [];
      
      // Check each trainee against all jobs
      for (const trainee of allTrainees) {
        // Skip if trainee is already mapped to a project
        if (trainee.isMapped) {
          continue;
        }
        
        try {
          // Fetch trainee matches
          const response = await api.get(`/trainee-matches/${trainee.traineeId}/`);
          const traineeMatches = response.data;
          
          // Check if trainee has zero matches across all categories
          const hasMatches = 
            (traineeMatches.perfect_match && traineeMatches.perfect_match.length > 0) ||
            (traineeMatches.skills_only && traineeMatches.skills_only.length > 0) ||
            (traineeMatches.location_only && traineeMatches.location_only.length > 0) ||
            (traineeMatches.nearby && traineeMatches.nearby.length > 0) 
            // (traineeMatches.no_match && traineeMatches.no_match.length > 0);
          
          // Only add to open pool if they have ZERO matches
          if (!hasMatches) {
            noMatchTrainees.push(trainee);
          }
        } catch (error) {
          console.error(`Error checking matches for trainee ${trainee.traineeId}:`, error);
          // If we can't fetch matches, assume they have zero matches
          noMatchTrainees.push(trainee);
        }
      }
      
      setOpenPoolTrainees(noMatchTrainees);
    } catch (error) {
      console.error("Error fetching open pool trainees:", error);
      setOpenPoolError(error?.response?.data || error?.message || "Unknown error");
      toast.error("Failed to fetch open pool trainees");
    } finally {
      setOpenPoolLoading(false);
    }
  };

  // Fetch job matches when a job is selected for view
  useEffect(() => {
    if (selectedJobForView) {
      fetchJobMatches(selectedJobForView.id);
    }
  }, [selectedJobForView]);

  // Fetch trainee matches when a trainee is selected for view
  useEffect(() => {
    if (selectedTraineeForView) {
      const traineeIndex = traineesList.findIndex(
        t => t.id === selectedTraineeForView.id
      );
      if (traineeIndex !== -1) {
        fetchTraineeMatches(traineeIndex + 1);
      } else {
        const userId = selectedTraineeForView.userId || selectedTraineeForView.userInfo?.userId;
        if (userId) {
          const traineeIndexByUserId = traineesList.findIndex(
            t => t.userInfo?.userId === userId
          );
          if (traineeIndexByUserId !== -1) {
            fetchTraineeMatches(traineeIndexByUserId + 1);
          } else {
            toast.error("Could not find trainee for matching");
          }
        }
      }
    }
  }, [selectedTraineeForView, traineesList]);

  // Function to fetch job matches
  const fetchJobMatches = async (jobId) => {
    setMatchesLoading(true);
    try {
      const response = await api.get(`/matches/${jobId}/`);
      setJobMatches(response.data);
    } catch (error) {
      console.error(`Error fetching job matches for job ${jobId}:`, error);
      setJobMatches({
        perfect_match: [],
        skills_only: [],
        location_only: [],
        nearby: [],
        no_match: [],
        total_matches: 0
      });
      toast.error("Failed to fetch matching candidates for this job");
    } finally {
      setMatchesLoading(false);
    }
  };

  // Function to fetch trainee matches
  const fetchTraineeMatches = async (traineeIndex) => {
    setTraineeMatchesLoading(true);
    try {
      const response = await api.get(`/trainee-matches/${traineeIndex}/`);
      setTraineeMatches(response.data);
    } catch (error) {
      console.error(`Error fetching trainee matches for index ${traineeIndex}:`, error);
      setTraineeMatches({
        perfect_match: [],
        skills_only: [],
        location_only: [],
        nearby: [],
        no_match: [],
        total_matches: 0
      });
      toast.error("Failed to fetch job matches for this trainee");
    } finally {
      setTraineeMatchesLoading(false);
    }
  };

  // --- Helpers ---
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val))
      return val.map((s) => String(s).trim()).filter(Boolean);
    return String(val)
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  };
  const cap = (s) =>
    typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1) : s;
  const formatLocations = (loc) => {
    const arr = toArray(loc).map((s) => cap(s));
    return arr.length ? arr.join(", ") : "—";
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- Normalize Trainee Data ---
  const normalizedTrainees = useMemo(() => {
    return traineesList.map((t, index) => {
      const strengthSkills = t.strengths
        ? t.strengths.map((s) => s.courseName)
        : [];
      const upskillSkills = t.upskillCourses ? toArray(t.upskillCourses) : [];
      const combinedSkills = [
        ...new Set([...strengthSkills, ...upskillSkills]),
      ];

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
        isu: t.userInfo?.isu || "—",
        isMapped: t.userInfo?.isMapped || false,
        projectId: t.userInfo?.projectId || null,
        projectName: t.userInfo?.projectName || null,
        skills: combinedSkills,
        role: "Trainee",
      };
    });
  }, [traineesList]);

  // Calculate mapped vs unmapped counts
  const mappedUnmappedStats = useMemo(() => {
    const mapped = normalizedTrainees.filter(t => t.isMapped).length;
    const unmapped = normalizedTrainees.filter(t => !t.isMapped).length;
    return { mapped, unmapped, total: mapped + unmapped };
  }, [normalizedTrainees]);

  // --- Filter Trainees ---
  const filteredTrainees = useMemo(() => {
    return normalizedTrainees.filter((trainee) => {
      if (traineeSearchTerm.trim()) {
        const searchLower = traineeSearchTerm.toLowerCase();
        const matchesSearch =
          (trainee.name || "").toLowerCase().includes(searchLower) ||
          (trainee.employeeId || "").toLowerCase().includes(searchLower) ||
          (trainee.location || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (
        traineeLocationFilter !== "all" &&
        trainee.location !== traineeLocationFilter
      )
        return false;
      if (traineeMappingFilter !== "all") {
        if (traineeMappingFilter === "mapped" && !trainee.isMapped) return false;
        if (traineeMappingFilter === "unmapped" && trainee.isMapped) return false;
      }
      return true;
    });
  }, [normalizedTrainees, traineeSearchTerm, traineeLocationFilter, traineeMappingFilter]);

  const uniqueLocations = useMemo(
    () => [
      "all",
      ...new Set(normalizedTrainees.map((t) => t.location).filter(Boolean)),
    ],
    [normalizedTrainees]
  );

  // =========================================================
  // RENDER: Open Pool Tab
  // =========================================================
  const renderOpenPool = () => {
    // Filter open pool trainees based on search term
    const filteredOpenPoolTrainees = openPoolTrainees.filter((trainee) => {
      if (traineeSearchTerm.trim()) {
        const searchLower = traineeSearchTerm.toLowerCase();
        const matchesSearch =
          (trainee.name || "").toLowerCase().includes(searchLower) ||
          (trainee.employeeId || "").toLowerCase().includes(searchLower) ||
          (trainee.location || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (
        traineeLocationFilter !== "all" &&
        trainee.location !== traineeLocationFilter
      )
        return false;
      return true;
    });

    return (
      <div className="open-pool">
        <div className="section-header">
          <div className="header-title">
            <h2>
              <Database size={24} /> Open Pool ({openPoolTrainees.length})
            </h2>
            <p className="subtitle">
              Trainees with zero matches across all available jobs
            </p>
          </div>
          <div className="filter-options">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search open pool trainees..."
                className="search-input"
                value={traineeSearchTerm}
                onChange={(e) => setTraineeSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                className="filter-select"
                value={traineeLocationFilter}
                onChange={(e) => setTraineeLocationFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                {uniqueLocations
                  .filter((l) => l !== "all")
                  .map((loc) => (
                    <option key={loc} value={loc}>
                      {cap(loc)}
                    </option>
                  ))}
              </select>
              <button
                className="refresh-btn"
                onClick={fetchOpenPoolTrainees}
                disabled={openPoolLoading}
              >
                {openPoolLoading ? "Refreshing..." : "Refresh Pool"}
              </button>
            </div>
          </div>
        </div>

        {/* Open Pool Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0f2fe' }}>
              <Database className="stat-icon-svg" style={{ color: '#0284c7' }} />
            </div>
            <div className="stat-content">
              <h3>Open Pool Trainees</h3>
              <div className="stat-value">{openPoolTrainees.length}</div>
              <div className="stat-detail">
                <span>{Math.round((openPoolTrainees.length / mappedUnmappedStats.unmapped) * 100) || 0}% of unmapped</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <AlertCircle className="stat-icon-svg" style={{ color: '#d97706' }} />
            </div>
            <div className="stat-content">
              <h3>Total Jobs</h3>
              <div className="stat-value">{jobs.length}</div>
              <div className="stat-detail">
                <span>Active job profiles</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <CheckCircle className="stat-icon-svg" style={{ color: '#16a34a' }} />
            </div>
            <div className="stat-content">
              <h3>Matched Trainees</h3>
              <div className="stat-value">{mappedUnmappedStats.unmapped - openPoolTrainees.length}</div>
              <div className="stat-detail">
                <span>Have at least one job match</span>
              </div>
            </div>
          </div>
        </div>

        {/* Open Pool Description */}
        <div className="info-card" style={{ 
          backgroundColor: '#f0f9ff', 
          border: '1px solid #bae6fd',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Database size={20} style={{ color: '#0284c7' }} />
            <h3 style={{ color: '#0369a1', margin: 0 }}>About Open Pool</h3>
          </div>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            The Open Pool contains trainees who have <strong>zero matches</strong> across all available job profiles.
            These trainees don't match any job requirements based on skills, location, or other criteria.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>No job matches found</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>Not mapped to any project</span>
            </div>
          </div>
        </div>

        {openPoolLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing trainee-job matches across {jobs.length} jobs...</p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Checking {normalizedTrainees.filter(t => !t.isMapped).length} unmapped trainees
            </p>
          </div>
        ) : openPoolError ? (
          <div className="empty-state">
            <XCircle size={40} style={{ color: '#ef4444' }} />
            <h3>Error Loading Open Pool</h3>
            <p>{openPoolError}</p>
            <button
              className="view-details-btn"
              onClick={fetchOpenPoolTrainees}
              style={{ marginTop: '1rem' }}
            >
              Try Again
            </button>
          </div>
        ) : filteredOpenPoolTrainees.length === 0 ? (
          <div className="empty-state">
            <Database size={40} />
            <h3>No Open Pool Trainees</h3>
            <p>
              {openPoolTrainees.length === 0 
                ? "All unmapped trainees have at least one job match."
                : "No trainees match your search criteria in the open pool."}
            </p>
            {openPoolTrainees.length === 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Consider reviewing job requirements or trainee skills to identify potential matches.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table trainees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Location</th>
                  <th>Average Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpenPoolTrainees.map((trainee) => (
                  <tr key={trainee.id} className="clickable-row">
                    <td>
                      <div className="trainee-info">
                        <div className="avatar" style={{ backgroundColor: '#ef4444' }}>
                          {(trainee.name || "U").charAt(0)}
                        </div>
                        <div className="trainee-details">
                          <div className="name ellipsis">{trainee.name}</div>
                          <div className="email">
                            <Mail size={12} />
                            {trainee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="id-cell">{trainee.employeeId}</div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <MapPin size={14} />
                        {cap(trainee.location)}
                      </div>
                    </td>
                    <td>
                      <div className="score-cell-simple">
                        <span
                          className={`score-val ${
                            trainee.averageScore > 75
                              ? "high"
                              : trainee.averageScore > 50
                              ? "med"
                              : "low"
                          }`}
                        >
                          {trainee.averageScore}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="project-status-badge" style={{ 
                        backgroundColor: '#fee2e2', 
                        color: '#991b1b',
                        border: '1px solid #fecaca'
                      }}>
                        <XCircle size={12} />
                        Zero Job Matches
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-icon btn-icon-view"
                        onClick={() => {
                          setSelectedTraineeForView(trainee);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Open Pool Analysis Section */}
        {openPoolTrainees.length > 0 && !openPoolLoading && (
          <div className="chart-card" style={{ marginTop: '2rem' }}>
            <div className="card-header">
              <PieChart size={20} />
              <h3>Open Pool Analysis</h3>
            </div>
            <div className="mapping-chart">
              <div className="chart-visualization">
                <div className="chart-bars">
                  <div 
                    className="chart-bar" 
                    style={{ 
                      width: `${((mappedUnmappedStats.unmapped - openPoolTrainees.length) / mappedUnmappedStats.unmapped) * 100}%`,
                      backgroundColor: '#10b981'
                    }}
                  >
                    <span className="bar-label">
                      Matched ({mappedUnmappedStats.unmapped - openPoolTrainees.length})
                    </span>
                  </div>
                  <div 
                    className="chart-bar" 
                    style={{ 
                      width: `${(openPoolTrainees.length / mappedUnmappedStats.unmapped) * 100}%`,
                      backgroundColor: '#ef4444'
                    }}
                  >
                    <span className="bar-label">
                      Open Pool ({openPoolTrainees.length})
                    </span>
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                    <span className="legend-text">
                      Unmapped with matches ({mappedUnmappedStats.unmapped - openPoolTrainees.length})
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                    <span className="legend-text">
                      Open Pool - Zero matches ({openPoolTrainees.length})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // GLOBAL RENDER: Trainee Details Page View
  // =========================================================
  const renderTraineeDetailsView = () => {
    if (!selectedTraineeForView) return null;
    const t = selectedTraineeForView;

    return (
      <div className="job-details-page drawer-content">
        <div className="details-nav">
          <button
            className="back-btn"
            onClick={() => {
              setSelectedTraineeForView(null);
              setTraineeMatches(null);
            }}
          >
            <ArrowLeft size={18} /> Close
          </button>
        </div>

        <div className="trainee-header-card">
          <div className="th-main">
            <div className="th-avatar-large">{t.name.charAt(0)}</div>
            <div className="th-info">
              <h1>{t.name}</h1>
              <div className="th-meta">
                <span className="th-tag">
                  <Building size={14} /> {t.employeeId}
                </span>
                <span className="th-tag">
                  <MapPin size={14} /> {cap(t.location)}
                </span>
                <span className="th-tag">
                  <BriefcaseBusiness size={14} /> {t.isu}
                </span>
                {t.isMapped && (
                  <span className="th-tag status-mapped">
                    <CheckCircle size={14} /> Mapped to {t.projectName || "Project"}
                  </span>
                )}
                {!t.isMapped && (
                  <span className="th-tag status-unmapped">
                    <AlertCircle size={14} /> Unmapped
                  </span>
                )}
              </div>
            </div>
            <div className="th-scores">
              <div className="score-box">
                <span className="score-label">Batch Rank</span>
                <span className="score-val">{t.batchRank || "—"}</span>
              </div>
              <div className="score-box">
                <span className="score-label">DPI</span>
                <span className="score-val">{t.dpi || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="trainee-stats-grid">
          <div className="ts-card">
            <h3>
              <BookOpen size={18} /> Upskill Courses
            </h3>
            <div className="chip-list">
              {t.upskillCourses ? (
                toArray(t.upskillCourses).map((c, i) => (
                  <span key={i} className="chip">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-muted">None assigned</span>
              )}
            </div>
          </div>
          <div className="ts-card">
            <h3>
              <BadgeCheck size={18} /> Certificates
            </h3>
            <div className="chip-list">
              {t.certificates ? (
                toArray(t.certificates).map((c, i) => (
                  <span key={i} className="chip cert">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-muted">None</span>
              )}
            </div>
          </div>
        </div>

        <div className="sw-grid">
          <div className="sw-panel strength">
            <h3>
              <TrendingUp size={20} /> Strengths
            </h3>
            <div className="sw-list">
              {t.strengths && t.strengths.length > 0 ? (
                t.strengths.map((s, i) => (
                  <div key={i} className="sw-item">
                    <span className="sw-name">{s.courseName}</span>
                    {s.avgScore && (
                      <span className="sw-score">{s.avgScore}%</span>
                    )}
                  </div>
                ))
              ) : (
                <p>No strengths recorded</p>
              )}
            </div>
          </div>
          <div className="sw-panel weakness">
            <h3>
              <TrendingDown size={20} /> Weaknesses
            </h3>
            <div className="sw-list">
              {t.weaknesses && t.weaknesses.length > 0 ? (
                t.weaknesses.map((w, i) => (
                  <div key={i} className="sw-item">
                    <span className="sw-name">{w.courseName}</span>
                    {w.avgScore && (
                      <span className="sw-score">{w.avgScore}%</span>
                    )}
                  </div>
                ))
              ) : (
                <p>No weaknesses recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Only show job matching section if trainee is NOT mapped */}
        {!t.isMapped && (
          <div className="trainee-matching-section" style={{ marginTop: "2rem" }}>
            <div className="matching-header">
              <h2>
                <Briefcase size={24} /> Job Matches (
                {traineeMatches?.total_matches || 0})
              </h2>
            </div>

            {traineeMatchesLoading ? (
              <div className="loading-state">
                <p>Loading job matches...</p>
              </div>
            ) : traineeMatches ? (
              <div className="job-matches-container">
                {/* Perfect Match */}
                {traineeMatches.perfect_match?.length > 0 && (
                  <div className="match-category">
                    <h3 className="category-title perfect">
                      Perfect Match ({traineeMatches.perfect_match.length})
                    </h3>
                    <div className="matched-jobs-grid">
                      {traineeMatches.perfect_match.map((match, idx) => (
                        <div key={idx} className="matched-job-card">
                          <div className="job-match-header">
                            <h4>{match.job_title}</h4>
                            <span className="match-percentage">
                              {match.total_percentage}%
                            </span>
                          </div>
                          <div className="job-match-details">
                            <div className="match-row">
                              <MapPin size={14} />
                              <span>{formatLocations(match.job_location)}</span>
                            </div>
                            <div className="match-row">
                              <Calendar size={14} />
                              <span>Posted: {formatDate(match.posted_date)}</span>
                            </div>
                            <div className="match-stats">
                              <div className="match-stat">
                                <span className="stat-label">Skills</span>
                                <span className="stat-value">
                                  {match.skills_percentage}%
                                </span>
                              </div>
                              <div className="match-stat">
                                <span className="stat-label">Location</span>
                                <span className="stat-value">
                                  {match.location_percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Only */}
                {traineeMatches.skills_only?.length > 0 && (
                  <div className="match-category">
                    <h3 className="category-title skills">
                      Skills Only ({traineeMatches.skills_only.length})
                    </h3>
                    <div className="matched-jobs-grid">
                      {traineeMatches.skills_only.map((match, idx) => (
                        <div key={idx} className="matched-job-card">
                          <div className="job-match-header">
                            <h4>{match.job_title}</h4>
                            <span className="match-percentage skills">
                              {match.total_percentage}%
                            </span>
                          </div>
                          <div className="job-match-details">
                            <div className="match-row">
                              <MapPin size={14} />
                              <span>{formatLocations(match.job_location)}</span>
                            </div>
                            <div className="match-stats">
                              <div className="match-stat">
                                <span className="stat-label">Skills</span>
                                <span className="stat-value">
                                  {match.skills_percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Only */}
                {traineeMatches.location_only?.length > 0 && (
                  <div className="match-category">
                    <h3 className="category-title location">
                      Location Only ({traineeMatches.location_only.length})
                    </h3>
                    <div className="matched-jobs-grid">
                      {traineeMatches.location_only.map((match, idx) => (
                        <div key={idx} className="matched-job-card">
                          <div className="job-match-header">
                            <h4>{match.job_title}</h4>
                            <span className="match-percentage location">
                              {match.total_percentage}%
                            </span>
                          </div>
                          <div className="job-match-details">
                            <div className="match-row">
                              <MapPin size={14} />
                              <span>{formatLocations(match.job_location)}</span>
                            </div>
                            <div className="match-stats">
                              <div className="match-stat">
                                <span className="stat-label">Location</span>
                                <span className="stat-value">
                                  {match.location_percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby */}
                {traineeMatches.nearby?.length > 0 && (
                  <div className="match-category">
                    <h3 className="category-title nearby">
                      Nearby ({traineeMatches.nearby.length})
                    </h3>
                    <div className="matched-jobs-grid">
                      {traineeMatches.nearby.map((match, idx) => (
                        <div key={idx} className="matched-job-card">
                          <div className="job-match-header">
                            <h4>{match.job_title}</h4>
                            <span className="match-percentage nearby">
                              {match.total_percentage}%
                            </span>
                          </div>
                          <div className="job-match-details">
                            <div className="match-row">
                              <MapPin size={14} />
                              <span>{formatLocations(match.job_location)}</span>
                            </div>
                            <div className="match-stats">
                              <div className="match-stat">
                                <span className="stat-label">Match</span>
                                <span className="stat-value">
                                  {match.total_percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Match */}
                {traineeMatches.no_match?.length > 0 && (
                  <div className="match-category">
                    <h3 className="category-title nomatch">
                      No Match ({traineeMatches.no_match.length})
                    </h3>
                    <div className="matched-jobs-grid">
                      {traineeMatches.no_match.map((match, idx) => (
                        <div key={idx} className="matched-job-card">
                          <div className="job-match-header">
                            <h4>{match.job_title}</h4>
                            <span className="match-percentage nomatch">
                              {match.total_percentage}%
                            </span>
                          </div>
                          <div className="job-match-details">
                            <div className="match-row">
                              <MapPin size={14} />
                              <span>{formatLocations(match.job_location)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!traineeMatches.perfect_match?.length &&
                  !traineeMatches.skills_only?.length &&
                  !traineeMatches.location_only?.length &&
                  !traineeMatches.nearby?.length &&
                  !traineeMatches.no_match?.length && (
                    <div className="no-matches">
                      <p>No job matches found for this trainee.</p>
                      {activeTab === 'open-pool' && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
                          <p style={{ color: '#92400e', fontSize: '0.9rem' }}>
                            <strong>Note:</strong> This trainee has zero matches across all {jobs.length} available jobs.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            ) : (
              <div className="no-matches">
                <p>No job match data available.</p>
              </div>
            )}
          </div>
        )}

        {/* Show message if trainee is already mapped */}
        {t.isMapped && (
          <div className="info-message" style={{ 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #bae6fd',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <CheckCircle size={32} style={{ color: '#0ea5e9', marginBottom: '1rem' }} />
            <h3 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>Trainee Already Mapped</h3>
            <p style={{ color: '#475569' }}>
              This trainee has already been mapped to <strong>{t.projectName || "a project"}</strong>.
              Job matching details are not available for mapped trainees.
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // RENDER: Job Details View (Fixed Job Matching with correct counts)
  // =========================================================
  const renderJobDetailsView = () => {
    if (!selectedJobForView) return null;
    const job = selectedJobForView;

    // Calculate unmapped counts for each category
    const calculateUnmappedCounts = () => {
      if (!jobMatches) return {
        perfect: 0,
        skills: 0,
        location: 0,
        nearby: 0,
        no: 0,
        total: 0
      };

      const getUnmappedCount = (matches) => {
        if (!matches || !Array.isArray(matches)) return 0;
        return matches.filter(match => {
          const trainee = normalizedTrainees.find(t => 
            t.name === match.trainee_name ||
            t.employeeId === match.trainee_id ||
            (t.userId && t.userId.toString() === match.trainee_id?.toString()) ||
            (t.traineeId && t.traineeId.toString() === match.trainee_id?.toString())
          );
          return !trainee?.isMapped;
        }).length;
      };

      return {
        perfect: getUnmappedCount(jobMatches.perfect_match),
        skills: getUnmappedCount(jobMatches.skills_only),
        location: getUnmappedCount(jobMatches.location_only),
        nearby: getUnmappedCount(jobMatches.nearby),
        no: getUnmappedCount(jobMatches.no_match),
        total: jobMatches.total_matches || 0
      };
    };

    const unmappedCounts = calculateUnmappedCounts();

    // Get filtered matches based on current filter - EXCLUDE MAPPED TRAINEES
    const getFilteredMatches = () => {
      if (!jobMatches) return [];
      
      let categoryMatches = [];
      switch (matchFilter) {
        case "perfect":
          categoryMatches = jobMatches.perfect_match || [];
          break;
        case "skills":
          categoryMatches = jobMatches.skills_only || [];
          break;
        case "location":
          categoryMatches = jobMatches.location_only || [];
          break;
        case "nearby":
          categoryMatches = jobMatches.nearby || [];
          break;
        case "no":
          categoryMatches = jobMatches.no_match || [];
          break;
        default:
          categoryMatches = jobMatches.perfect_match || [];
      }
      
      // Filter out mapped trainees
      const filteredMatches = categoryMatches.filter(match => {
        const trainee = normalizedTrainees.find(t => {
          return (
            t.name === match.trainee_name ||
            t.employeeId === match.trainee_id ||
            (t.userId && t.userId.toString() === match.trainee_id?.toString()) ||
            (t.traineeId && t.traineeId.toString() === match.trainee_id?.toString())
          );
        });
        return !trainee?.isMapped;
      });

      return filteredMatches;
    };

    const filteredMatches = getFilteredMatches();
    const totalUnmappedMatches = unmappedCounts.perfect + unmappedCounts.skills + 
                                unmappedCounts.location + unmappedCounts.nearby + unmappedCounts.no;

    return (
      <div className="job-details-page">
        <div className="details-nav">
          <button
            className="back-btn"
            onClick={() => {
              setSelectedJobForView(null);
              setJobMatches(null);
            }}
          >
            <ArrowLeft size={18} /> Back to Job Profiles
          </button>
        </div>

        <div className="job-details-header-card">
          <div className="header-main">
            <div className="job-icon-large">
              <BriefcaseBusiness size={32} />
            </div>
            <div className="job-title-section">
              <h1>{job.title}</h1>
              <div className="job-meta-row">
                <span className="meta-tag">
                  <Building size={14} /> {job.department || "Technology"}
                </span>
                <span className="meta-tag">
                  <MapPin size={14} /> {formatLocations(job.location)}
                </span>
                <span className="meta-tag">
                  <Users size={14} /> {job.openings || 0} Openings
                </span>
                <span className="meta-tag">
                  <Calendar size={14} /> Posted: {formatDate(job.postedDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="job-description-box">
            <h3>Description</h3>
            <p>{job.description || "No description provided."}</p>
          </div>

          <div className="job-skills-box">
            <h3>Required Skills</h3>
            <div className="skills-list">
              {toArray(job.techSkills).map((s, i) => (
                <span key={i} className="skill-tag">
                  {s}
                </span>
              ))}
              {toArray(job.softSkills).map((s, i) => (
                <span key={i} className="skill-tag soft">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="trainee-matching-section">
          <div className="matching-header">
            <h2>
              <Users size={24} /> Candidate Matching ({totalUnmappedMatches})
              <span style={{ fontSize: '0.9rem', color: '#6b7280', marginLeft: '0.75rem', fontWeight: 'normal' }}>
                (Mapped trainees are hidden)
              </span>
            </h2>
            <div className="match-filters">
              {[
                { key: "perfect", label: "Perfect", count: unmappedCounts.perfect },
                { key: "skills", label: "Skills", count: unmappedCounts.skills },
                { key: "location", label: "Location", count: unmappedCounts.location },
                { key: "nearby", label: "Nearby", count: unmappedCounts.nearby },
                { key: "no", label: "No Match", count: unmappedCounts.no },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  className={`filter-tab ${matchFilter === key ? "active" : ""}`}
                  onClick={() => setMatchFilter(key)}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {matchesLoading ? (
            <div className="loading-state">
              <p>Loading matching candidates...</p>
            </div>
          ) : (
            <div className="matched-trainees-grid">
              {filteredMatches.length === 0 ? (
                <div className="no-matches">
                  <Search size={40} />
                  <p>
                    {jobMatches && Object.values(jobMatches).some(arr => Array.isArray(arr) && arr.length > 0)
                      ? `No unmapped candidates found in "${matchFilter}" category.`
                      : "No matching candidates found for this job."}
                  </p>
                </div>
              ) : (
                filteredMatches.map((traineeMatch, index) => {
                  // Find the full trainee object
                  const fullTrainee = normalizedTrainees.find(t => {
                    return (
                      t.name === traineeMatch.trainee_name ||
                      t.employeeId === traineeMatch.trainee_id ||
                      (t.userId && t.userId.toString() === traineeMatch.trainee_id?.toString()) ||
                      (t.traineeId && t.traineeId.toString() === traineeMatch.trainee_id?.toString())
                    );
                  });
                  
                  return (
                    <div key={`${traineeMatch.trainee_id || traineeMatch.trainee_name}-${index}`} className="matched-trainee-card">
                      <div className="mt-header">
                        <div className="mt-avatar">
                          {traineeMatch.trainee_name?.charAt(0) || "U"}
                        </div>
                        <div className="mt-info">
                          <h4>{traineeMatch.trainee_name || "Unknown Trainee"}</h4>
                          <span className="mt-role">{traineeMatch.trainee_id || "—"}</span>
                          {fullTrainee?.isMapped && (
                            <span className="mt-status status-mapped">
                              <CheckCircle size={12} /> Mapped
                            </span>
                          )}
                        </div>
                        <div className="mt-score">
                          <span className="match-percent">
                            {traineeMatch.total_percentage || 0}% Match
                          </span>
                        </div>
                      </div>
                      <div className="mt-body">
                        <div className="mt-row">
                          <MapPin size={14} />
                          <span>{cap(traineeMatch.trainee_location || "Unknown")}</span>
                        </div>
                        <div className="mt-skills-preview">
                          <div className="skills-mini-label">Match Details:</div>
                          <div className="match-details">
                            <div className="match-detail-row">
                              <span className="detail-label">Skills:</span>
                              <span className="detail-value">
                                {traineeMatch.skills_percentage || 0}%
                              </span>
                            </div>
                            <div className="match-detail-row">
                              <span className="detail-label">Location:</span>
                              <span className="detail-value">
                                {traineeMatch.location_percentage || 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {traineeMatch.matched_skills &&
                          traineeMatch.matched_skills.length > 0 && (
                            <div className="mt-skills-preview">
                              <div className="skills-mini-label">
                                Matched Skills:
                              </div>
                              <div className="skills-mini-list">
                                {traineeMatch.matched_skills
                                  .slice(0, 3)
                                  .map((s, i) => (
                                    <span key={i} className="s-tag">
                                      {cap(s)}
                                    </span>
                                  ))}
                                {traineeMatch.matched_skills.length > 3 && (
                                  <span className="s-tag">
                                    +{traineeMatch.matched_skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                      <button
                        className="mt-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fullTrainee) {
                            setSelectedTraineeForView(fullTrainee);
                          } else {
                            // Try to find trainee by name and location
                            const foundTrainee = normalizedTrainees.find(t => 
                              t.name === traineeMatch.trainee_name && 
                              t.location.toLowerCase() === traineeMatch.trainee_location?.toLowerCase()
                            );
                            if (foundTrainee) {
                              setSelectedTraineeForView(foundTrainee);
                            } else {
                              toast.error("Trainee details not found. The trainee might not be in the current list.");
                            }
                          }
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER: Job Profiles List
  // =========================================================
  const renderJobProfiles = () => {
    if (selectedJobForView) return renderJobDetailsView();

    const filteredJobs = jobs.filter((job) => {
      if (!jobSearchTerm.trim()) return true;
      const searchLower = jobSearchTerm.toLowerCase();
      return (
        String(job.title || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(job.department || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(job.location || "")
          .toLowerCase()
          .includes(searchLower)
      );
    });

    return (
      <div className="job-profiles">
        <div className="section-header">
          <div className="header-title">
            <h2>
              <Briefcase size={24} /> Job Profiles ({jobs.length})
            </h2>
            <p className="subtitle">Live jobs fetched from the database</p>
          </div>
          <div className="filter-options">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search jobs..."
                className="search-input"
                value={jobSearchTerm}
                onChange={(e) => setJobSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {!jobsLoading && !jobsError && filteredJobs.length === 0 && (
          <div className="empty-state">
            <Briefcase size={40} />
            <h3>No jobs available</h3>
            <p>There are currently no active job profiles.</p>
          </div>
        )}

        {!jobsLoading && !jobsError && filteredJobs.length > 0 && (
          <div className="job-profiles-grid">
            {filteredJobs.map((job) => {
              const techs = toArray(job.techSkills);
              return (
                <div key={job.id} className="job-profile-card">
                  <div className="profile-header">
                    <div className="profile-title">
                      <div className="profile-icon">
                        <BriefcaseBusiness size={20} />
                      </div>
                      <h3>{job.title}</h3>
                    </div>
                    <div className="location-tag">
                      <MapPin size={14} />
                      {formatLocations(job.location)}
                    </div>
                  </div>
                  <div className="profile-stats">
                    <div className="stat-row">
                      <div className="stat-label">
                        <Building size={14} /> Dept
                      </div>
                      <div className="stat-value">{job.department || "—"}</div>
                    </div>
                    <div className="stat-row">
                      <div className="stat-label">
                        <Users size={14} /> Openings
                      </div>
                      <div className="stat-value">{job.openings ?? "—"}</div>
                    </div>
                    <div className="stat-row">
                      <div className="stat-label">
                        <Calendar size={14} /> Posted
                      </div>
                      <div className="stat-value">
                        {formatDate(job.postedDate)}
                      </div>
                    </div>
                  </div>
                  <div className="skills-container">
                    <h4>Technical Skills</h4>
                    <div className="skills-list">
                      {techs.slice(0, 4).map((s, i) => (
                        <span key={i} className="skill-tag">
                          {s}
                        </span>
                      ))}
                      {techs.length > 4 && (
                        <span className="skill-tag">+{techs.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="view-details-btn"
                    onClick={() => {
                      setSelectedJobForView(job);
                      setMatchFilter("perfect");
                    }}
                  >
                    <Eye size={16} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // RENDER: Trainees Tab
  // =========================================================
  const renderTrainees = () => {
    return (
      <div className="trainees">
        <div className="section-header">
          <div className="header-title">
            <h2>
              <Users size={24} /> All Trainees ({filteredTrainees.length})
            </h2>
            <p className="subtitle">Manage and analyze trainee performance</p>
          </div>
          <div className="filter-options">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, ID, location..."
                className="search-input"
                value={traineeSearchTerm}
                onChange={(e) => setTraineeSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                className="filter-select"
                value={traineeLocationFilter}
                onChange={(e) => setTraineeLocationFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                {uniqueLocations
                  .filter((l) => l !== "all")
                  .map((loc) => (
                    <option key={loc} value={loc}>
                      {cap(loc)}
                    </option>
                  ))}
              </select>
              <select
                className="filter-select"
                value={traineeMappingFilter}
                onChange={(e) => setTraineeMappingFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="mapped">Mapped Only</option>
                <option value="unmapped">Unmapped Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mapped vs Unmapped Chart */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <CheckCircle className="stat-icon-svg" style={{ color: '#059669' }} />
            </div>
            <div className="stat-content">
              <h3>Mapped Trainees</h3>
              <div className="stat-value">{mappedUnmappedStats.mapped}</div>
              <div className="stat-detail">
                <span>{Math.round((mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100) || 0}% of total</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2' }}>
              <AlertCircle className="stat-icon-svg" style={{ color: '#dc2626' }} />
            </div>
            <div className="stat-content">
              <h3>Unmapped Trainees</h3>
              <div className="stat-value">{mappedUnmappedStats.unmapped}</div>
              <div className="stat-detail">
                <span>{Math.round((mappedUnmappedStats.unmapped / mappedUnmappedStats.total) * 100) || 0}% of total</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0f2fe' }}>
              <Database className="stat-icon-svg" style={{ color: '#0284c7' }} />
            </div>
            <div className="stat-content">
              <h3>Open Pool</h3>
              <div className="stat-value">{openPoolTrainees.length}</div>
              <div className="stat-detail">
                <span>{Math.round((openPoolTrainees.length / mappedUnmappedStats.unmapped) * 100) || 0}% of unmapped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mapped vs Unmapped Chart Visualization */}
        <div className="chart-card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <PieChart size={20} />
            <h3>Trainee Distribution</h3>
          </div>
          <div className="mapping-chart">
            <div className="chart-visualization">
              <div className="chart-bars">
                <div 
                  className="chart-bar mapped" 
                  style={{ 
                    width: `${(mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100}%`,
                    backgroundColor: '#10b981'
                  }}
                >
                  <span className="bar-label">Mapped ({mappedUnmappedStats.mapped})</span>
                </div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    width: `${((mappedUnmappedStats.unmapped - openPoolTrainees.length) / mappedUnmappedStats.total) * 100}%`,
                    backgroundColor: '#3b82f6'
                  }}
                >
                  <span className="bar-label">Matched Unmapped ({mappedUnmappedStats.unmapped - openPoolTrainees.length})</span>
                </div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    width: `${(openPoolTrainees.length / mappedUnmappedStats.total) * 100}%`,
                    backgroundColor: '#ef4444'
                  }}
                >
                  <span className="bar-label">Open Pool ({openPoolTrainees.length})</span>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                  <span className="legend-text">Mapped Trainees</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                  <span className="legend-text">Matched Unmapped</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                  <span className="legend-text">Open Pool (Zero Matches)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredTrainees.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>No trainees found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table trainees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Location</th>
                  <th>Mapping Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainees.map((trainee) => (
                  <tr key={trainee.id} className="clickable-row">
                    <td>
                      <div className="trainee-info">
                        <div className="avatar">
                          {(trainee.name || "U").charAt(0)}
                        </div>
                        <div className="trainee-details">
                          <div className="name ellipsis">{trainee.name}</div>
                          <div className="email">
                            <Mail size={12} />
                            {trainee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="id-cell">{trainee.employeeId}</div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <MapPin size={14} />
                        {cap(trainee.location)}
                      </div>
                    </td>
                    <td>
                      {trainee.isMapped ? (
                        <div className="project-status-badge status-approved">
                          <CheckCircle size={12} />
                          Mapped to {trainee.projectName || "Project"}
                        </div>
                      ) : (
                        <div className="project-status-badge status-unassigned">
                          <AlertCircle size={12} />
                          Unmapped
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-icon btn-icon-view"
                        onClick={() => {
                          setSelectedTraineeForView(trainee);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // RENDER: Overview Tab
  // =========================================================
  const renderOverview = () => (
    <div className="overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Briefcase className="stat-icon-svg" />
          </div>
          <div className="stat-content">
            <h3>Active Jobs</h3>
            <div className="stat-value">{jobs.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <CheckCircle className="stat-icon-svg" style={{ color: '#059669' }} />
          </div>
          <div className="stat-content">
            <h3>Mapped Trainees</h3>
            <div className="stat-value">{mappedUnmappedStats.mapped}</div>
            <div className="stat-detail">
              <span>{Math.round((mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100) || 0}% of total</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <AlertCircle className="stat-icon-svg" style={{ color: '#dc2626' }} />
          </div>
          <div className="stat-content">
            <h3>Unmapped Trainees</h3>
            <div className="stat-value">{mappedUnmappedStats.unmapped}</div>
            <div className="stat-detail">
              <span>{Math.round((mappedUnmappedStats.unmapped / mappedUnmappedStats.total) * 100) || 0}% of total</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe' }}>
            <Database className="stat-icon-svg" style={{ color: '#0284c7' }} />
          </div>
          <div className="stat-content">
            <h3>Open Pool</h3>
            <div className="stat-value">{openPoolTrainees.length}</div>
            <div className="stat-detail">
              <span>{Math.round((openPoolTrainees.length / mappedUnmappedStats.unmapped) * 100) || 0}% of unmapped</span>
            </div>
          </div>
        </div>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="skills-demand-header">
            <div className="card-header">
              <div>
                <Briefcase size={20} />
              </div>
              <h3>Projects by Skills Demand</h3>
            </div>
            <button
              className="view-all-btn"
              onClick={() => setActiveTab("job-profiles")}
            >
              <Eye size={16} /> View All
            </button>
          </div>
          <div className="skills-chart">
            {jobs.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="project-skill-row"
                onClick={() => {
                  setActiveTab("job-profiles");
                  setSelectedJobForView(project);
                }}
              >
                <div className="project-info">
                  <div className="project-name">{project.title}</div>
                  <div className="project-meta">
                    <Users size={14} /> {project.openings || 0} openings
                  </div>
                </div>
                <div className="skill-tags">
                  {toArray(project.techSkills)
                    .slice(0, 5)
                    .map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                </div>
              </div>
            ))}
            {jobs.length === 0 && !jobsLoading && (
              <div className="empty-state">
                <p>No projects available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Mapped vs Unmapped Chart in Overview */}
        <div className="chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <PieChart size={20} />
            <h3>Trainee Distribution</h3>
          </div>
          <div className="mapping-chart">
            <div className="chart-visualization">
              <div className="chart-bars">
                <div 
                  className="chart-bar mapped" 
                  style={{ 
                    width: `${(mappedUnmappedStats.mapped / mappedUnmappedStats.total) * 100}%`,
                    backgroundColor: '#10b981'
                  }}
                >
                  <span className="bar-label">Mapped ({mappedUnmappedStats.mapped})</span>
                </div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    width: `${((mappedUnmappedStats.unmapped - openPoolTrainees.length) / mappedUnmappedStats.total) * 100}%`,
                    backgroundColor: '#3b82f6'
                  }}
                >
                  <span className="bar-label">Matched Unmapped ({mappedUnmappedStats.unmapped - openPoolTrainees.length})</span>
                </div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    width: `${(openPoolTrainees.length / mappedUnmappedStats.total) * 100}%`,
                    backgroundColor: '#ef4444'
                  }}
                >
                  <span className="bar-label">Open Pool ({openPoolTrainees.length})</span>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                  <span className="legend-text">Mapped Trainees</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                  <span className="legend-text">Matched Unmapped</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                  <span className="legend-text">Open Pool (Zero Matches)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Update sidebar items to include Open Pool
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
    {
      id: "job-profiles",
      label: "Job Profiles",
      icon: <Briefcase size={20} />,
    },
    { id: "trainees", label: "Trainees", icon: <Users size={20} /> },
    { id: "open-pool", label: "Open Pool", icon: <Database size={20} /> },
  ];

  return (
    <>
      <Toaster position="top-right" expand={true} richColors />
      <div
        className={`dashboard ${selectedTraineeForView ? "drawer-open" : ""}`}
      >
        <Sidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userData={userData}
          onLogout={onLogout}
        />
        <div className="main-content">
          <div className="dashboard-header">
            <div className="header-title">
              <h1>
                <LayoutDashboard size={28} /> Manager Dashboard
              </h1>
              <div className="header-subtitle">
                Welcome, {userData?.name || "Manager"}
              </div>
            </div>
          </div>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "job-profiles" && renderJobProfiles()}
          {activeTab === "trainees" && renderTrainees()}
          {activeTab === "open-pool" && renderOpenPool()}
        </div>

        {/* Right Drawer for Trainee Details */}
        {selectedTraineeForView && (
          <div className="details-drawer">{renderTraineeDetailsView()}</div>
        )}
      </div>
    </>
  );
}

export default DashboardManager;

