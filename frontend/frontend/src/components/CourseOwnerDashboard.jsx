import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import api from '../api/axios';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  RefreshCw,
  User,
  MapPin,
  Target,
  Mail,
  BarChart2,
} from 'lucide-react';
import Sidebar from './Sidebar';
import './styles/CourseOwnerDashboard.css';

function CourseOwnerDashboard({ userData, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecIds, setSelectedRecIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Trainee profile modal
  const [viewingTrainee, setViewingTrainee] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/course-owner/jobs/');
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (jobId) => {
    setLoading(true);
    try {
      const res = await api.get(`/course-owner/jobs/${jobId}/recommendations/`);
      setRecommendations(res.data);
      setSelectedRecIds([]);
      setSelectAll(false);
    } catch (err) {
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (updates) => {
    try {
      setLoading(true);
      await api.patch(`/course-owner/jobs/${selectedJob.id}/recommendations/`, {
        recommendations: updates
      });
      toast.success('Recommendations updated');
      fetchRecommendations(selectedJob.id);
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Approve all pending
  const approveAll = () => {
    const updates = recommendations
      .filter(r => r.status === 'Pending')
      .map(r => ({ id: r.id, status: 'Accepted' }));
    if (updates.length === 0) {
      toast.warning('No pending recommendations');
      return;
    }
    handleUpdateStatus(updates);
  };

  // Reject all pending
  const rejectAll = () => {
    const updates = recommendations
      .filter(r => r.status === 'Pending')
      .map(r => ({ id: r.id, status: 'Rejected' }));
    if (updates.length === 0) {
      toast.warning('No pending recommendations');
      return;
    }
    handleUpdateStatus(updates);
  };

  // Approve selected
  const approveSelected = () => {
    if (selectedRecIds.length === 0) {
      toast.warning('No trainees selected');
      return;
    }
    const updates = selectedRecIds.map(id => ({ id: parseInt(id), status: 'Accepted' }));
    handleUpdateStatus(updates);
  };

  // Reject selected
  const rejectSelected = () => {
    if (selectedRecIds.length === 0) {
      toast.warning('No trainees selected');
      return;
    }
    const updates = selectedRecIds.map(id => ({ id: parseInt(id), status: 'Rejected' }));
    handleUpdateStatus(updates);
  };

  // Toggle individual status
  const toggleStatus = (recId, currentStatus) => {
    const newStatus = currentStatus === 'Accepted' ? 'Rejected' : 'Accepted';
    handleUpdateStatus([{ id: recId, status: newStatus }]);
  };

  // Checkbox handling
  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedRecIds([]);
      setSelectAll(false);
    } else {
      const allIds = recommendations.map(r => r.id.toString());
      setSelectedRecIds(allIds);
      setSelectAll(true);
    }
  };

  const handleCheckboxChange = (recId) => {
    const idStr = recId.toString();
    if (selectedRecIds.includes(idStr)) {
      setSelectedRecIds(prev => prev.filter(id => id !== idStr));
      setSelectAll(false);
    } else {
      setSelectedRecIds(prev => [...prev, idStr]);
      // Check if all are now selected
      if (selectedRecIds.length + 1 === recommendations.length) {
        setSelectAll(true);
      }
    }
  };

  // View trainee profile
  const viewTraineeProfile = async (traineeId) => {
    try {
      const res = await api.get(`/api/profiles/?userId=${traineeId}`); // adjust endpoint if needed
      // Actually we need to get by userId. The endpoint is /api/profiles/<userId>/
      const profileRes = await api.get(`/api/profiles/${traineeId}/`);
      setViewingTrainee(profileRes.data);
    } catch (err) {
      toast.error('Could not load trainee profile');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchRecommendations(selectedJob.id);
    }
  }, [selectedJob]);

  const sidebarItems = [
    { id: 'jobs', label: 'My Jobs', icon: <Briefcase size={18} /> },
  ];

  return (
    <div className="dashboard-page">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab="jobs" userData={userData} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Course Owner Dashboard</h1>
        </div>
        <div className="dashboard-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          {!selectedJob ? (
            <div className="jobs-list">
              <h2 className="section-title">My Jobs</h2>
              {jobs.length === 0 && !loading ? (
                <div className="no-data">No jobs assigned to your courses yet.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Openings</th>
                        <th>Status</th>
                        <th>Recommendation</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id}>
                          <td>{job.project_name}</td>
                          <td>{job.openings}</td>
                          <td>
                            <span className={`status-badge status-${job.status}`}>
                              {job.status}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${job.recommendation_status}`}>
                              {job.recommendation_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-icon btn-icon-view"
                              onClick={() => setSelectedJob(job)}
                              title="View Recommendations"
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
          ) : (
            <div className="job-recommendations">
              <button
                className="btn btn-secondary mb-2"
                onClick={() => setSelectedJob(null)}
              >
                <ArrowLeft size={16} /> Back to Jobs
              </button>

              <h2>{selectedJob.project_name} – Recommendations</h2>

              {/* Bulk actions */}
              <div className="bulk-actions-row">
                <div className="select-all-checkbox">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectAll}
                    onChange={handleSelectAllToggle}
                    disabled={recommendations.length === 0}
                  />
                  <label htmlFor="selectAll">Select All ({recommendations.length})</label>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-sm btn-success" onClick={approveSelected} disabled={selectedRecIds.length === 0}>
                    <CheckCircle size={14} /> Approve Selected
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={rejectSelected} disabled={selectedRecIds.length === 0}>
                    <XCircle size={14} /> Reject Selected
                  </button>
                  <button className="btn btn-sm btn-success" onClick={approveAll}>
                    <ThumbsUp size={14} /> Approve All
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={rejectAll}>
                    <ThumbsDown size={14} /> Reject All
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => fetchRecommendations(selectedJob.id)}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {recommendations.length === 0 && !loading ? (
                <div className="no-data">No recommendations yet.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th><input type="checkbox" checked={selectAll} onChange={handleSelectAllToggle} /></th>
                        <th>Trainee Name</th>
                        <th>ID / Email</th>
                        <th>Location</th>
                        <th>Bucket</th>
                        <th>Total %</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map(rec => (
                        <tr key={rec.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRecIds.includes(rec.id.toString())}
                              onChange={() => handleCheckboxChange(rec.id)}
                            />
                          </td>
                          <td>{rec.trainee_name || 'Unknown'}</td>
                          <td>{rec.trainee_id}</td>
                          <td>{rec.trainee_location || '-'}</td>
                          <td>
                            {rec.bucket ? (
                              <span className={`bucket-tag ${rec.bucket.toLowerCase()}`}>
                                {rec.bucket === 'NEARBY' ? 'Proximity' : rec.bucket.replace('_', ' ')}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            {rec.total_percentage != null ? `${rec.total_percentage.toFixed(1)}%` : '-'}
                          </td>
                          <td>
                            <span className={`status-badge status-${rec.status.toLowerCase()}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-icon-view"
                                onClick={() => viewTraineeProfile(rec.trainee_id)}
                                title="View Profile"
                              >
                                <User size={16} />
                              </button>
                              <button
                                className={`btn-icon ${rec.status === 'Accepted' ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => toggleStatus(rec.id, rec.status)}
                                title={rec.status === 'Accepted' ? 'Reject' : 'Accept'}
                              >
                                {rec.status === 'Accepted' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trainee Profile Modal (simple) */}
      {viewingTrainee && (
        <div className="modal-overlay" onClick={() => setViewingTrainee(null)}>
          <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><User size={20} /><h2>{viewingTrainee.userInfo?.name || 'Trainee'}</h2></div>
              <button className="modal-close" onClick={() => setViewingTrainee(null)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="trainee-quick-info">
                <p><MapPin size={14} /> <strong>Location:</strong> {viewingTrainee.userInfo?.location || '-'}</p>
                <p><Mail size={14} /> <strong>Email:</strong> {viewingTrainee.userInfo?.email || '-'}</p>
                <p><Target size={14} /> <strong>Average Score:</strong> {viewingTrainee.userInfo?.averageScore || '-'}%</p>
                <p><BarChart2 size={14} /> <strong>Batch:</strong> {viewingTrainee.batch_name || '-'}</p>
              </div>
              <div className="trainee-skills">
                <h4>Strengths</h4>
                <div className="skills-list">
                  {viewingTrainee.strengths?.map((s,i) => <span key={i} className="skill-tag tech-tag">{s.courseName} ({s.avgScore}%)</span>) || <span>None</span>}
                </div>
                <h4>Weaknesses</h4>
                <div className="skills-list">
                  {viewingTrainee.weaknesses?.map((w,i) => <span key={i} className="skill-tag soft-tag">{w.courseName} ({w.avgScore}%)</span>) || <span>None</span>}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setViewingTrainee(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseOwnerDashboard;