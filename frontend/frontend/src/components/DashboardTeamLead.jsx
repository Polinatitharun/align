import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Icons = {
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  MessageSquare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  BookOpen: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Award: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  BarChart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-6"/></svg>,
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ExternalLink: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Edit: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  XCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
};

function DashboardTeamLead({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedCourseForVerify, setSelectedCourseForVerify] = useState(null);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showRecommendToManager, setShowRecommendToManager] = useState(false);
  const [managerNote, setManagerNote] = useState('');
  const [newCourse, setNewCourse] = useState({
    courseId: '',
    courseName: '',
    url: '',
    platform: 'Ievolve',
    selectedTrainees: [] // Array of trainee IDs
  });
  const [feedback, setFeedback] = useState('');

  // Real API data - multiple trainees
  const [trainees, setTrainees] = useState([
    {
      id: 2962,
      username: "Chandini Saketi",
      role: "IGNITE TRAINEE",
      location: "Pune",
      isu: "NGM PS EBU & Delivery Governance, Risk & Security",
      batchRank: "258/321",
      groupRank: "20/23",
      average: 36,
      dpi: 1.95,
      strengths: ["BizSkills", "Behavior Skill", "Projects"],
      weakness: ["Python", "Java", "WebTech"],
      upskillCourses: [
        { courseId: 5386, courseName: "Python E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5386", platform: "Ievolve", status: 'in_progress', progress: 80, screenshot: null },
        { courseId: 5835, courseName: "Python- Web Frameworks E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5835", platform: "Ievolve", status: 'pending_verification', progress: 100, screenshot: "python_web_proof.jpg" },
        { courseId: 3224, courseName: "Java E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/3224", platform: "Ievolve", status: 'completed', progress: 100, screenshot: "java_proof.jpg" },
        { courseId: 55957, courseName: "Node.js E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/coursedetails/55957", platform: "Ievolve", status: 'in_progress', progress: 45, screenshot: null },
        { courseId: 5630, courseName: "React.js E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5630", platform: "Ievolve", status: 'pending', progress: 0, screenshot: null }
      ],
      certificates: [
        { certificateName: "JAVA", provider: "UDEMY", acquiredDate: "2025-12-08" },
        { certificateName: "AWS Certified Solutions Architect – Associate", provider: "Amazon Web Services", acquiredDate: "2024-03-15" },
        { certificateName: "Google Professional Cloud Architect", provider: "Google Cloud", acquiredDate: "2023-11-05" },
        { certificateName: "Certified Kubernetes Administrator (CKA)", provider: "Cloud Native Computing Foundation", acquiredDate: "2025-01-10" },
        { certificateName: "Oracle Certified Professional, Java SE 11 Developer", provider: "Oracle", acquiredDate: "2022-09-30" }
      ],
      matchingProjects: [
        { projectName: "Project Alpha", matchScore: 85 },
        { projectName: "Project Beta", matchScore: 70 },
        { projectName: "Project Gamma", matchScore: 92 }
      ],
      managerStatus: 'open_pool' // 'open_pool', 'pending', 'approved', 'mapped'
    },
    {
      id: 2963,
      username: "Alex Johnson",
      role: "IGNITE TRAINEE",
      location: "Mumbai",
      isu: "NGM PS EBU & Delivery Governance, Risk & Security",
      batchRank: "150/321",
      groupRank: "10/23",
      average: 75,
      dpi: 3.2,
      strengths: ["Java", "Spring", "Database"],
      weakness: ["Frontend", "UI Design"],
      upskillCourses: [
        { courseId: 5630, courseName: "React.js E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5630", platform: "Ievolve", status: 'in_progress', progress: 30, screenshot: null },
        { courseId: 55957, courseName: "Node.js E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/coursedetails/55957", platform: "Ievolve", status: 'pending', progress: 0, screenshot: null }
      ],
      certificates: [
        { certificateName: "Java SE 8 Programmer", provider: "Oracle", acquiredDate: "2024-06-15" }
      ],
      matchingProjects: [
        { projectName: "Project Delta", matchScore: 78 },
        { projectName: "Project Epsilon", matchScore: 65 }
      ],
      managerStatus: 'pending'
    },
    {
      id: 2964,
      username: "Sarah Lee",
      role: "IGNITE TRAINEE",
      location: "Bangalore",
      isu: "NGM PS EBU & Delivery Governance, Risk & Security",
      batchRank: "50/321",
      groupRank: "5/23",
      average: 92,
      dpi: 4.5,
      strengths: ["Machine Learning", "Python", "Data Analysis"],
      weakness: ["Web Development", "DevOps"],
      upskillCourses: [
        { courseId: 5835, courseName: "Python- Web Frameworks E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5835", platform: "Ievolve", status: 'completed', progress: 100, screenshot: null }
      ],
      certificates: [
        { certificateName: "Machine Learning Specialization", provider: "Coursera", acquiredDate: "2024-09-20" }
      ],
      matchingProjects: [
        { projectName: "Project Zeta", matchScore: 95 },
        { projectName: "Project Eta", matchScore: 88 },
        { projectName: "Project Theta", matchScore: 76 }
      ],
      managerStatus: 'approved'
    }
  ]);

  const [upskillingRequests, setUpskillingRequests] = useState([
    {
      id: 1,
      traineeId: 2962,
      type: 'course',
      title: 'Advanced TypeScript Mastery',
      description: 'In-depth TypeScript course covering advanced types, generics, and type safety',
      justification: 'Need to improve TypeScript skills for better code quality and team collaboration',
      urgency: 'high',
      dateSubmitted: '2025-12-20',
      status: 'pending'
    },
    {
      id: 2,
      traineeId: 2963,
      type: 'certification',
      title: 'AWS Certified Developer',
      description: 'Certification for cloud development',
      justification: 'To enhance cloud skills',
      urgency: 'medium',
      dateSubmitted: '2025-12-21',
      status: 'pending'
    }
  ]);

  const handleApproveRequest = (requestId) => {
    const request = upskillingRequests.find(r => r.id === requestId);
    if (request) {
      const newCourse = {
        courseId: Math.floor(Math.random() * 10000),
        courseName: request.title,
        url: 'https://ievolveng.ultimatix.net/ievolve/competencydetails/' + Math.floor(Math.random() * 10000),
        platform: 'Ievolve',
        status: 'pending',
        progress: 0,
        screenshot: null
      };

      setTrainees(prev => prev.map(t =>
        t.id === request.traineeId ? {
          ...t,
          upskillCourses: [...t.upskillCourses, newCourse]
        } : t
      ));

      setUpskillingRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: 'approved' } : r
      ));

      alert('Request approved and course recommended.');
    }
  };

  const handleRejectRequest = (requestId) => {
    setUpskillingRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' } : r
    ));
    alert('Request rejected.');
  };

  const handleRecommendCourse = () => {
    const newCourseJson = {
      courseId: newCourse.courseId || Math.floor(Math.random() * 10000),
      courseName: newCourse.courseName,
      url: newCourse.url,
      platform: newCourse.platform,
      status: 'pending',
      progress: 0,
      screenshot: null
    };

    setTrainees(prev => prev.map(t =>
      newCourse.selectedTrainees.includes(t.id) ? {
        ...t,
        upskillCourses: [...t.upskillCourses, newCourseJson]
      } : t
    ));

    setShowRecommendModal(false);
    setNewCourse({ courseId: '', courseName: '', url: '', platform: 'Ievolve', selectedTrainees: [] });
    alert('Course recommended to selected trainees.');
  };

  const handleVerifyCompletion = (traineeId, courseId) => {
    setTrainees(prev => prev.map(t =>
      t.id === traineeId ? {
        ...t,
        upskillCourses: t.upskillCourses.map(c =>
          c.courseId === courseId ? { ...c, status: 'completed', taVerified: true } : c
        )
      } : t
    ));

    setShowVerifyModal(false);
    setFeedback('');
    alert(`Course verified and marked as completed. Feedback: ${feedback}`);
  };

  const handleRecommendToManager = (traineeId) => {
    setTrainees(prev => prev.map(t =>
      t.id === traineeId ? { ...t, managerStatus: 'pending' } : t
    ));
    setShowRecommendToManager(false);
    setManagerNote('');
    alert(`Recommended to manager with note: ${managerNote}`);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Icons.BarChart /> },
    { id: 'trainees', label: 'Trainees List', icon: <Icons.Users /> },
    // { id: 'requests', label: 'Upskilling Reviews', icon: <Icons.MessageSquare />, badge: upskillingRequests.filter(r => r.status === 'pending').length },
    // { id: 'verifications', label: 'Screenshot Verifications', icon: <Icons.CheckCircle />, badge: trainees.reduce((acc, t) => acc + t.upskillCourses.filter(c => c.status === 'pending_verification').length, 0) },
    // { id: 'recommend', label: 'Recommend Courses', icon: <Icons.BookOpen /> },
  ];

  return (
    <>
      <div className="dashboard">
        <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />

        <main className="main-content">
          {/* Overview - All Statistics */}
          {activeTab === 'overview' && (
            <div className="page">
              <h1 className="page-title">Team Overview</h1>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{trainees.length}</div>
                  <div className="stat-label">Active Trainees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{trainees.reduce((acc, t) => acc + t.upskillCourses.length, 0)}</div>
                  <div className="stat-label">Assigned Courses</div>
                </div>
                {/* <div className="stat-card">
                  <div className="stat-value">{trainees.reduce((acc, t) => acc + t.upskillCourses.filter(c => c.status === 'pending_verification').length, 0)}</div>
                  <div className="stat-label">Pending Verifications</div>
                </div> */}
                <div className="stat-card">
                  <div className="stat-value">{trainees.reduce((acc, t) => acc + t.upskillCourses.filter(c => c.status === 'completed').length, 0)}</div>
                  <div className="stat-label">Completed Courses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{trainees.reduce((acc, t) => acc + t.certificates.length, 0)}</div>
                  <div className="stat-label">Certificates Earned</div>
                </div>
                {/* <div className="stat-card">
                  <div className="stat-value">{upskillingRequests.filter(r => r.status === 'pending').length}</div>
                  <div className="stat-label">Pending Upskilling Requests</div>
                </div> */}
                <div className="stat-card">
                  <div className="stat-value">{trainees.filter(t => t.managerStatus === 'approved').length}</div>
                  <div className="stat-label">Mapped to Projects</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{trainees.filter(t => t.managerStatus === 'pending').length}</div>
                  <div className="stat-label">Pending Manager Approval</div>
                </div>
              </div>
            </div>
          )}

          {/* Trainees List */}
          {activeTab === 'trainees' && (
            <div className="page">
              <h1 className="page-title">Trainees List</h1>
              <div className="trainees-grid">
                {trainees.map(trainee => (
                  <div key={trainee.id} className="trainee-card large" onClick={() => setSelectedTrainee(trainee)}>
                    <div className="trainee-header">
                      <div className="avatar">{trainee.username.charAt(0)}</div>
                      <div>
                        <h3>{trainee.username}</h3>
                        <p>{trainee.role} • {trainee.location}</p>
                      </div>
                    </div>
                    <div className="stats-grid small">
                      <div><strong>Average:</strong> {trainee.average}%</div>
                      <div><strong>Batch Rank:</strong> {trainee.batchRank}</div>
                      <div><strong>Group Rank:</strong> {trainee.groupRank}</div>
                    </div>
                    <div className="tags-group">
                      <div>
                        <strong>Strengths:</strong>
                        <div className="tags positive">{trainee.strengths.map(s => <span key={s}>{s}</span>)}</div>
                      </div>
                      <div>
                        <strong>Improve:</strong>
                        <div className="tags warning">{trainee.weakness.map(w => <span key={w}>{w}</span>)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upskilling Reviews */}
          {/* {activeTab === 'requests' && (
            <div className="page">
              <h1 className="page-title">Upskilling Reviews</h1>
              <div className="requests-list">
                {upskillingRequests.map(req => (
                  <div key={req.id} className="request-card pending">
                    <div className="request-header">
                      <div>
                        <h4>{trainees.find(t => t.id === req.traineeId)?.username}</h4>
                        <p>{req.description}</p>
                        <p><strong>Justification:</strong> {req.justification}</p>
                      </div>
                      <span className="badge pending">Pending</span>
                    </div>
                    <div className="request-actions">
                      <button className="btn-primary" onClick={() => handleApproveRequest(req.id)}>Approve & Recommend</button>
                      <button className="btn-secondary" onClick={() => handleRejectRequest(req.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Screenshot Verifications */}
          {activeTab === 'verifications' && (
            <div className="page">
              <h1 className="page-title">Screenshot Verifications</h1>
              <div className="verifications-grid">
                {trainees.flatMap(trainee =>
                  trainee.upskillCourses.filter(c => c.status === 'pending_verification').map(course => (
                    <div key={course.courseId} className="verification-card">
                      <div className="verification-header">
                        <h4>{trainee.username}</h4>
                        <p>{course.courseName}</p>
                      </div>
                      <div className="screenshot-preview">
                        <p>Screenshot: {course.screenshot}</p>
                        <div className="placeholder-image">📸 Screenshot Preview</div>
                      </div>
                      <div className="form-group">
                        <label>Feedback</label>
                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows="3" />
                      </div>
                      <div className="verification-actions">
                        <button className="btn-secondary">Reject</button>
                        <button className="btn-primary" onClick={() => handleVerifyCompletion(trainee.id, course.courseId)}>
                          Verify & Complete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recommend Courses */}
          {activeTab === 'recommend' && (
            <div className="page">
              <h1 className="page-title">Recommend Courses</h1>
              <div className="card">
                <h3>Course Recommendation Form</h3>
                <div className="form-group">
                  <label>Course ID (optional)</label>
                  <input type="text" value={newCourse.courseId} onChange={e => setNewCourse({...newCourse, courseId: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input type="text" value={newCourse.courseName} onChange={e => setNewCourse({...newCourse, courseName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input type="url" value={newCourse.url} onChange={e => setNewCourse({...newCourse, url: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Platform</label>
                  <input type="text" value={newCourse.platform} onChange={e => setNewCourse({...newCourse, platform: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Recommend to Trainees</label>
                  <div className="checkbox-list">
                    {trainees.map(t => (
                      <label key={t.id}>
                        <input
                          type="checkbox"
                          checked={newCourse.selectedTrainees.includes(t.id)}
                          onChange={e => {
                            const selected = e.target.checked
                              ? [...newCourse.selectedTrainees, t.id]
                              : newCourse.selectedTrainees.filter(id => id !== t.id);
                            setNewCourse({...newCourse, selectedTrainees: selected});
                          }}
                        />
                        {t.username}
                      </label>
                    ))}
                  </div>
                </div>
                <button className="btn-primary" onClick={handleRecommendCourse}>Recommend</button>
              </div>
            </div>
          )}
        </main>

        {/* Trainee Profile Modal */}
        {selectedTrainee && (
          <div className="modal-overlay" onClick={() => setSelectedTrainee(null)}>
            <div className="modal large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedTrainee.username} - Profile</h2>
                <button className="close-btn" onClick={() => setSelectedTrainee(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="profile-summary">
                  <div className="avatar-large">{selectedTrainee.username.charAt(0)}</div>
                  <div>
                    <h3>{selectedTrainee.username}</h3>
                    <p><strong>Role:</strong> {selectedTrainee.role}</p>
                    <p><strong>Location:</strong> {selectedTrainee.location}</p>
                    <p><strong>ISU:</strong> {selectedTrainee.isu}</p>
                    <p><strong>DPI:</strong> {selectedTrainee.dpi}</p>
                  </div>
                  <div>
                    <p><strong>Average Score:</strong> {selectedTrainee.average}%</p>
                    <p><strong>Batch Rank:</strong> {selectedTrainee.batchRank}</p>
                    <p><strong>Group Rank:</strong> {selectedTrainee.groupRank}</p>
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <h3>Strengths</h3>
                    <div className="tags positive large">
                      {selectedTrainee.strengths.map(s => <span key={s}>{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <h3>Areas to Improve</h3>
                    <div className="tags warning large">
                      {selectedTrainee.weakness.map(w => <span key={w}>{w}</span>)}
                    </div>
                  </div>
                </div>

                <h3>Matching Projects</h3>
                <div className="projects-list">
                  {selectedTrainee.matchingProjects.map((p, i) => (
                    <div key={i} className="project-item">
                      <strong>{p.projectName}</strong>
                      <span>Match Score: {p.matchScore}%</span>
                    </div>
                  ))}
                </div>

                <h3>Upskill Courses</h3>
                <div className="courses-grid small">
                  {selectedTrainee.upskillCourses.map(course => (
                    <div key={course.courseId} className="course-card">
                      <div className="course-header">
                        <h4>{course.courseName}</h4>
                        {/* <span className={`status ${course.status}`}>
                          {course.status === 'pending' ? 'Not Started' :
                           course.status === 'in_progress' ? 'In Progress' :
                           course.status === 'pending_verification' ? 'Pending Review' :
                           'Completed'}
                        </span> */}
                      </div>
                      {/* <div className="progress-section">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                        </div>
                      </div> */}
                      {/* {course.status === 'pending_verification' && (
                        <button className="btn-primary" onClick={() => {
                          setSelectedCourseForVerify(course);
                          setShowVerifyModal(true);
                        }}>
                          Verify Screenshot
                        </button>
                      )} */}
                    </div>
                  ))}
                </div>

                <h3>Certificates</h3>
                <div className="cert-grid small">
                  {selectedTrainee.certificates.map((c, i) => (
                    <div key={i} className="cert-item">
                      <strong>{c.certificateName}</strong>
                      <p>{c.provider} • {new Date(c.acquiredDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>

                <h3>Recommend to Manager</h3>
                <div className="manager-recommend-section">
                  {/* <p>Status: {selectedTrainee.managerStatus === 'approved' ? 'Approved (Mapped)' : selectedTrainee.managerStatus === 'pending' ? 'Pending' : 'Open Pool'}</p> */}
                  {selectedTrainee.managerStatus !== 'approved' && selectedTrainee.managerStatus !== 'pending' && (
                    <button className="btn-primary" onClick={() => setShowRecommendToManager(true)}>Recommend to Manager</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommend Course Modal */}
        {showRecommendModal && (
          <div className="modal-overlay" onClick={() => setShowRecommendModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Recommend New Course</h2>
                <button className="close-btn" onClick={() => setShowRecommendModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Course ID (optional)</label>
                  <input type="text" value={newCourse.courseId} onChange={e => setNewCourse({...newCourse, courseId: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input type="text" value={newCourse.courseName} onChange={e => setNewCourse({...newCourse, courseName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input type="url" value={newCourse.url} onChange={e => setNewCourse({...newCourse, url: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Platform</label>
                  <input type="text" value={newCourse.platform} onChange={e => setNewCourse({...newCourse, platform: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Recommend to Trainees</label>
                  <div className="checkbox-list">
                    {trainees.map(t => (
                      <label key={t.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newCourse.selectedTrainees.includes(t.id)}
                          onChange={e => {
                            const selected = e.target.checked
                              ? [...newCourse.selectedTrainees, t.id]
                              : newCourse.selectedTrainees.filter(id => id !== t.id);
                            setNewCourse({...newCourse, selectedTrainees: selected});
                          }}
                        />
                        {t.username}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowRecommendModal(false)}>Cancel</button>
                <button className="btn-primary" disabled={newCourse.selectedTrainees.length === 0 || !newCourse.courseName || !newCourse.url} onClick={handleRecommendCourse}>
                  Recommend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verify Screenshot Modal */}
        {showVerifyModal && selectedCourseForVerify && selectedTrainee && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Verify Course Completion</h2>
                <button className="close-btn" onClick={() => setShowVerifyModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <h3>{selectedCourseForVerify.courseName}</h3>
                <p>Trainee: <strong>{selectedTrainee.username}</strong></p>
                <div className="screenshot-preview">
                  <p>Completion screenshot submitted</p>
                  <div className="placeholder-image">📸 {selectedCourseForVerify.screenshot || 'Screenshot Preview'}</div>
                </div>
                <div className="form-group">
                  <label>Feedback (optional)</label>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows="3" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowVerifyModal(false)}>Reject</button>
                <button className="btn-primary" onClick={() => handleVerifyCompletion(selectedTrainee.id, selectedCourseForVerify.courseId)}>
                  Approve & Mark Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommend to Manager Modal */}
        {showRecommendToManager && selectedTrainee && (
          <div className="modal-overlay" onClick={() => setShowRecommendToManager(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Recommend {selectedTrainee.username} to Manager</h2>
                <button className="close-btn" onClick={() => setShowRecommendToManager(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Note to Manager</label>
                  <textarea value={managerNote} onChange={e => setManagerNote(e.target.value)} rows="4" placeholder="Enter your recommendation note..." />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowRecommendToManager(false)}>Cancel</button>
                <button className="btn-primary" disabled={!managerNote} onClick={() => handleRecommendToManager(selectedTrainee.id)}>
                  Submit Recommendation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Clean CSS */}
      <style jsx>{`
        :root {
          --bg: #f8fafc;
          --card: #ffffff;
          --text: #1e293b;
          --text-light: #64748b;
          --border: #e2e8f0;
          --primary: #4f46e5;
          --success: #10b981;
          --warning: #f59e0b;
          --pending: #8b5cf6;
        }

        .dashboard { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', system-ui, sans-serif; }
        .main-content { flex: 1; padding: 2.5rem; max-width: 1400px; margin: 0 auto; }

        .page-title { font-size: 2.125rem; font-weight: 700; color: var(--text); margin-bottom: 2rem; }
        .section-title { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .stat-card { background: var(--card); padding: 1.5rem; border-radius: 12px; text-align: center; border: 1px solid var(--border); }
        .stat-value { font-size: 2.5rem; font-weight: 700; color: var(--text); }
        .stat-label { color: var(--text-light); margin-top: 0.5rem; }

        .card { background: var(--card); border-radius: 12px; padding: 2rem; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

        .trainees-grid, .courses-grid, .cert-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; }
        .trainee-card { background: var(--card); border-radius: 12px; padding: 1.75rem; border: 1px solid var(--border); cursor: pointer; transition: transform 0.2s; }
        .trainee-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }

        .trainee-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .avatar { width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; font-weight: 600; }
        .avatar-large { width: 80px; height: 80px; font-size: 2.5rem; }

        .stats-grid.small { grid-template-columns: 1fr 1fr 1fr; gap: 1rem; font-size: 0.95rem; }
        .tags-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
        .tags { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
        .tags span { padding: 0.5rem 1rem; border-radius: 999px; font-weight: 600; font-size: 0.95rem; }
        .tags.positive span { background: #d1fae5; color: var(--success); }
        .tags.warning span { background: #fef3c7; color: var(--warning); }
        .tags.large span { padding: 0.75rem 1.25rem; font-size: 1rem; }

        .course-card { background: var(--card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); }
        .status { padding: 0.4rem 0.9rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
        .status.in_progress { background: #eef2ff; color: var(--primary); }
        .status.pending_verification { background: #f3e8ff; color: var(--pending); }
        .status.completed { background: #d1fae5; color: var(--success); }
        .status.pending { background: #fef3c7; color: #92400e; }

        .progress-section { margin: 1.5rem 0; }
        .progress-bar { height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 5px; }
        .progress-text { display: block; text-align: right; margin-top: 0.5rem; font-weight: 600; color: var(--text); }

        .course-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .btn-primary, .btn-outline, .btn-secondary { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
        .btn-secondary { background: #f1f5f9; color: var(--text-light); }

        .requests-list, .verifications-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; }
        .request-card, .verification-card { background: var(--card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); }
        .badge.pending { background: #fef3c7; color: #92400e; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.9rem; }

        .recommend-section { max-width: 600px; margin: 0 auto; padding: 2rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; }
        .checkbox-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }

        .projects-list { display: flex; flex-direction: column; gap: 1rem; }
        .project-item { display: flex; justify-content: space-between; padding: 1rem; background: #f1f5f9; border-radius: 8px; }

        .manager-recommend-section { padding: 1.5rem; background: #f1f5f9; border-radius: 12px; margin-top: 1.5rem; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 12px; width: 90%; max-width: 1000px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .modal.large { max-width: 1100px; }
        .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 2rem; }
        .profile-summary { display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .cert-grid.small { grid-template-columns: 1fr; }

        .screenshot-preview { text-align: center; margin: 2rem 0; }
        .placeholder-image { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; height: 300px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #64748b; }

        .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc; }

        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; }

        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-light); }

        .trainee-section h2 { font-size: 1.25rem; margin-bottom: 1rem; }
        .courses-grid.small { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }

        @media (max-width: 768px) {
          .main-content { padding: 1.5rem; }
          .grid-2, .stats-grid, .trainees-grid, .courses-grid, .requests-list, .verifications-grid { grid-template-columns: 1fr; }
          .profile-summary { flex-direction: column; text-align: center; }
        }
      `}</style>
    </>
  );
}

export default DashboardTeamLead;