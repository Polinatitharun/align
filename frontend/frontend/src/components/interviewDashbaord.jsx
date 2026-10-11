// DashboardInterviewer.js – Polished, modern interviewer dashboard
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import Sidebar from './Sidebar';
import {
  Calendar,
  User,
  Briefcase,
  LogOut,
  Clock,
  MessageSquare,
  Star,
  Code,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  Plus,
  X,
  RefreshCw,
  FileText,
  Award,
  AlertCircle,
  Send,
  ChevronRight,
  MapPin,
  Target
} from 'lucide-react';
import api from '../api/axios';
import './styles/InterviewerDashboard.css';

function DashboardInterviewer({ userData, onLogout }) {
  const [assignedLocks, setAssignedLocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLock, setSelectedLock] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    questions_asked: 0,
    questions_answered: 0,
    attitude_rating: 3,
    behaviour_notes: '',
    technical_skills_assessed: [],
    strengths: '',
    weaknesses: '',
    upskill_needed: '',
    overall_comments: '',
    recommendation: 'selected'
  });
  const [skillInput, setSkillInput] = useState('');

  const fetchAssignedLocks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/interview-locks/my_assigned/');
      setAssignedLocks(response.data);
    } catch (err) {
      toast.error('Failed to load assigned interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedLocks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = () => {
    const skill = skillInput.trim();
    if (skill && !feedbackForm.technical_skills_assessed.includes(skill)) {
      setFeedbackForm(prev => ({
        ...prev,
        technical_skills_assessed: [...prev.technical_skills_assessed, skill]
      }));
      setSkillInput('');
    }
  };

  const handleSkillRemove = (index) => {
    setFeedbackForm(prev => ({
      ...prev,
      technical_skills_assessed: prev.technical_skills_assessed.filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkillAdd();
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedLock) return;
    try {
      setLoading(true);
      await api.post(`/interview-locks/${selectedLock.id}/submit_feedback/`, feedbackForm);
      toast.success('Feedback submitted successfully');
      setShowFeedbackModal(false);
      setSelectedLock(null);
      fetchAssignedLocks();
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = (lock) => {
    setSelectedLock(lock);
    setFeedbackForm({
      questions_asked: 0,
      questions_answered: 0,
      attitude_rating: 3,
      behaviour_notes: '',
      technical_skills_assessed: [],
      strengths: '',
      weaknesses: '',
      upskill_needed: '',
      overall_comments: '',
      recommendation: 'selected'
    });
    setSkillInput('');
    setShowFeedbackModal(true);
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const isUpcoming = (dateStr) => new Date(dateStr) > new Date();

  return (
    <div className="dashboard-page">
      <Toaster richColors position="top-right" />
      <Sidebar
        items={[{ id: 'interviews', label: 'My Interviews', icon: <Calendar size={20} /> }]}
        activeTab="interviews"
        onTabChange={() => {}}
        userData={userData}
        onLogout={onLogout}
      />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1><User size={20} style={{marginRight:'0.5rem'}} />Interviewer Dashboard</h1>
          <div className="header-right">
            <button className="btn btn-ghost btn-sm" onClick={fetchAssignedLocks} disabled={loading}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
        <div className="dashboard-content">

          {/* Stats */}
          <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={22} /></div>
              <div className="stat-content"><h3>Total Assigned</h3><div className="stat-value">{assignedLocks.length}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Clock size={22} /></div>
              <div className="stat-content"><h3>Upcoming</h3><div className="stat-value">{assignedLocks.filter(l => isUpcoming(l.interview_datetime)).length}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={22} /></div>
              <div className="stat-content"><h3>Past</h3><div className="stat-value">{assignedLocks.filter(l => !isUpcoming(l.interview_datetime)).length}</div></div>
            </div>
          </div>

          {/* Interview Cards */}
          {loading ? (
            <div className="empty-state"><div className="spinner" /><p>Loading interviews...</p></div>
          ) : assignedLocks.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} style={{color:'#c9d8e8',marginBottom:'1rem'}} />
              <h3>No interviews assigned</h3>
              <p>You don't have any scheduled interviews at the moment.</p>
            </div>
          ) : (
            <div className="interview-schedule-grid">
              {assignedLocks.map(lock => {
                const upcoming = isUpcoming(lock.interview_datetime);
                const d = new Date(lock.interview_datetime);
                return (
                  <div key={lock.id} className="interview-slot-card">
                    <div className="interview-slot-time">
                      <div className="interview-slot-date">{d.getDate()}</div>
                      <div className="interview-slot-month">{d.toLocaleString('en-IN', {month:'short'})}</div>
                      <div className="interview-slot-hour">{d.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                    <div className="interview-slot-info">
                      <div className="interview-candidate-name">{lock.trainee_name}</div>
                      <div className="interview-job-title">{lock.job_title}</div>
                      <div className="interview-slot-chips">
                        <span className={`interview-chip badge badge-${upcoming ? 'primary' : 'success'}`}>
                          {upcoming ? '🕐 Upcoming' : '✅ Past'}
                        </span>
                        {lock.trainee_location && <span className="interview-chip">{lock.trainee_location}</span>}
                      </div>
                    </div>
                    <div className="interview-slot-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => openFeedbackModal(lock)} disabled={!upcoming}>
                        <FileText size={15} /> {upcoming ? 'Submit Feedback' : 'Completed'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal" style={{maxWidth:'700px',width:'95%'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FileText size={18} style={{marginRight:'0.5rem'}} />Interview Feedback</h3>
              <button className="btn-icon" onClick={() => setShowFeedbackModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'1.5rem',padding:'1rem',background:'#f8fafc',borderRadius:'8px'}}>
                <div><strong style={{fontSize:'0.75rem',color:'#888',textTransform:'uppercase'}}>Trainee</strong><div style={{marginTop:'0.25rem',fontWeight:600}}>{selectedLock?.trainee_name}</div></div>
                <div><strong style={{fontSize:'0.75rem',color:'#888',textTransform:'uppercase'}}>Job</strong><div style={{marginTop:'0.25rem',fontWeight:600}}>{selectedLock?.job_title}</div></div>
                <div><strong style={{fontSize:'0.75rem',color:'#888',textTransform:'uppercase'}}>Date</strong><div style={{marginTop:'0.25rem',fontWeight:600}}>{formatDateTime(selectedLock?.interview_datetime)}</div></div>
              </div>

              <form onSubmit={submitFeedback}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Questions Asked</label>
                    <input type="number" name="questions_asked" value={feedbackForm.questions_asked} onChange={handleInputChange} min="0" className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Questions Answered</label>
                    <input type="number" name="questions_answered" value={feedbackForm.questions_answered} onChange={handleInputChange} min="0" className="form-input" required />
                  </div>
                </div>

                <div className="form-group" style={{marginBottom:'1rem'}}>
                  <label className="form-label">Attitude Rating</label>
                  <div className="star-rating-input">
                    {[1,2,3,4,5].map(r => (
                      <button key={r} type="button" className={`star-btn ${feedbackForm.attitude_rating >= r ? 'selected' : ''}`} onClick={() => setFeedbackForm(prev => ({...prev, attitude_rating: r}))}>
                        <Star size={22} fill={feedbackForm.attitude_rating >= r ? '#ffc107' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{marginBottom:'1rem'}}>
                  <label className="form-label">Behaviour Notes</label>
                  <textarea name="behaviour_notes" value={feedbackForm.behaviour_notes} onChange={handleInputChange} rows="2" className="form-input" style={{resize:'vertical'}} placeholder="Observations about attitude, communication..." />
                </div>

                <div className="form-group" style={{marginBottom:'1rem'}}>
                  <label className="form-label">Skills Assessed</label>
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.5rem'}}>
                    <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleKeyDown} className="form-input" placeholder="Type skill and press Enter" style={{flex:1}} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleSkillAdd}><Plus size={16} /> Add</button>
                  </div>
                  <div className="skill-checkboxes">
                    {feedbackForm.technical_skills_assessed.map((skill, i) => (
                      <label key={i} className="skill-checkbox-label checked">{skill}<button type="button" onClick={() => handleSkillRemove(i)}><X size={12} /></button></label>
                    ))}
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Strengths</label>
                    <textarea name="strengths" value={feedbackForm.strengths} onChange={handleInputChange} rows="2" className="form-input" style={{resize:'vertical'}} placeholder="What did the candidate excel at?" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Areas for Improvement</label>
                    <textarea name="weaknesses" value={feedbackForm.weaknesses} onChange={handleInputChange} rows="2" className="form-input" style={{resize:'vertical'}} placeholder="What skills need development?" />
                  </div>
                </div>

                <div className="form-group" style={{marginBottom:'1rem'}}>
                  <label className="form-label">Overall Comments</label>
                  <textarea name="overall_comments" value={feedbackForm.overall_comments} onChange={handleInputChange} rows="3" className="form-input" style={{resize:'vertical'}} placeholder="Summary of the interview" />
                </div>

                <div className="form-group" style={{marginBottom:'1.5rem'}}>
                  <label className="form-label">Recommendation</label>
                  <div className="recommendation-buttons">
                    <button type="button" className={`rec-btn rec-btn-select ${feedbackForm.recommendation === 'selected' ? 'selected' : ''}`} onClick={() => setFeedbackForm(prev => ({...prev, recommendation: 'selected'}))}>
                      <ThumbsUp size={18} /> Select Candidate
                    </button>
                    <button type="button" className={`rec-btn rec-btn-reject ${feedbackForm.recommendation === 'rejected' ? 'selected' : ''}`} onClick={() => setFeedbackForm(prev => ({...prev, recommendation: 'rejected'}))}>
                      <ThumbsDown size={18} /> Reject Candidate
                    </button>
                  </div>
                </div>

                <div className="modal-footer" style={{padding:0,border:'none'}}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowFeedbackModal(false)}><X size={16} /> Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <><RefreshCw size={16} className="spinning" /> Submitting...</> : <><Send size={16} /> Submit Feedback</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DashboardInterviewer;