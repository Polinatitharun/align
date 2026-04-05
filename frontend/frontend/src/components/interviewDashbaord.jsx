// DashboardInterviewer.js
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Calendar, User, Briefcase, LogOut } from 'lucide-react';
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

  const handleSkillAdd = (skill) => {
    setFeedbackForm(prev => ({
      ...prev,
      technical_skills_assessed: [...prev.technical_skills_assessed, skill]
    }));
  };

  const handleSkillRemove = (index) => {
    setFeedbackForm(prev => ({
      ...prev,
      technical_skills_assessed: prev.technical_skills_assessed.filter((_, i) => i !== index)
    }));
  };

  const submitFeedback = async () => {
    if (!selectedLock) return;
    try {
      setLoading(true);
      await api.post(`/interview-locks/${selectedLock.id}/submit_feedback/`, feedbackForm);
      toast.success('Feedback submitted successfully');
      setShowFeedbackModal(false);
      setSelectedLock(null);
      fetchAssignedLocks(); // refresh list
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
    setShowFeedbackModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    onLogout();
  };

  return (
    <div className="interviewer-dashboard">
      <Toaster richColors position="top-right" />
      <div className="dashboard-header">
        <div>
          <h1>👔 Interviewer Dashboard</h1>
          <p>Welcome, {userData?.name || 'Interviewer'}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="content">
        <h2>📋 My Upcoming Interviews</h2>
        {loading && <div className="loading-spinner" />}
        {!loading && assignedLocks.length === 0 && (
          <div className="no-data">✨ No interviews assigned yet.</div>
        )}
        <div className="interview-cards">
          {assignedLocks.map(lock => (
            <div key={lock.id} className="interview-card">
              <div className="card-header">
                <User size={20} />
                <h3>{lock.trainee_name}</h3>
              </div>
              <div className="card-body">
                <p><Briefcase size={16} /> {lock.job_title}</p>
                <p><Calendar size={16} /> {new Date(lock.interview_datetime).toLocaleString()}</p>
                {lock.comments && <p className="comments">📝 Notes: {lock.comments}</p>}
              </div>
              <div className="card-actions">
                <button className="btn-primary" onClick={() => openFeedbackModal(lock)}>
                  🎤 Conduct Interview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Modal (same as before, unchanged) */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Interview Feedback for {selectedLock?.trainee_name}</h3>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); submitFeedback(); }}>
                {/* ... all the form fields (same as before) ... */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Questions Asked</label>
                    <input type="number" name="questions_asked" value={feedbackForm.questions_asked} onChange={handleInputChange} min="0" required />
                  </div>
                  <div className="form-group">
                    <label>Questions Answered</label>
                    <input type="number" name="questions_answered" value={feedbackForm.questions_answered} onChange={handleInputChange} min="0" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Attitude Rating (1-5)</label>
                  <select name="attitude_rating" value={feedbackForm.attitude_rating} onChange={handleInputChange} required>
                    {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Behaviour Notes</label>
                  <textarea name="behaviour_notes" value={feedbackForm.behaviour_notes} onChange={handleInputChange} rows="2" />
                </div>
                <div className="form-group">
                  <label>Technical Skills Assessed</label>
                  <div className="skills-input">
                    <input type="text" placeholder="Type skill and press Enter" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const skill = e.target.value.trim();
                        if (skill && !feedbackForm.technical_skills_assessed.includes(skill)) {
                          handleSkillAdd(skill);
                          e.target.value = '';
                        }
                      }
                    }} />
                    <div className="skills-tags">
                      {feedbackForm.technical_skills_assessed.map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}<button type="button" onClick={() => handleSkillRemove(i)}>×</button></span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-group"><label>Strengths</label><textarea name="strengths" value={feedbackForm.strengths} onChange={handleInputChange} rows="2" /></div>
                <div className="form-group"><label>Weaknesses</label><textarea name="weaknesses" value={feedbackForm.weaknesses} onChange={handleInputChange} rows="2" /></div>
                <div className="form-group"><label>Upskilling Needed</label><textarea name="upskill_needed" value={feedbackForm.upskill_needed} onChange={handleInputChange} rows="2" /></div>
                <div className="form-group"><label>Overall Comments</label><textarea name="overall_comments" value={feedbackForm.overall_comments} onChange={handleInputChange} rows="3" /></div>
                <div className="form-group">
                  <label>Recommendation</label>
                  <div className="radio-group">
                    <label><input type="radio" name="recommendation" value="selected" checked={feedbackForm.recommendation === 'selected'} onChange={handleInputChange} /> Select</label>
                    <label><input type="radio" name="recommendation" value="rejected" checked={feedbackForm.recommendation === 'rejected'} onChange={handleInputChange} /> Reject</label>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Feedback'}</button>
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