// AssociateDashbaord.jsx – Comprehensive Trainee Associate Dashboard
import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "./styles/AssociateDashboard.css";
import { Toaster, toast } from "sonner";
import {
  User,
  Briefcase,
  GraduationCap,
  Target,
  Lightbulb,
  MapPin,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  PieChart,
  Calendar,
  AlertCircle,
  Layers,
  FileText,
  Send,
  Loader2,
  Check,
  X,
  MessageSquare,
  Building,
  Star,
  FileCheck
} from "lucide-react";
import Sidebar from './Sidebar';

export default function AssociateDashboard({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Profile and dashboard data
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [consents, setConsents] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // AI tools state
  const [suggestion, setSuggestion] = useState("");
  const [interviewQA, setInterviewQA] = useState(null);
  const [careerPath, setCareerPath] = useState(null);
  const [traineeMatches, setTraineeMatches] = useState(null);

  // Consent response modal state
  const [respondingConsent, setRespondingConsent] = useState(null);
  const [consentRemarks, setConsentRemarks] = useState("");
  const [submittingConsent, setSubmittingConsent] = useState(false);

  // Self-assessment form state
  const [selectedInterviewForForm, setSelectedInterviewForForm] = useState(null);
  const [selfAssessment, setSelfAssessment] = useState({
    questions_asked: 0,
    technical_percentage: 50,
    theoretical_percentage: 50,
    question_list: [""],
  });

  // Loading states
  const [loading, setLoading] = useState({
    profile: true,
    dashboard: true,
    consents: true,
    interviews: true,
    jobs: true,
    matches: false,
    suggestion: false,
    interview: false,
    career: false,
    assessment: false
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    fetchDashboardDetails();
    fetchConsents();
    fetchRelevantJobs();
  };

  const fetchDashboardDetails = async () => {
    setLoading(prev => ({ ...prev, profile: true, dashboard: true }));
    try {
      const res = await api.get('/associate/dashboard/');
      setDashboardData(res.data);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      if (res.data.consent_requests) {
        setConsents(res.data.consent_requests);
      }
      if (res.data.interviews) {
        setMyInterviews(res.data.interviews);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load associate dashboard data.');
    } finally {
      setLoading(prev => ({ ...prev, profile: false, dashboard: false }));
    }
  };

  const fetchConsents = async () => {
    setLoading(prev => ({ ...prev, consents: true }));
    try {
      const res = await api.get('/consent/trainee/');
      setConsents(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, consents: false }));
    }
  };

  const fetchRelevantJobs = async () => {
    setLoading(prev => ({ ...prev, jobs: true }));
    try {
      const res = await api.get('/jobs/');
      const active = (res.data || []).filter(j => j.status === 'active');
      setJobs(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  };

  const handleOpenConsentModal = (consent, initialStatus) => {
    setRespondingConsent({
      ...consent,
      actionStatus: initialStatus
    });
    setConsentRemarks("");
  };

  const handleRespondConsent = async () => {
    if (!respondingConsent) return;
    if (!consentRemarks.trim()) {
      toast.error('Remarks are mandatory when responding to a consent request.');
      return;
    }

    setSubmittingConsent(true);
    try {
      const payload = {
        consent_id: respondingConsent.id,
        status: respondingConsent.actionStatus,
        remarks: consentRemarks.trim()
      };
      const res = await api.post('/consent/respond/', payload);
      toast.success(res.data.message || `Consent recorded as ${respondingConsent.actionStatus}`);
      setRespondingConsent(null);
      fetchDashboardDetails();
      fetchConsents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit consent response.');
    } finally {
      setSubmittingConsent(false);
    }
  };

  const handleGetSuggestion = async (job) => {
    setSelectedJob(job);
    setSuggestion("");
    setLoading(prev => ({ ...prev, suggestion: true }));
    try {
      const res = await api.post("/associate/suggest/", { job_id: job.id });
      setSuggestion(res.data.suggestion);
    } catch (err) {
      toast.error("Failed to generate AI suggestion");
    } finally {
      setLoading(prev => ({ ...prev, suggestion: false }));
    }
  };

  const handleGetInterviewQA = async (job) => {
    setSelectedJob(job);
    setInterviewQA(null);
    setLoading(prev => ({ ...prev, interview: true }));
    try {
      const res = await api.post("/associate/interview-questions/", {
        job_id: job.id,
        levels: ["low", "medium", "high"],
      });
      setInterviewQA(res.data);
    } catch (err) {
      toast.error("Failed to generate interview questions");
    } finally {
      setLoading(prev => ({ ...prev, interview: false }));
    }
  };

  const handleGetCareerPath = async () => {
    setLoading(prev => ({ ...prev, career: true }));
    try {
      const res = await api.get("/associate/career-path/");
      setCareerPath(res.data);
      setActiveTab("career");
    } catch (err) {
      toast.error("Failed to generate career path");
    } finally {
      setLoading(prev => ({ ...prev, career: false }));
    }
  };

  const userInfo = profile?.userInfo || userData || {};
  const dpiVal = dashboardData?.dpi ?? profile?.dpi ?? 0;
  const dpiPercentage = dashboardData?.dpi_percentage ?? Math.round((dpiVal / 5) * 100);

  // Preferred locations summary
  const prefLocs = [
    userInfo.preferred_location_1,
    userInfo.preferred_location_2,
    userInfo.preferred_location_3
  ].filter(Boolean);

  const pendingConsents = consents.filter(c => c.status === 'PENDING');

  const associateSidebarItems = [
    { id: 'overview', label: 'Overview & Profile', icon: <User size={18} /> },
    { id: 'consents', label: `Consent Requests${pendingConsents.length > 0 ? ` (${pendingConsents.length})` : ''}`, icon: <FileCheck size={18} /> },
    { id: 'jobs', label: 'My Assignments', icon: <Briefcase size={18} /> },
    { id: 'career', label: 'Skills & Growth', icon: <GraduationCap size={18} /> },
  ];

  return (
    <div className="associate-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <Sidebar
        items={associateSidebarItems}
        userRole="trainee"
        userData={userData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              Welcome back, {userInfo.name || 'Associate'}!
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' }}>
              Talent Align Career & Project Allocation Portal
            </p>
          </div>

          {/* Quick Tabs Navigation */}
          <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={tabBtnStyle(activeTab === 'overview')}
            >
              Overview & Profile
            </button>
            <button
              onClick={() => setActiveTab('consents')}
              style={tabBtnStyle(activeTab === 'consents')}
            >
              Consent Requests {pendingConsents.length > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  marginLeft: '6px'
                }}>
                  {pendingConsents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              style={tabBtnStyle(activeTab === 'jobs')}
            >
              Available Projects
            </button>
            <button
              onClick={() => setActiveTab('career')}
              style={tabBtnStyle(activeTab === 'career')}
            >
              AI Career Path
            </button>
          </div>
        </div>

        {/* Mapped Project Assignment Alert Banner (if mapped) */}
        {dashboardData?.assignment?.isMapped && (
          <div style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(4, 120, 87, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex'
              }}>
                <CheckCircle2 size={24} color="#a7f3d0" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Project Allocation Confirmed!
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#d1fae5' }}>
                  You are mapped to: <strong>{dashboardData.assignment.projectName}</strong> (Project ID: #{dashboardData.assignment.projectId})
                </p>
              </div>
            </div>
            <span style={{
              background: '#ffffff',
              color: '#065f46',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.8rem'
            }}>
              Active Assignment
            </span>
          </div>
        )}

        {/* TAB 1: OVERVIEW & PROFILE */}
        {activeTab === 'overview' && (
          <div>
            {/* Top Grid: Profile Card + Preferred Locations Card + DPI Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Profile Card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700
                  }}>
                    {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                      {userInfo.name || 'Unknown Associate'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      {userInfo.email || `${userInfo.employeeId || userInfo.userId}@tcs.com`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Employee ID:</span>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{userInfo.employeeId || userInfo.userId || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Batch:</span>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{profile?.batch_name || 'Current Batch'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Current Location:</span>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{userInfo.location || 'Not set'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Average Score:</span>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>{userInfo.averageScore || '0'}%</div>
                  </div>
                </div>
              </div>

              {/* DPI Score Card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    DPI Readiness Rating
                  </span>
                  <Award size={20} color="#f59e0b" />
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a' }}>
                    {dpiVal} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>/ 5.0</span>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: dpiVal >= 4 ? '#dcfce7' : dpiVal >= 2.5 ? '#fef3c7' : '#fee2e2',
                    color: dpiVal >= 4 ? '#15803d' : dpiVal >= 2.5 ? '#b45309' : '#b91c1c'
                  }}>
                    {dpiPercentage}% Ready
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{
                    height: '100%',
                    width: `${dpiPercentage}%`,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                    borderRadius: '999px'
                  }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  DPI score evaluates technical proficiency, assessment outcomes, and interview readiness.
                </p>
              </div>

              {/* Preferred Locations Card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    Preferred Locations
                  </span>
                  <MapPin size={20} color="#3b82f6" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {prefLocs.length > 0 ? (
                    prefLocs.map((loc, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        color: '#334155'
                      }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {i + 1}
                        </span>
                        <strong>{loc}</strong>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No preferred locations registered.</span>
                  )}
                </div>

                {/* State & City */}
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>State: <strong>{userInfo.preferred_state || 'N/A'}</strong></span>
                  <span>City: <strong>{userInfo.preferred_city || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            {/* Skills & AI Advice Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Strengths & Weaknesses */}
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Skill Competencies
                </h3>

                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', display: 'block', marginBottom: '6px' }}>
                    Strengths:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile?.strengths?.length > 0 ? (
                      profile.strengths.map((s, i) => (
                        <span key={i} style={skillChipStyle('#dcfce7', '#15803d')}>
                          {s.courseName || s} {s.avgScore ? `(${s.avgScore}%)` : ''}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None recorded</span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#b91c1c', display: 'block', marginBottom: '6px' }}>
                    Areas to Upskill:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile?.weaknesses?.length > 0 ? (
                      profile.weaknesses.map((w, i) => (
                        <span key={i} style={skillChipStyle('#fee2e2', '#b91c1c')}>
                          {w.courseName || w} {w.avgScore ? `(${w.avgScore}%)` : ''}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Career Advice */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={18} color="#6366f1" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    AI Career Growth Advice
                  </h3>
                </div>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '0.86rem',
                  lineHeight: '1.5',
                  color: '#334155'
                }}>
                  {dashboardData?.advice || "Keep practicing your core technologies and review feedback from assessments to increase project allocation readiness."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONSENT REQUESTS */}
        {activeTab === 'consents' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                  Project Consent Inquiries ({consents.length})
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Please review and submit your decision with required remarks
                </p>
              </div>
            </div>

            {loading.consents ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                Loading consent requests...
              </div>
            ) : consents.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <Send size={36} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h3 style={{ margin: 0, color: '#334155' }}>No Active Consent Requests</h3>
                <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                  When HR selects you for a matching project requirement, your consent requests will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {consents.map((c) => (
                  <div key={c.id} style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                          {c.project_name}
                        </h3>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: c.status === 'ACCEPTED' ? '#dcfce7' : c.status === 'DECLINED' ? '#fee2e2' : '#fef3c7',
                          color: c.status === 'ACCEPTED' ? '#15803d' : c.status === 'DECLINED' ? '#b91c1c' : '#b45309'
                        }}>
                          {c.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>
                        <div><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /><strong>Location:</strong> {c.location}</div>
                        <div><Briefcase size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /><strong>Role:</strong> {c.role || 'Developer'}</div>
                        <div><Layers size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /><strong>Skills:</strong> {c.skills || c.stream}</div>
                      </div>

                      {c.remarks && (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          color: '#334155',
                          fontStyle: 'italic',
                          marginTop: '6px'
                        }}>
                          Your Remark: "{c.remarks}"
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {c.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleOpenConsentModal(c, 'ACCEPTED')}
                          style={{
                            padding: '9px 18px',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                          }}
                        >
                          <Check size={16} />
                          <span>Accept Project</span>
                        </button>

                        <button
                          onClick={() => handleOpenConsentModal(c, 'DECLINED')}
                          style={{
                            padding: '9px 18px',
                            background: '#ffffff',
                            border: '1px solid #ef4444',
                            color: '#dc2626',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <X size={16} />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>
                        <div>Responded on:</div>
                        <strong>{c.responded_at ? new Date(c.responded_at).toLocaleDateString() : 'Completed'}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVAILABLE PROJECTS */}
        {activeTab === 'jobs' && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Active Project Requirements
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {jobs.map((job) => (
                <div key={job.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {job.project_name}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: '#eff6ff',
                      color: '#1d4ed8'
                    }}>
                      {job.openings} Openings
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#64748b' }}>
                    Location: <strong>{job.location}</strong> • Stream: <strong>{job.stream || 'Technology'}</strong>
                  </p>

                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Required Skills:
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                      {job.skills}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button
                      onClick={() => handleGetSuggestion(job)}
                      disabled={loading.suggestion && selectedJob?.id === job.id}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Lightbulb size={14} />
                      <span>{loading.suggestion && selectedJob?.id === job.id ? 'Analyzing...' : 'AI Advice'}</span>
                    </button>

                    <button
                      onClick={() => handleGetInterviewQA(job)}
                      disabled={loading.interview && selectedJob?.id === job.id}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Interview Prep</span>
                    </button>
                  </div>

                  {/* AI Suggestion Output inline */}
                  {suggestion && selectedJob?.id === job.id && (
                    <div style={{
                      marginTop: '12px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '0.82rem',
                      color: '#166534'
                    }}>
                      <strong>AI Suggestion:</strong> {suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI CAREER PATH */}
        {activeTab === 'career' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                  AI Career Pathway Generator
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Personalized milestones and upskilling trajectory based on your skills
                </p>
              </div>

              <button
                onClick={handleGetCareerPath}
                disabled={loading.career}
                style={{
                  padding: '9px 18px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading.career ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>Generate New Career Path</span>
              </button>
            </div>

            {careerPath ? (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#1e293b'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {typeof careerPath === 'string' ? careerPath : JSON.stringify(careerPath, null, 2)}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Sparkles size={36} color="#cbd5e1" style={{ margin: '0 auto 10px', display: 'block' }} />
                Click "Generate New Career Path" to build your custom milestone roadmap with AI.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONSENT RESPONSE MODAL WITH MANDATORY REMARKS */}
      {respondingConsent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              background: respondingConsent.actionStatus === 'ACCEPTED'
                ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {respondingConsent.actionStatus === 'ACCEPTED' ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>
                  {respondingConsent.actionStatus === 'ACCEPTED' ? 'Accept Project Consent' : 'Decline Project Consent'}
                </h3>
              </div>
              <button
                onClick={() => setRespondingConsent(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '18px'
              }}>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{respondingConsent.project_name}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Location: {respondingConsent.location} • Stream: {respondingConsent.stream || respondingConsent.skills}
                </p>
              </div>

              {/* Mandatory Remark input */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1e293b', marginBottom: '6px', fontSize: '0.88rem' }}>
                  Mandatory Remarks / Feedback *
                </label>
                <textarea
                  rows={4}
                  value={consentRemarks}
                  onChange={e => setConsentRemarks(e.target.value)}
                  placeholder={
                    respondingConsent.actionStatus === 'ACCEPTED'
                      ? "e.g., I am excited to join this project in Hyderabad and have experience with Java & React."
                      : "e.g., Unable to relocate due to personal constraints or looking for different technology stream."
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#1e40af'
              }}>
                {respondingConsent.actionStatus === 'ACCEPTED' ? (
                  <span>
                    <strong>Note:</strong> On accepting, you will be locked to this project requirement and your status will update in the Talent Management System.
                  </span>
                ) : (
                  <span>
                    <strong>Note:</strong> On declining, your profile will remain in the available talent pool for other project requirements.
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setRespondingConsent(null)}
                disabled={submittingConsent}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRespondConsent}
                disabled={submittingConsent || !consentRemarks.trim()}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: respondingConsent.actionStatus === 'ACCEPTED' ? '#059669' : '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: submittingConsent || !consentRemarks.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submittingConsent ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirm {respondingConsent.actionStatus === 'ACCEPTED' ? 'Acceptance' : 'Decline'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tabBtnStyle = (active) => ({
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: active ? '#2563eb' : 'transparent',
  color: active ? '#ffffff' : '#64748b',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
});

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
};

const skillChipStyle = (bg, color) => ({
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: bg,
  color: color
});