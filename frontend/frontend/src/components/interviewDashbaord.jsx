// DashboardInterviewer.js – Polished, modern interviewer dashboard
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
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
    <div className="interviewer-dashboard">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>
            <User size={28} />
            Interviewer Dashboard
          </h1>
          <div className="header-subtitle">
            Welcome back, {userData?.name || 'Interviewer'}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchAssignedLocks} disabled={loading}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn-outline" onClick={onLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid small">
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={20} /></div>
          <div className="stat-content">
            <h3>Total Assigned</h3>
            <div className="stat-value">{assignedLocks.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-content">
            <h3>Upcoming</h3>
            <div className="stat-value">{assignedLocks.filter(l => isUpcoming(l.interview_datetime)).length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle size={20} /></div>
          <div className="stat-content">
            <h3>Past</h3>
            <div className="stat-value">{assignedLocks.filter(l => !isUpcoming(l.interview_datetime)).length}</div>
          </div>
        </div>
      </div>

      {/* Interviews Section */}
      <div className="section-header">
        <h2><Calendar size={22} /> My Assigned Interviews</h2>
        <p className="subtitle">Conduct interviews and submit feedback</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading interviews...</p>
        </div>
      ) : assignedLocks.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No interviews assigned</h3>
          <p>You don't have any scheduled interviews at the moment.</p>
        </div>
      ) : (
        <div className="interview-grid">
          {assignedLocks.map(lock => {
            const upcoming = isUpcoming(lock.interview_datetime);
            return (
              <div key={lock.id} className={`interview-card ${!upcoming ? 'past' : ''}`}>
                <div className="card-badge">
                  {upcoming ? (
                    <span className="badge upcoming"><Clock size={12} /> Upcoming</span>
                  ) : (
                    <span className="badge past"><CheckCircle size={12} /> Past</span>
                  )}
                </div>
                <div className="card-header">
                  <div className="trainee-avatar">{lock.trainee_name?.charAt(0) || '?'}</div>
                  <div className="trainee-info">
                    <h3>{lock.trainee_name}</h3>
                    <p className="job-title">
                      <Briefcase size={14} /> {lock.job_title}
                    </p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <Calendar size={16} />
                    <span>{formatDateTime(lock.interview_datetime)}</span>
                  </div>
                  {lock.trainee_location && (
                    <div className="info-row">
                      <MapPin size={16} />
                      <span>{lock.trainee_location}</span>
                    </div>
                  )}
                  {lock.comments && (
                    <div className="info-row comments">
                      <MessageSquare size={16} />
                      <span>{lock.comments}</span>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <button
                    className="btn-primary"
                    onClick={() => openFeedbackModal(lock)}
                    disabled={!upcoming}
                  >
                    {upcoming ? (
                      <><FileText size={16} /> Submit Feedback</>
                    ) : (
                      <><Clock size={16} /> Completed</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content feedback-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={24} />
                <h2>Interview Feedback</h2>
              </div>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="feedback-context">
                <div className="context-item">
                  <User size={18} />
                  <span><strong>Trainee:</strong> {selectedLock?.trainee_name}</span>
                </div>
                <div className="context-item">
                  <Briefcase size={18} />
                  <span><strong>Job:</strong> {selectedLock?.job_title}</span>
                </div>
                <div className="context-item">
                  <Calendar size={18} />
                  <span><strong>Date:</strong> {formatDateTime(selectedLock?.interview_datetime)}</span>
                </div>
              </div>

              <form onSubmit={submitFeedback}>
                <div className="form-section">
                  <h3><Target size={18} /> Performance Metrics</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Questions Asked</label>
                      <input
                        type="number"
                        name="questions_asked"
                        value={feedbackForm.questions_asked}
                        onChange={handleInputChange}
                        min="0"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Questions Answered</label>
                      <input
                        type="number"
                        name="questions_answered"
                        value={feedbackForm.questions_answered}
                        onChange={handleInputChange}
                        min="0"
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Attitude Rating</label>
                    <div className="rating-selector">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          type="button"
                          className={`rating-btn ${feedbackForm.attitude_rating === r ? 'active' : ''}`}
                          onClick={() => setFeedbackForm(prev => ({ ...prev, attitude_rating: r }))}
                        >
                          <Star size={16} fill={feedbackForm.attitude_rating >= r ? '#f59e0b' : 'none'} />
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Behaviour Notes</label>
                    <textarea
                      name="behaviour_notes"
                      value={feedbackForm.behaviour_notes}
                      onChange={handleInputChange}
                      rows="2"
                      className="form-control"
                      placeholder="Observations about attitude, communication, etc."
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3><Code size={18} /> Technical Assessment</h3>
                  <div className="form-group">
                    <label>Skills Assessed</label>
                    <div className="skills-input-group">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="form-control"
                        placeholder="Type skill and press Enter"
                      />
                      <button type="button" className="btn-secondary" onClick={handleSkillAdd}>
                        <Plus size={16} /> Add
                      </button>
                    </div>
                    <div className="skills-tags">
                      {feedbackForm.technical_skills_assessed.map((skill, i) => (
                        <span key={i} className="skill-tag">
                          {skill}
                          <button type="button" onClick={() => handleSkillRemove(i)}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Strengths</label>
                    <textarea
                      name="strengths"
                      value={feedbackForm.strengths}
                      onChange={handleInputChange}
                      rows="2"
                      className="form-control"
                      placeholder="What did the candidate excel at?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Areas for Improvement</label>
                    <textarea
                      name="weaknesses"
                      value={feedbackForm.weaknesses}
                      onChange={handleInputChange}
                      rows="2"
                      className="form-control"
                      placeholder="What skills need development?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Recommended Upskilling</label>
                    <textarea
                      name="upskill_needed"
                      value={feedbackForm.upskill_needed}
                      onChange={handleInputChange}
                      rows="2"
                      className="form-control"
                      placeholder="Suggested courses or training"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3><Award size={18} /> Final Recommendation</h3>
                  <div className="form-group">
                    <label>Overall Comments</label>
                    <textarea
                      name="overall_comments"
                      value={feedbackForm.overall_comments}
                      onChange={handleInputChange}
                      rows="3"
                      className="form-control"
                      placeholder="Summary of the interview"
                    />
                  </div>

                  <div className="form-group">
                    <label>Recommendation</label>
                    <div className="recommendation-toggle">
                      <button
                        type="button"
                        className={`rec-btn selected ${feedbackForm.recommendation === 'selected' ? 'active' : ''}`}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, recommendation: 'selected' }))}
                      >
                        <ThumbsUp size={18} /> Select Candidate
                      </button>
                      <button
                        type="button"
                        className={`rec-btn rejected ${feedbackForm.recommendation === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, recommendation: 'rejected' }))}
                      >
                        <ThumbsDown size={18} /> Reject Candidate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                    <X size={16} /> Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                      <><RefreshCw size={16} className="spinning" /> Submitting...</>
                    ) : (
                      <><Send size={16} /> Submit Feedback</>
                    )}
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