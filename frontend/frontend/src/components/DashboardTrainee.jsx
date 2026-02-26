
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster, toast } from 'sonner';

const Icons = {
  BookOpen: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Award: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  MessageSquare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  BarChart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-6"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ExternalLink: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

function DashboardTrainee({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [newRequest, setNewRequest] = useState({
    type: 'course',
    title: '',
    description: '',
    justification: '',
    urgency: 'medium'
  });

  const [traineeData, setTraineeData] = useState({
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
      {
        courseId: 5386,
        courseName: "Python E1 competency",
        url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5386",
        platform: "Ievolve",
        status: 'in_progress',
        progress: 92,
        screenshot: null,
        completionSubmitted: false,
        taVerified: false
      },
      {
        courseId: 5835,
        courseName: "Python- Web Frameworks E1 competency",
        url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5835",
        platform: "Ievolve",
        status: 'pending_verification',
        progress: 100,
        screenshot: "python_web_proof.jpg",
        completionSubmitted: true,
        taVerified: false
      },
      {
        courseId: 3224,
        courseName: "Java E1 competency",
        url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/3224",
        platform: "Ievolve",
        status: 'completed',
        progress: 100,
        screenshot: "java_proof.jpg",
        completionSubmitted: true,
        taVerified: true
      },
      {
        courseId: 55957,
        courseName: "Node.js E1 competency",
        url: "https://ievolveng.ultimatix.net/ievolve/coursedetails/55957",
        platform: "Ievolve",
        status: 'in_progress',
        progress: 65
      },
      {
        courseId: 5630,
        courseName: "React.js E1 competency",
        url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5630",
        platform: "Ievolve",
        status: 'pending',
        progress: 0
      }
    ],
    certificates: [
      { certificateName: "JAVA", provider: "UDEMY", acquiredDate: "2025-12-08" },
      { certificateName: "AWS Certified Solutions Architect – Associate", provider: "Amazon Web Services", acquiredDate: "2024-03-15" },
      { certificateName: "Google Professional Cloud Architect", provider: "Google Cloud", acquiredDate: "2023-11-05" },
      { certificateName: "Certified Kubernetes Administrator (CKA)", provider: "Cloud Native Computing Foundation", acquiredDate: "2025-01-10" },
      { certificateName: "Oracle Certified Professional, Java SE 11 Developer", provider: "Oracle", acquiredDate: "2022-09-30" }
    ]
  });

  const [upskillingRequests, setUpskillingRequests] = useState([
    {
      id: 1,
      type: 'course',
      title: 'Advanced Docker & Kubernetes',
      description: 'Deep dive into container orchestration',
      justification: 'Needed for upcoming DevOps projects',
      urgency: 'high',
      dateSubmitted: '2025-12-20',
      status: 'pending'
    }
  ]);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const newReq = {
      id: upskillingRequests.length + 1,
      ...newRequest,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setUpskillingRequests([newReq, ...upskillingRequests]);
    setNewRequest({ type: 'course', title: '', description: '', justification: '', urgency: 'medium' });
    // ✅ Sonner toast instead of alert
    toast.success('Upskilling request submitted successfully!', {
      description: 'Your TA/Manager will review the request shortly.',
    });
  };

  const handleSubmitCompletion = () => {
    if (!screenshotFile) {
      // ✅ Sonner toast instead of alert
      toast.error('Please upload a screenshot as proof of completion.', {
        description: 'Attach a clear image showing your name and 100% completion.',
      });
      return;
    }

    setTraineeData(prev => ({
      ...prev,
      upskillCourses: prev.upskillCourses.map(c =>
        c.courseId === selectedCourse.courseId
          ? {
              ...c,
              status: 'pending_verification',
              progress: 100,
              screenshot: screenshotFile.name,
              completionSubmitted: true
            }
          : c
      )
    }));

    setShowCompletionModal(false);
    setScreenshotFile(null);
    setSelectedCourse(null);
    // ✅ Sonner toast instead of alert
    toast.success('Completion proof submitted!', {
      description: 'Your TA will review and verify it shortly.',
    });
  };

  const sidebarItems = [
    { id: 'progress', label: 'Progress Overview', icon: <Icons.BarChart /> },
    { id: 'courses', label: 'My Courses', icon: <Icons.BookOpen />, badge: traineeData.upskillCourses.filter(c => c.status === 'pending_verification').length },
    { id: 'certificates', label: 'Certificates', icon: <Icons.Award /> },
    { id: 'profile', label: 'Profile', icon: <Icons.User /> },
  ];

  return (
    <>
      {/* ✅ Sonner Toaster */}
      <Toaster position="top-right" richColors expand />

      <div className="dashboard">
        {/* Sidebar (fixed left) */}
        <div className="dashboard-sidebar">
          <Sidebar
            items={sidebarItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userData={userData}
            onLogout={onLogout}
          />
        </div>

        {/* Main pane (offset by sidebar width) */}
        <main className="main-content">
          {/* Progress Overview */}
          {activeTab === 'progress' && (
            <div className="page">
              <h1 className="page-title">Welcome back, {traineeData.username}!</h1>
              <p className="page-subtitle">Track your learning journey</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{traineeData.average}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {traineeData.upskillCourses.filter(c => c.status === 'completed' && c.taVerified).length}
                  </div>
                  <div className="stat-label">Completed Courses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{traineeData.certificates.length}</div>
                  <div className="stat-label">Certificates Earned</div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3>Strengths</h3>
                  <div className="tags positive">
                    {traineeData.strengths.map(s => <span key={s} className="tag-item">{s}</span>)}
                  </div>
                </div>
                <div className="card">
                  <h3>Areas to Improve</h3>
                  <div className="tags warning">
                    {traineeData.weakness.map(w => <span key={w} className="tag-item">{w}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Courses */}
          {activeTab === 'courses' && (
            <div className="page">
              <h1 className="page-title">My Recommended Courses</h1>
              <p className="page-subtitle">Completed courses</p>

              <div className="courses-grid">
                {traineeData.upskillCourses.map(course => (
                  <div key={course.courseId} className="course-card">
                    <div className="course-header">
                      <h3>{course.courseName}</h3>
                    </div>

                    <p className="platform">Platform: {course.platform}</p>

                    <div className="course-actions">
                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                        <Icons.ExternalLink /> Open Course
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {activeTab === 'certificates' && (
            <div className="page">
              <h1 className="page-title">My Certificates</h1>
              <div className="cert-grid">
                {traineeData.certificates.map((cert, i) => (
                  <div key={i} className="cert-card">
                    <Icons.Award />
                    <div>
                      <h4>{cert.certificateName}</h4>
                      <p>{cert.provider}</p>
                      <small>
                        {new Date(cert.acquiredDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="page">
              <h1 className="page-title">My Profile</h1>
              <div className="profile-grid">
                <div className="card">
                  <h3>Personal Details</h3>
                  <div className="info-list">
                    <div><strong>Name:</strong> {traineeData.username}</div>
                    <div><strong>Role:</strong> {traineeData.role}</div>
                    <div><strong>Location:</strong> {traineeData.location}</div>
                    <div><strong>ISU:</strong> {traineeData.isu}</div>
                    <div><strong>DPI:</strong> {traineeData.dpi}</div>
                  </div>
                </div>
                <div className="card">
                  <h3>Performance</h3>
                  <div className="info-list">
                    <div><strong>Average Score:</strong> {traineeData.average}%</div>
                    <div><strong>Batch Rank:</strong> {traineeData.batchRank}</div>
                    <div><strong>Group Rank:</strong> {traineeData.groupRank}</div>
                  </div>
                </div>
                <div className="card full">
                  <h3>Skills Assessment</h3>
                  <div className="grid-2">
                    <div>
                      <strong>Strengths</strong>
                      <div className="tags positive">
                        {traineeData.strengths.map(s => <span key={s} className="tag-item">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <strong>Areas to Improve</strong>
                      <div className="tags warning">
                        {traineeData.weakness.map(w => <span key={w} className="tag-item">{w}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Upload Screenshot Modal */}
        {showCompletionModal && selectedCourse && (
          <div className="modal-overlay" onClick={() => setShowCompletionModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Submit Course Completion</h2>
                <button className="close-btn" onClick={() => setShowCompletionModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <h3>{selectedCourse.courseName}</h3>
                <p>Upload a clear screenshot showing your name and course completion.</p>

                <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
                  <Icons.Upload />
                  <p>{screenshotFile ? screenshotFile.name : 'Click to upload screenshot'}</p>
                  <small>JPG, PNG • Max 10MB</small>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files[0] && setScreenshotFile(e.target.files[0])}
                  />
                </div>

                {screenshotFile && (
                  <div className="file-preview">
                    <span>{screenshotFile.name}</span>
                    <button onClick={() => setScreenshotFile(null)}>Remove</button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowCompletionModal(false)}>Cancel</button>
                <button
                  className="btn-primary"
                  disabled={!screenshotFile}
                  onClick={handleSubmitCompletion}
                >
                  Submit for TA Verification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout + visual styles */}
      <style jsx>{`
        :root {
          --bg: #f9fafb;
          --card: #ffffff;
          --text: #1f2937;
          --text-light: #6b7280;
          --border: #e2e8f0;
          --primary: #4f46e5;
          --success: #10b981;
          --warning: #f59e0b;
          --pending: #8b5cf6;
          --sidebar-w: 280px; /* 🔧 sidebar width */
        }

        /* ✅ Prevent page/body scroll; we will scroll only inside panels */
        html, body {
          height: 100%;
          overflow: hidden;
        }

        .dashboard {
          display: block;
          height: 100dvh; /* device viewport height to avoid mobile URL bar jumps */
          background: var(--bg);
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden; /* contain children scroll */
        }

        /* Sidebar fixed; scroll inside the sidebar only */
        .dashboard-sidebar {
          position: fixed;
          inset: 0 auto 0 0; /* top, right, bottom, left */
          width: var(--sidebar-w);
          border-right: 1px solid var(--border);
          background: var(--card);
          z-index: 10;
          height: 100dvh;
          overflow-y: auto; /* ✅ scoped scroll */
          -webkit-overflow-scrolling: touch;
        }

        .main-content {
          margin-left: var(--sidebar-w); /* space for fixed sidebar */
          padding: 2.5rem;
          max-width: 1400px;
          width: calc(100vw - var(--sidebar-w));
          height: 100dvh;
          overflow-y: auto; /* ✅ scoped scroll */
          -webkit-overflow-scrolling: touch;
        }

        /* Page headings */
        .page-title { font-size: 2.125rem; font-weight: 700; color: var(--text); margin-bottom: 0.5rem; }
        .page-subtitle { color: var(--text-light); font-size: 1.125rem; margin-bottom: 2rem; }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .stat-card { background: var(--card); padding: 1.75rem; border-radius: 12px; text-align: center; border: 1px solid var(--border); }
        .stat-value { font-size: 2.8rem; font-weight: 700; color: var(--text); }
        .stat-label { color: var(--text-light); margin-top: 0.5rem; font-size: 1rem; }

        /* Cards & grids */
        .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; margin-bottom: 3rem; }
        .card { background: var(--card); border-radius: 12px; padding: 2rem; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .card h3 { font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--text); }
        .card.full { grid-column: 1 / -1; }

        .courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; }
        .course-card { background: var(--card); border-radius: 12px; padding: 1.75rem; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

        .course-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .course-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text); }

        .platform { color: var(--text-light); margin: 1rem 0; font-size: 0.95rem; }

        .course-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; }
        .btn-primary, .btn-outline, .btn-secondary, .btn-success {
          padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.95rem;
        }
        .btn-primary { background: var(--primary); color: white; }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
        .btn-secondary { background: #f3f4f6; color: var(--text-light); }
        .btn-success { background: var(--success); color: white; }

        /* Tags */
        .tags { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
        .tag-item {
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.95rem;
          background: #e0e7ff;
          color: #4f46e5;
        }
        .tags.positive .tag-item { background: #d1fae5; color: #065f46; }
        .tags.warning .tag-item { background: #fef3c7; color: #92400e; }

        /* Certificates */
        .cert-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .cert-card { display: flex; align-items: center; gap: 1.5rem; background: var(--card); border-radius: 12px; padding: 1.25rem; border: 1px solid var(--border); }
        .cert-card svg { color: var(--success); width: 48px; height: 48px; }

        /* Profile grid */
        .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
        .info-list > div { margin-bottom: 1rem; font-size: 1.05rem; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 12px; width: 90%; max-width: 560px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .close-btn { background: none; border: none; font-size: 1.75rem; color: var(--text-light); cursor: pointer; }
        .modal-body { padding: 2rem; }
        .upload-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 3rem; text-align: center; cursor: pointer; margin: 1.5rem 0; transition: all 0.2s; }
        .upload-zone:hover { border-color: var(--primary); background: #eef2ff; }
        .file-preview { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f0fdf4; border-radius: 8px; margin-top: 1rem; }
        .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc; }

        /* ✅ Responsive: stack sidebar for small widths and restore natural page scroll */
        @media (max-width: 920px) {
          .dashboard-sidebar {
            position: relative;
            width: 100%;
            height: auto;
            inset: auto; /* reset fixed positions */
            border-right: none;
            border-bottom: 1px solid var(--border);
            z-index: 5;
            overflow: visible; /* no internal scroll when stacked */
          }
          .main-content {
            margin-left: 0; /* no offset when sidebar is stacked */
            padding: 1.5rem;
            width: 100%;
            height: calc(100dvh - 1px); /* fill remaining viewport */
            overflow-y: auto; /* scoped scroll for content */
          }
          .dashboard {
            height: 100dvh;
          }
        }

        @media (max-width: 768px) {
          .grid-2, .courses-grid, .cert-grid, .profile-grid, .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

export default DashboardTrainee;
