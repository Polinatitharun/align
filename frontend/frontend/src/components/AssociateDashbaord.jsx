// AssociateDashboard.js – Self‑assessment form, prior batch jobs, polished UI
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
  Sparkles,
  TrendingUp,
  Users,
  PieChart,
  Calendar,
  AlertCircle,
  Layers,
  Plus,
  Trash2,
  Save,
  FileText,
  Percent,
} from "lucide-react";

import Sidebar from './Sidebar';

function AssociateDashboard({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Profile data
  const [profile, setProfile] = useState(null);

  // Jobs data (public + prior batches)
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // AI generated data
  const [suggestion, setSuggestion] = useState("");
  const [interviewQA, setInterviewQA] = useState(null);
  const [careerPath, setCareerPath] = useState(null);

  // Dashboard insights
  const [skillGaps, setSkillGaps] = useState([]);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [dashboardAdvice, setDashboardAdvice] = useState("");

  // Trainee matches
  const [traineeMatches, setTraineeMatches] = useState(null);

  // Interview locks for the associate
  const [myInterviews, setMyInterviews] = useState([]);
  const [selectedInterviewForForm, setSelectedInterviewForForm] = useState(null);

  // Self-assessment form state
  const [selfAssessment, setSelfAssessment] = useState({
    questions_asked: 0,
    technical_percentage: 50,
    theoretical_percentage: 50,
    question_list: [""],
  });

  // Loading states
  const [loading, setLoading] = useState({
    profile: true,
    jobs: true,
    suggestion: false,
    interview: false,
    career: false,
    dashboard: true,
    matches: true,
    interviews: true,
    assessment: false,
  });

  useEffect(() => {
    fetchProfile();
    fetchRelevantJobs();
    fetchDashboardData();
    fetchMyInterviews();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchTraineeMatches();
    }
  }, [profile]);

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

  const fetchRelevantJobs = async () => {
    setLoading((prev) => ({ ...prev, jobs: true }));
    try {
      // Get all active jobs
      const response = await api.get("/jobs/");
      const allJobs = response.data.filter(job => job.status === 'active');
      
      // If profile loaded, filter: public OR batch different from trainee's batch
      if (profile?.batch_name) {
        const relevant = allJobs.filter(job => 
          job.is_public || job.batch_name !== profile.batch_name
        );
        setJobs(relevant);
      } else {
        setJobs(allJobs.filter(job => job.is_public));
      }
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
    if (!profile?.id) return;
    setLoading((prev) => ({ ...prev, matches: true }));
    try {
      const response = await api.get(`/trainee-matches/${profile.id}/`);
      setTraineeMatches(response.data);
    } catch (err) {
      console.log("Trainee matches not available");
    } finally {
      setLoading((prev) => ({ ...prev, matches: false }));
    }
  };

  const fetchMyInterviews = async () => {
    setLoading((prev) => ({ ...prev, interviews: true }));
    try {
      if (!profile?.id) return;
      const response = await api.get(`/interview-locks/?trainee=${profile.id}`);
      setMyInterviews(response.data);
    } catch (err) {
      console.log("Could not fetch interviews");
    } finally {
      setLoading((prev) => ({ ...prev, interviews: false }));
    }
  };

  useEffect(() => {
    if (profile?.id) fetchMyInterviews();
    if (profile) fetchRelevantJobs();
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

  const openSelfAssessment = (interview) => {
    setSelectedInterviewForForm(interview);
    // Initialize form
    setSelfAssessment({
      questions_asked: 0,
      technical_percentage: 50,
      theoretical_percentage: 50,
      question_list: [""],
    });
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...selfAssessment.question_list];
    updated[index] = value;
    setSelfAssessment(prev => ({ ...prev, question_list: updated }));
  };

  const addQuestionField = () => {
    setSelfAssessment(prev => ({
      ...prev,
      question_list: [...prev.question_list, ""]
    }));
  };

  const removeQuestionField = (index) => {
    setSelfAssessment(prev => ({
      ...prev,
      question_list: prev.question_list.filter((_, i) => i !== index)
    }));
  };

  const handlePercentageChange = (field, value) => {
    const num = Math.min(100, Math.max(0, Number(value) || 0));
    const otherField = field === 'technical_percentage' ? 'theoretical_percentage' : 'technical_percentage';
    setSelfAssessment(prev => ({
      ...prev,
      [field]: num,
      [otherField]: 100 - num,
    }));
  };

  const submitSelfAssessment = async () => {
    if (!selectedInterviewForForm) return;
    setLoading(prev => ({ ...prev, assessment: true }));
    try {
      await api.post("/associate/self-assessment/", {
        interview_lock_id: selectedInterviewForForm.id,
        ...selfAssessment,
        question_list: selfAssessment.question_list.filter(q => q.trim() !== ""),
      });
      toast.success("Self-assessment submitted");
      setSelectedInterviewForForm(null);
      fetchMyInterviews(); // refresh
    } catch (err) {
      toast.error("Failed to submit assessment");
    } finally {
      setLoading(prev => ({ ...prev, assessment: false }));
    }
  };

  // Helper to render skill chips
  const renderSkillChips = (items, type) => {
    const colorClass = type === "strength" ? "strength" : "weakness";
    return items.map((item, idx) => (
      <span key={idx} className={`skill-chip ${colorClass}`}>
        {item.courseName} {item.avgScore ? `(${item.avgScore}%)` : ""}
      </span>
    ));
  };

  // Profile Card
  const renderProfileCard = () => {
    if (loading.profile) return <div className="insight-card placeholder">Loading profile...</div>;
    if (!profile) return <div className="insight-card placeholder">No profile data</div>;

    const userInfo = profile.userInfo || {};
    return (
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{userInfo.name?.charAt(0) || "U"}</div>
          <div className="profile-title">
            <h2>{userInfo.name || "Unknown"}</h2>
            <p><User size={14} /> {userInfo.userId} • {userInfo.location || "Location not set"}</p>
            <p className="batch-info"><Layers size={14} /> Batch: {profile.batch_name || "N/A"}</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-item"><GraduationCap size={18} /><span>Avg Score: {userInfo.averageScore || "N/A"}%</span></div>
          <div className="detail-item"><Award size={18} /><span>Rank: {profile.batchRank || "N/A"}</span></div>
          <div className="detail-item"><Clock size={18} /><span>Joined: {profile.created_at?.split("T")[0]}</span></div>
        </div>
        <div className="profile-skills">
          <div className="skill-section">
            <h4>Strengths</h4>
            <div className="skill-list">{profile.strengths?.length > 0 ? renderSkillChips(profile.strengths, "strength") : "No strengths recorded"}</div>
          </div>
          <div className="skill-section">
            <h4>Areas to Improve</h4>
            <div className="skill-list">{profile.weaknesses?.length > 0 ? renderSkillChips(profile.weaknesses, "weakness") : "No weaknesses recorded"}</div>
          </div>
        </div>
      </div>
    );
  };

  // Match Distribution
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
            {perfect > 0 && <div className="bar-segment perfect" style={{ width: `${(perfect / total) * 100}%` }}>{perfect}</div>}
            {skills > 0 && <div className="bar-segment skills" style={{ width: `${(skills / total) * 100}%` }}>{skills}</div>}
            {location > 0 && <div className="bar-segment location" style={{ width: `${(location / total) * 100}%` }}>{location}</div>}
            {nearby > 0 && <div className="bar-segment nearby" style={{ width: `${(nearby / total) * 100}%` }}>{nearby}</div>}
            {noMatch > 0 && <div className="bar-segment nomatch" style={{ width: `${(noMatch / total) * 100}%` }}>{noMatch}</div>}
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

  // Self Assessment Section (replaces feedback viewer)
  const renderSelfAssessmentSection = () => {
    if (loading.interviews) return <div className="loading-spinner">Loading interviews...</div>;
    if (myInterviews.length === 0) return null;

    const completedInterviews = myInterviews.filter(i => i.status === 'selected' || i.status === 'rejected');
    if (completedInterviews.length === 0) return null;

    return (
      <div className="insight-card">
        <h3><FileText size={20} /> Self‑Assessment Required</h3>
        <p className="insight-advice">Please fill out a brief self‑assessment for your completed interviews.</p>
        <div className="interview-list">
          {completedInterviews.map(interview => (
            <div key={interview.id} className={`interview-item ${interview.status}`}>
              <div className="interview-header">
                <span className="job-title">{interview.job_title}</span>
                <span className={`status-badge status-${interview.status}`}>{interview.status}</span>
              </div>
              <div className="interview-meta">
                <Calendar size={14} /> {new Date(interview.interview_datetime).toLocaleString()}
              </div>
              <button className="btn-primary-small" onClick={() => openSelfAssessment(interview)}>
                <FileText size={14} /> Fill Self‑Assessment
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Self-Assessment Modal
  const renderSelfAssessmentModal = () => {
    if (!selectedInterviewForForm) return null;
    return (
      <div className="modal-overlay" onClick={() => setSelectedInterviewForForm(null)}>
        <div className="modal-content assessment-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><FileText size={20} /> Self‑Assessment: {selectedInterviewForForm.job_title}</h3>
            <button className="modal-close" onClick={() => setSelectedInterviewForForm(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Total Questions Asked</label>
              <input
                type="number"
                min="0"
                value={selfAssessment.questions_asked}
                onChange={(e) => setSelfAssessment(prev => ({ ...prev, questions_asked: parseInt(e.target.value) || 0 }))}
                className="form-control"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Technical %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selfAssessment.technical_percentage}
                  onChange={(e) => handlePercentageChange('technical_percentage', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Theoretical %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selfAssessment.theoretical_percentage}
                  onChange={(e) => handlePercentageChange('theoretical_percentage', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="percentage-bar">
              <div className="tech-bar" style={{ width: `${selfAssessment.technical_percentage}%` }}>
                Tech {selfAssessment.technical_percentage}%
              </div>
              <div className="theory-bar" style={{ width: `${selfAssessment.theoretical_percentage}%` }}>
                Theory {selfAssessment.theoretical_percentage}%
              </div>
            </div>
            <div className="form-group">
              <label>Questions Asked (list as many as you remember)</label>
              {selfAssessment.question_list.map((q, idx) => (
                <div key={idx} className="question-input-group">
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => handleQuestionChange(idx, e.target.value)}
                    placeholder={`Question ${idx + 1}`}
                    className="form-control"
                  />
                  {selfAssessment.question_list.length > 1 && (
                    <button type="button" className="btn-icon" onClick={() => removeQuestionField(idx)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-secondary" onClick={addQuestionField}>
                <Plus size={14} /> Add Question
              </button>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setSelectedInterviewForForm(null)}>Cancel</button>
            <button className="btn-primary" onClick={submitSelfAssessment} disabled={loading.assessment}>
              <Save size={14} /> {loading.assessment ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Jobs List
  const renderJobsList = () => {
    if (loading.jobs) return <div className="insight-card placeholder">Loading jobs...</div>;
    if (!jobs.length) return <div className="insight-card placeholder">No relevant jobs available at the moment.</div>;

    return (
      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.project_name}</h3>
              <span className={`job-status ${job.status}`}>{job.status}</span>
            </div>
            <div className="job-meta">
              <span><Briefcase size={14} /> {job.department}</span>
              <span><Map size={14} /> {job.location?.join(", ")}</span>
              <span><Target size={14} /> Openings: {job.openings}</span>
              {job.batch_name && <span><Layers size={14} /> {job.batch_name}</span>}
            </div>
            <div className="job-skills">
              <strong>Tech:</strong> {job.techSkills?.join(", ")}
            </div>
            <div className="job-actions">
              <button className="btn-suggestion" onClick={() => handleGetSuggestion(job)} disabled={loading.suggestion && selectedJob?.id === job.id}>
                <Lightbulb size={16} /> Suggestion
              </button>
              <button className="btn-interview" onClick={() => handleGetInterviewQA(job)} disabled={loading.interview && selectedJob?.id === job.id}>
                <BookOpen size={16} /> Interview Q&A
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // AI Suggestion Display
  const renderSuggestion = () => {
    if (!selectedJob || !suggestion) return null;
    return (
      <div className="suggestion-card">
        <h3><Sparkles size={20} /> AI Suggestion for {selectedJob.project_name}</h3>
        <p>{suggestion}</p>
      </div>
    );
  };

  // Interview Q&A Display
  const renderInterviewQA = () => {
    if (!selectedJob || !interviewQA) return null;
    return (
      <div className="interview-qa-card">
        <h3>Interview Questions & Answers for {selectedJob.project_name}</h3>
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

  // Career Path Display
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
          {careerPath.short_term?.certifications?.length > 0 && <div className="path-certs"><strong>Certifications:</strong> {careerPath.short_term.certifications.join(", ")}</div>}
          <p className="path-advice">{careerPath.short_term?.advice}</p>
        </div>
        <div className="path-section">
          <h3>Long Term (3-5 years)</h3>
          <div className="path-roles"><strong>Roles:</strong> {careerPath.long_term?.roles?.join(" → ")}</div>
          <div className="path-skills"><strong>Skills to develop:</strong> {careerPath.long_term?.skills_to_develop?.join(", ")}</div>
          {careerPath.long_term?.certifications?.length > 0 && <div className="path-certs"><strong>Certifications:</strong> {careerPath.long_term.certifications.join(", ")}</div>}
          <p className="path-advice">{careerPath.long_term?.advice}</p>
        </div>
        <div className="path-overall">
          <h3>Overall Advice</h3>
          <p>{careerPath.overall_advice}</p>
        </div>
      </div>
    );
  };

  // Overview Tab
  const renderOverview = () => (
    <div className="tab-content overview-tab">
      <div className="grid-2col">
        <div className="left-col">{renderProfileCard()}</div>
        <div className="right-col">
          {renderMatchDistribution()}
        </div>
      </div>
      <div className="grid-2col">
        <div className="left-col">{renderSelfAssessmentSection()}</div>
        <div className="right-col">
          <div className="insight-card">
            <h3><Target size={20} /> Skill Gap Analysis</h3>
            <p className="insight-advice">{dashboardAdvice}</p>
            {skillGaps.map((gap, idx) => (
              <div key={idx} className="gap-item">
                <div className="gap-header">
                  <span className="job-title">{gap.job_title}</span>
                  <span className={`match-percent ${gap.has_all_skills ? "full" : "partial"}`}>{gap.match_percentage}% Match</span>
                </div>
                {!gap.has_all_skills && <div className="missing-skills"><strong>Missing:</strong> {gap.missing_skills.join(", ")}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="section-header">
        <h3>Available Job Opportunities</h3>
        <button className="btn-career" onClick={handleGetCareerPath}><Map size={16} /> Get Career Path</button>
      </div>
      {renderJobsList()}
      {renderSuggestion()}
      {renderInterviewQA()}
      {renderSelfAssessmentModal()}
    </div>
  );

  const renderCareerTab = () => (
    <div className="tab-content career-tab">
      {renderCareerPath()}
      {!careerPath && !loading.career && <div className="placeholder"><p>Click "Get Career Path" to generate your roadmap.</p></div>}
    </div>
  );

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <User size={18} /> },
    { id: "career", label: "Career Path", icon: <Map size={18} /> },
  ];

  return (
    <div className="dashboard-page">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Associate Dashboard</h1>
          <div className="header-right">
            <button className="btn btn-ghost btn-sm" onClick={handleGetCareerPath}>
              Get Career Path
            </button>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="tab-panel">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "career" && renderCareerTab()}
          </div>
        </div>
      </div>
      {renderSelfAssessmentModal()}
    </div>
  );
}

export default AssociateDashboard;