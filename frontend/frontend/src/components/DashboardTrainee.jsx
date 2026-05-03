
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster, toast } from 'sonner';
import './styles/TraineeDashboard.css';

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
      { courseId: 5386, courseName: "Python E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5386", platform: "Ievolve", status: 'in_progress', progress: 92, screenshot: null, completionSubmitted: false, taVerified: false },
      { courseId: 5835, courseName: "Python- Web Frameworks E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5835", platform: "Ievolve", status: 'pending_verification', progress: 100, screenshot: "python_web_proof.jpg", completionSubmitted: true, taVerified: false },
      { courseId: 3224, courseName: "Java E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/3224", platform: "Ievolve", status: 'completed', progress: 100, screenshot: "java_proof.jpg", completionSubmitted: true, taVerified: true },
      { courseId: 55957, courseName: "Node.js E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/coursedetails/55957", platform: "Ievolve", status: 'in_progress', progress: 65 },
      { courseId: 5630, courseName: "React.js E1 competency", url: "https://ievolveng.ultimatix.net/ievolve/competencydetails/5630", platform: "Ievolve", status: 'pending', progress: 0 }
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
    { id: 1, type: 'course', title: 'Advanced Docker & Kubernetes', description: 'Deep dive into container orchestration', justification: 'Needed for upcoming DevOps projects', urgency: 'high', dateSubmitted: '2025-12-20', status: 'pending' }
  ]);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const newReq = { id: upskillingRequests.length + 1, ...newRequest, dateSubmitted: new Date().toISOString().split('T')[0], status: 'pending' };
    setUpskillingRequests([newReq, ...upskillingRequests]);
    setNewRequest({ type: 'course', title: '', description: '', justification: '', urgency: 'medium' });
    toast.success('Upskilling request submitted successfully!', { description: 'Your TA/Manager will review the request shortly.' });
  };

  const handleSubmitCompletion = () => {
    if (!screenshotFile) { toast.error('Please upload a screenshot as proof of completion.'); return; }
    setTraineeData(prev => ({
      ...prev,
      upskillCourses: prev.upskillCourses.map(c =>
        c.courseId === selectedCourse.courseId ? { ...c, status: 'pending_verification', progress: 100, screenshot: screenshotFile.name, completionSubmitted: true } : c
      )
    }));
    setShowCompletionModal(false); setScreenshotFile(null); setSelectedCourse(null);
    toast.success('Completion proof submitted!', { description: 'Your TA will review and verify it shortly.' });
  };

  const sidebarItems = [
    { id: 'progress', label: 'Progress Overview', icon: <Icons.BarChart /> },
    { id: 'courses', label: 'My Courses', icon: <Icons.BookOpen />, badge: traineeData.upskillCourses.filter(c => c.status === 'pending_verification').length },
    { id: 'certificates', label: 'Certificates', icon: <Icons.Award /> },
    { id: 'profile', label: 'Profile', icon: <Icons.User /> },
  ];

  return (
    <div className="dashboard-page">
      <Toaster position="top-right" richColors expand />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Trainee Dashboard</h1>
        </div>
        <div className="dashboard-content">

          {activeTab === 'progress' && (
            <div className="tab-panel">
              <div className="trainee-welcome-banner">
                <h2>Welcome back, {traineeData.username}!</h2>
                <p>Track your learning journey and grow your skills.</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon"><Icons.BarChart /></div><div className="stat-content"><h3>Average Score</h3><div className="stat-value">{traineeData.average}%</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.CheckCircle /></div><div className="stat-content"><h3>Completed Courses</h3><div className="stat-value">{traineeData.upskillCourses.filter(c => c.status === 'completed' && c.taVerified).length}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.Award /></div><div className="stat-content"><h3>Certificates</h3><div className="stat-value">{traineeData.certificates.length}</div></div></div>
              </div>
              <div className="skill-columns">
                <div className="skill-section-card"><h3>💪 Strengths</h3><div className="skill-pills">{traineeData.strengths.map(s => <span key={s} className="skill-pill strength">{s}</span>)}</div></div>
                <div className="skill-section-card"><h3>📈 Areas to Improve</h3><div className="skill-pills">{traineeData.weakness.map(w => <span key={w} className="skill-pill weakness">{w}</span>)}</div></div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="tab-panel">
              <div className="jobs-grid">
                {traineeData.upskillCourses.map(course => (
                  <div key={course.courseId} className="job-card">
                    <div className="job-card-header">
                      <div>
                        <div className="job-card-title">{course.courseName}</div>
                        <div className="job-card-department">{course.platform}</div>
                      </div>
                      <span className={`badge badge-${course.status === 'completed' ? 'success' : course.status === 'in_progress' ? 'primary' : 'warning'}`}>
                        {course.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="job-card-meta">
                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{marginTop:'0.75rem'}}>
                        <Icons.ExternalLink /> Open Course
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="tab-panel">
              <div className="stats-grid">
                {traineeData.certificates.map((cert, i) => (
                  <div key={i} className="stat-card" style={{textAlign:'left',display:'flex',alignItems:'center',gap:'1rem'}}>
                    <div className="stat-icon" style={{background:'rgba(40,167,69,0.1)',color:'#28a745'}}><Icons.Award /></div>
                    <div>
                      <div style={{fontWeight:700,fontSize:'0.9rem',color:'#1a1a1a'}}>{cert.certificateName}</div>
                      <div style={{fontSize:'0.78rem',color:'#888'}}>{cert.provider}</div>
                      <div style={{fontSize:'0.75rem',color:'#aaa',marginTop:'0.2rem'}}>{new Date(cert.acquiredDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="tab-panel">
              <div className="trainee-overview-grid">
                <div className="stat-card" style={{padding:'2rem'}}>
                  <h3 style={{marginBottom:'1rem',fontWeight:700}}>Personal Details</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',fontSize:'0.9rem'}}>
                    <div><strong>Name:</strong> {traineeData.username}</div>
                    <div><strong>Role:</strong> {traineeData.role}</div>
                    <div><strong>Location:</strong> {traineeData.location}</div>
                    <div><strong>ISU:</strong> {traineeData.isu}</div>
                    <div><strong>DPI:</strong> {traineeData.dpi}</div>
                  </div>
                </div>
                <div className="stat-card" style={{padding:'2rem'}}>
                  <h3 style={{marginBottom:'1rem',fontWeight:700}}>Performance</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',fontSize:'0.9rem'}}>
                    <div><strong>Average Score:</strong> {traineeData.average}%</div>
                    <div><strong>Batch Rank:</strong> {traineeData.batchRank}</div>
                    <div><strong>Group Rank:</strong> {traineeData.groupRank}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showCompletionModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowCompletionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Course Completion</h3>
              <button className="btn-icon" onClick={() => setShowCompletionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{marginBottom:'1rem'}}>{selectedCourse.courseName}</p>
              <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
                <Icons.Upload />
                <h4>{screenshotFile ? screenshotFile.name : 'Click to upload screenshot'}</h4>
                <p>JPG, PNG · Max 10MB</p>
                <input id="file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && setScreenshotFile(e.target.files[0])} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCompletionModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!screenshotFile} onClick={handleSubmitCompletion}>Submit for TA Verification</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTrainee;
