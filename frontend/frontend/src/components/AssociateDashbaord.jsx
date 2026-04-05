// AssociateDashboard.js – Enhanced with market insights and career path
import React, { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import "./styles/AssociateDashboard.css";
import { Toaster, toast } from "sonner";
import {
  User,
  Briefcase,
  GraduationCap,
  Target,
  Lightbulb,
  BookOpen,
  Map,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Sparkles,
  Loader,
  TrendingUp,
  Users,
  PieChart,
  BarChart,
  Calendar,
  Link as LinkIcon,
  AlertCircle,
  Building,
  DollarSign,
  Star,
  Zap,
} from "lucide-react";

function AssociateDashboard({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Profile data
  const [profile, setProfile] = useState(null);

  // Jobs data
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // AI generated data
  const [suggestion, setSuggestion] = useState("");
  const [interviewQA, setInterviewQA] = useState(null);
  const [careerPath, setCareerPath] = useState(null);

  // Dashboard insights from backend
  const [skillGaps, setSkillGaps] = useState([]);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [dashboardAdvice, setDashboardAdvice] = useState("");

  // Additional insights data
  const [traineeMatches, setTraineeMatches] = useState(null);
  const [recentSelections, setRecentSelections] = useState([]);
  const [skillDemand, setSkillDemand] = useState([]);
  const [marketTrends, setMarketTrends] = useState({});

  // Loading states
  const [loading, setLoading] = useState({
    profile: true,
    jobs: true,
    suggestion: false,
    interview: false,
    career: false,
    dashboard: true,
    matches: true,
    selections: true,
    demand: true,
  });

  useEffect(() => {
    fetchProfile();
    fetchPublicJobs();
    fetchDashboardData();
    fetchTraineeMatches();
    fetchRecentSelections();
    fetchSkillDemand();
  }, []);

  const fetchProfile = async () => {
    setLoading((prev) => ({ ...prev, profile: true }));
    try {
      const response = await api.get("associate/profile/");
      setProfile(response.data);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const fetchPublicJobs = async () => {
    setLoading((prev) => ({ ...prev, jobs: true }));
    try {
      const response = await api.get("/associate/jobs/public/");
      setJobs(response.data);
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading((prev) => ({ ...prev, jobs: false }));
    }
  };

  const fetchDashboardData = async () => {
    setLoading((prev) => ({ ...prev, dashboard: true }));
    try {
      const response = await api.get("/associate/dashboard/");
      setSkillGaps(response.data.skill_gaps || []);
      setSimilarProjects(response.data.similar_projects || []);
      setDashboardAdvice(response.data.advice || "");
    } catch (err) {
      toast.error("Failed to load dashboard insights");
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  };

  const fetchTraineeMatches = async () => {
    setLoading((prev) => ({ ...prev, matches: true }));
    try {
      // need trainee id – fetch from profile first, but profile may not be ready.
      // we can call after profile is loaded, or use a separate effect.
      if (!profile?.id) return;
      const response = await api.get(`/trainee-matches/${profile.id}/`);
      setTraineeMatches(response.data);
    } catch (err) {
      console.log("Trainee matches not available");
    } finally {
      setLoading((prev) => ({ ...prev, matches: false }));
    }
  };

  const fetchRecentSelections = async () => {
    setLoading((prev) => ({ ...prev, selections: true }));
    try {
      const response = await api.get("/interview-locks/?status=selected");
      // take latest 5
      setRecentSelections(response.data.slice(0, 5));
    } catch (err) {
      console.log("Recent selections not available");
    } finally {
      setLoading((prev) => ({ ...prev, selections: false }));
    }
  };

  const fetchSkillDemand = async () => {
    setLoading((prev) => ({ ...prev, demand: true }));
    try {
      // Get all jobs (public) and compute skill frequency
      const response = await api.get("/associate/jobs/public/");
      const allJobs = response.data;
      const skillCount = {};
      allJobs.forEach((job) => {
        (job.techSkills || []).forEach((skill) => {
          skillCount[skill] = (skillCount[skill] || 0) + 1;
        });
        (job.softSkills || []).forEach((skill) => {
          skillCount[skill] = (skillCount[skill] || 0) + 1;
        });
      });
      const sorted = Object.entries(skillCount)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setSkillDemand(sorted);
    } catch (err) {
      console.log("Skill demand not available");
    } finally {
      setLoading((prev) => ({ ...prev, demand: false }));
    }
  };

  // Re-fetch matches when profile is ready
  useEffect(() => {
    if (profile?.id) {
      fetchTraineeMatches();
    }
  }, [profile]);

  const handleGetSuggestion = async (job) => {
    setSelectedJob(job);
    setSuggestion("");
    setLoading((prev) => ({ ...prev, suggestion: true }));
    try {
      const response = await api.post("/associate/suggest/", { job_id: job.id });
      setSuggestion(response.data.suggestion);
    } catch (err) {
      toast.error("Failed to generate suggestion");
    } finally {
      setLoading((prev) => ({ ...prev, suggestion: false }));
    }
  };

  const handleGetInterviewQA = async (job) => {
    setSelectedJob(job);
    setInterviewQA(null);
    setLoading((prev) => ({ ...prev, interview: true }));
    try {
      const response = await api.post("/associate/interview-questions/", {
        job_id: job.id,
        levels: ["low", "medium", "high"],
      });
      setInterviewQA(response.data);
    } catch (err) {
      toast.error("Failed to generate interview questions");
    } finally {
      setLoading((prev) => ({ ...prev, interview: false }));
    }
  };

  const handleGetCareerPath = async () => {
    setLoading((prev) => ({ ...prev, career: true }));
    try {
      const response = await api.get("/associate/career-path/");
      setCareerPath(response.data);
      setActiveTab("career");
    } catch (err) {
      toast.error("Failed to generate career path");
    } finally {
      setLoading((prev) => ({ ...prev, career: false }));
    }
  };

  // Helper to render strength/weakness chips
  const renderSkillChips = (items, type) => {
    const color = type === "strength" ? "green" : "red";
    return items.map((item, idx) => (
      <span key={idx} className={`skill-chip ${color}`}>
        {item.courseName} {item.avgScore ? `(${item.avgScore}%)` : ""}
      </span>
    ));
  };

  // Profile card
  const renderProfileCard = () => {
    if (loading.profile) return <div className="loading-spinner">Loading profile...</div>;
    if (!profile) return <div>No profile data</div>;

    const userInfo = profile.userInfo || {};
    return (
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{userInfo.name?.charAt(0) || "U"}</div>
          <div className="profile-title">
            <h2>{userInfo.name || "Unknown"}</h2>
            <p>
              <User size={14} /> {userInfo.userId} • {userInfo.location || "Location not set"}
            </p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-item">
            <GraduationCap size={18} />
            <span>Average Score: {userInfo.averageScore || "N/A"}%</span>
          </div>
          <div className="detail-item">
            <Award size={18} />
            <span>Rank: {profile.batchRank || "N/A"}</span>
          </div>
          <div className="detail-item">
            <Clock size={18} />
            <span>Joined: {profile.created_at?.split("T")[0]}</span>
          </div>
        </div>
        <div className="profile-skills">
          <div className="skill-section">
            <h4>Strengths</h4>
            <div className="skill-list">
              {profile.strengths?.length > 0
                ? renderSkillChips(profile.strengths, "strength")
                : "No strengths recorded"}
            </div>
          </div>
          <div className="skill-section">
            <h4>Weaknesses / Areas to Improve</h4>
            <div className="skill-list">
              {profile.weaknesses?.length > 0
                ? renderSkillChips(profile.weaknesses, "weakness")
                : "No weaknesses recorded"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Skill gap analysis card
  const renderSkillGaps = () => {
    if (loading.dashboard) return <div className="loading-spinner">Loading insights...</div>;
    if (!skillGaps.length) return null;

    return (
      <div className="insight-card">
        <h3><Target size={20} /> Skill Gap Analysis</h3>
        <p className="insight-advice">{dashboardAdvice}</p>
        <div className="gaps-list">
          {skillGaps.map((gap, idx) => (
            <div key={idx} className="gap-item">
              <div className="gap-header">
                <span className="job-title">{gap.job_title}</span>
                <span className={`match-percent ${gap.has_all_skills ? "full" : "partial"}`}>
                  {gap.match_percentage}% Match
                </span>
              </div>
              {!gap.has_all_skills && (
                <div className="missing-skills">
                  <strong>Missing skills:</strong> {gap.missing_skills.join(", ")}
                </div>
              )}
              {gap.has_all_skills && <div className="full-match">✅ You have all required skills!</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Similar projects card
  const renderSimilarProjects = () => {
    if (loading.dashboard) return null;
    if (!similarProjects.length) return null;

    return (
      <div className="insight-card">
        <h3><TrendingUp size={20} /> People with Your Strengths Were Selected For</h3>
        <div className="project-list">
          {similarProjects.map((project) => (
            <div key={project.id} className="project-item">
              <h4>{project.title}</h4>
              <p><Briefcase size={14} /> {project.department}</p>
              <p><Map size={14} /> {project.location?.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Skill demand card
  const renderSkillDemand = () => {
    if (loading.demand) return <div className="loading-spinner">Loading market data...</div>;
    if (!skillDemand.length) return null;

    return (
      <div className="insight-card">
        <h3><BarChart size={20} /> Top Skills in Demand</h3>
        <div className="demand-list">
          {skillDemand.map((item, idx) => (
            <div key={idx} className="demand-item">
              <span className="skill-name">{item.skill}</span>
              <div className="demand-bar-container">
                <div
                  className="demand-bar"
                  style={{ width: `${(item.count / skillDemand[0].count) * 100}%` }}
                />
              </div>
              <span className="skill-count">{item.count} jobs</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Recent selections card
  const renderRecentSelections = () => {
    if (loading.selections) return <div className="loading-spinner">Loading recent hires...</div>;
    if (!recentSelections.length) return null;

    return (
      <div className="insight-card">
        <h3><Users size={20} /> Recent Hires</h3>
        <div className="recent-list">
          {recentSelections.map((sel) => (
            <div key={sel.id} className="recent-item">
              <div className="recent-avatar">{sel.trainee_name?.charAt(0)}</div>
              <div className="recent-info">
                <span className="recent-name">{sel.trainee_name}</span>
                <span className="recent-job">{sel.job_title}</span>
              </div>
              <span className="recent-date">{new Date(sel.interview_datetime).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Match distribution card (pie chart simplified as stacked bar)
  const renderMatchDistribution = () => {
    if (loading.matches || !traineeMatches) return null;

    const total = traineeMatches.total_matches || 0;
    if (total === 0) return null;

    const perfect = traineeMatches.perfect_match?.length || 0;
    const skills = traineeMatches.skills_only?.length || 0;
    const location = traineeMatches.location_only?.length || 0;
    const nearby = traineeMatches.nearby?.length || 0;
    const noMatch = traineeMatches.no_match?.length || 0;

    return (
      <div className="insight-card">
        <h3><PieChart size={20} /> Your Match Distribution</h3>
        <div className="match-distribution">
          <div className="stacked-bar">
            {perfect > 0 && (
              <div className="bar-segment perfect" style={{ width: `${(perfect / total) * 100}%` }}>
                {perfect}
              </div>
            )}
            {skills > 0 && (
              <div className="bar-segment skills" style={{ width: `${(skills / total) * 100}%` }}>
                {skills}
              </div>
            )}
            {location > 0 && (
              <div className="bar-segment location" style={{ width: `${(location / total) * 100}%` }}>
                {location}
              </div>
            )}
            {nearby > 0 && (
              <div className="bar-segment nearby" style={{ width: `${(nearby / total) * 100}%` }}>
                {nearby}
              </div>
            )}
            {noMatch > 0 && (
              <div className="bar-segment nomatch" style={{ width: `${(noMatch / total) * 100}%` }}>
                {noMatch}
              </div>
            )}
          </div>
          <div className="legend">
            <div className="legend-item"><span className="legend-color perfect"></span> Perfect ({perfect})</div>
            <div className="legend-item"><span className="legend-color skills"></span> Skills ({skills})</div>
            <div className="legend-item"><span className="legend-color location"></span> Location ({location})</div>
            <div className="legend-item"><span className="legend-color nearby"></span> Nearby ({nearby})</div>
            <div className="legend-item"><span className="legend-color nomatch"></span> No Match ({noMatch})</div>
          </div>
        </div>
      </div>
    );
  };

  // Skill demand vs your score (for top matched jobs)
  const renderSkillVsScore = () => {
    if (!skillGaps.length) return null;

    return (
      <div className="insight-card">
        <h3><Zap size={20} /> Skill Demand vs. Your Score</h3>
        <div className="vs-list">
          {skillGaps.slice(0, 3).map((gap, idx) => (
            <div key={idx} className="vs-item">
              <span className="vs-job">{gap.job_title}</span>
              <div className="vs-bar-container">
                <div className="vs-bar-label">Required</div>
                <div className="vs-bar required" style={{ width: "100%" }}>
                  <span>100%</span>
                </div>
                <div className="vs-bar-label">Your Match</div>
                <div
                  className="vs-bar your"
                  style={{ width: `${gap.match_percentage}%` }}
                >
                  <span>{gap.match_percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Job Listings
  const renderJobsList = () => {
    if (loading.jobs) return <div className="loading-spinner">Loading jobs...</div>;
    if (!jobs.length) return <div>No public jobs available at the moment.</div>;

    return (
      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <span className={`job-status ${job.status}`}>{job.status}</span>
            </div>
            <div className="job-meta">
              <span><Briefcase size={14} /> {job.department}</span>
              <span><Map size={14} /> {job.location?.join(", ")}</span>
              <span><Target size={14} /> Openings: {job.openings}</span>
            </div>
            <div className="job-skills">
              <strong>Tech:</strong> {job.techSkills?.join(", ")}
            </div>
            <div className="job-actions">
              <button
                className="btn-suggestion"
                onClick={() => handleGetSuggestion(job)}
                disabled={loading.suggestion && selectedJob?.id === job.id}
              >
                <Lightbulb size={16} /> Suggestion
              </button>
              <button
                className="btn-interview"
                onClick={() => handleGetInterviewQA(job)}
                disabled={loading.interview && selectedJob?.id === job.id}
              >
                <BookOpen size={16} /> Interview Q&A
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Suggestion Display
  const renderSuggestion = () => {
    if (!selectedJob) return null;
    if (loading.suggestion) return <div className="loading-spinner">Generating suggestion...</div>;
    if (!suggestion) return null;

    return (
      <div className="suggestion-card">
        <h3><Sparkles size={20} /> AI Suggestion for {selectedJob.title}</h3>
        <p>{suggestion}</p>
      </div>
    );
  };

  // Interview Q&A Display
  const renderInterviewQA = () => {
    if (!selectedJob || !interviewQA) return null;
    if (loading.interview) return <div className="loading-spinner">Generating questions...</div>;

    return (
      <div className="interview-qa-card">
        <h3>Interview Questions & Answers for {selectedJob.title}</h3>
        {["low", "medium", "high"].map((level) => (
          <div key={level} className="qa-level">
            <h4>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h4>
            {interviewQA[level]?.map((item, idx) => (
              <div key={idx} className="qa-item">
                <p className="question">Q{idx + 1}: {item.question}</p>
                <p className="answer">A: {item.answer}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Career Path Display (enhanced)
  const renderCareerPath = () => {
    if (loading.career) return <div className="loading-spinner">Generating career path...</div>;
    if (!careerPath) return null;

    return (
      <div className="career-path-card">
        <h2>Your Personalized Career Roadmap</h2>
        <div className="path-section">
          <h3>Short Term (1-2 years)</h3>
          <div className="path-roles"><strong>Roles:</strong> {careerPath.short_term?.roles?.join(" → ")}</div>
          <div className="path-skills"><strong>Skills to develop:</strong> {careerPath.short_term?.skills_to_develop?.join(", ")}</div>
          {careerPath.short_term?.certifications?.length > 0 && (
            <div className="path-certs"><strong>Certifications:</strong> {careerPath.short_term.certifications.join(", ")}</div>
          )}
          <p className="path-advice">{careerPath.short_term?.advice}</p>
        </div>
        <div className="path-section">
          <h3>Long Term (3-5 years)</h3>
          <div className="path-roles"><strong>Roles:</strong> {careerPath.long_term?.roles?.join(" → ")}</div>
          <div className="path-skills"><strong>Skills to develop:</strong> {careerPath.long_term?.skills_to_develop?.join(", ")}</div>
          {careerPath.long_term?.certifications?.length > 0 && (
            <div className="path-certs"><strong>Certifications:</strong> {careerPath.long_term.certifications.join(", ")}</div>
          )}
          <p className="path-advice">{careerPath.long_term?.advice}</p>
        </div>
        <div className="path-overall">
          <h3>Overall Advice</h3>
          <p>{careerPath.overall_advice}</p>
        </div>
      </div>
    );
  };

  // Overview tab (all insights)
  const renderOverview = () => (
    <div className="tab-content overview-tab">
      {/* Profile row */}
      <div className="grid-2col">
        <div className="left-col">{renderProfileCard()}</div>
        <div className="right-col">
          <div className="insights-grid-small">
            {renderSkillGaps()}
            {renderSimilarProjects()}
          </div>
        </div>
      </div>

      {/* Insights row 2 */}
      <div className="grid-2col">
        <div className="left-col">{renderSkillDemand()}</div>
        <div className="right-col">{renderRecentSelections()}</div>
      </div>

      {/* Insights row 3 */}
      <div className="grid-2col">
        <div className="left-col">{renderMatchDistribution()}</div>
        <div className="right-col">{renderSkillVsScore()}</div>
      </div>

      {/* Career Path button and Job listings */}
      <div className="section-header">
        <h3>Public Job Opportunities</h3>
        <button className="btn-career" onClick={handleGetCareerPath}>
          <Map size={16} /> Get Career Path
        </button>
      </div>
      {renderJobsList()}

      {/* AI Suggestions */}
      {renderSuggestion()}
      {renderInterviewQA()}
    </div>
  );

  const renderCareerTab = () => (
    <div className="tab-content career-tab">
      {renderCareerPath()}
      {!careerPath && !loading.career && (
        <div className="placeholder">
          <p>Click "Get Career Path" in the Overview tab to generate your roadmap.</p>
        </div>
      )}
    </div>
  );

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <User size={18} /> },
    { id: "career", label: "Career Path", icon: <Map size={18} /> },
  ];

  return (
    <div className="associate-dashboard">
      <Toaster richColors position="top-right" duration={3000} />

      {/* Sidebar */}
      <div className="assoc-sidebar">
        <div className="assoc-sidebar-header">
          <h2>Associate Portal</h2>
          <p>Welcome, {userData?.username}</p>
        </div>
        <div className="assoc-sidebar-nav">
          {sidebarItems.map((item) => (
            <div
              key={item.id}
              className={`assoc-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
          <div className="assoc-footer">
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="assoc-main-content">
        <div className="assoc-dashboard-header">
          <h1>Associate Dashboard</h1>
        </div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "career" && renderCareerTab()}
      </div>
    </div>
  );
}

export default AssociateDashboard;