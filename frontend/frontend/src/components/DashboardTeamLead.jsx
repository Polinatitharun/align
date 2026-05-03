import React, { useState } from 'react';
import Sidebar from './Sidebar';
import './styles/TaDashboard.css';

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
    <div className="dashboard-page">
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Team Lead Dashboard</h1>
        </div>
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="tab-panel">
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon"><Icons.Users /></div><div className="stat-content"><h3>Active Trainees</h3><div className="stat-value">{trainees.length}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.BookOpen /></div><div className="stat-content"><h3>Assigned Courses</h3><div className="stat-value">{trainees.reduce((acc, t) => acc + t.upskillCourses.length, 0)}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.CheckCircle /></div><div className="stat-content"><h3>Completed</h3><div className="stat-value">{trainees.reduce((acc, t) => acc + t.upskillCourses.filter(c => c.status === 'completed').length, 0)}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.Award /></div><div className="stat-content"><h3>Certificates</h3><div className="stat-value">{trainees.reduce((acc, t) => acc + t.certificates.length, 0)}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.CheckCircle /></div><div className="stat-content"><h3>Mapped</h3><div className="stat-value">{trainees.filter(t => t.managerStatus === 'approved').length}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><Icons.Clock /></div><div className="stat-content"><h3>Pending Approval</h3><div className="stat-value">{trainees.filter(t => t.managerStatus === 'pending').length}</div></div></div>
              </div>
            </div>
          )}

          {activeTab === 'trainees' && (
            <div className="tab-panel">
              <div className="team-grid">
                {trainees.map(trainee => (
                  <div key={trainee.id} className="team-member-card" onClick={() => setSelectedTrainee(trainee)}>
                    <div className="team-avatar">{trainee.username.charAt(0)}</div>
                    <div className="team-member-name">{trainee.username}</div>
                    <div className="team-member-id">{trainee.role} • {trainee.location}</div>
                    <div className="team-score-pill">Avg: {trainee.average}%</div>
                    <div className="team-member-skills">
                      {trainee.strengths.map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trainee Profile Modal */}
      {selectedTrainee && (
        <div className="modal-overlay" onClick={() => setSelectedTrainee(null)}>
          <div className="modal" style={{maxWidth:'800px',width:'90%'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTrainee.username} — Profile</h3>
              <button className="btn-icon" onClick={() => setSelectedTrainee(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <div><strong>Role:</strong> {selectedTrainee.role}</div>
                <div><strong>Location:</strong> {selectedTrainee.location}</div>
                <div><strong>Average:</strong> {selectedTrainee.average}%</div>
                <div><strong>Batch Rank:</strong> {selectedTrainee.batchRank}</div>
              </div>
              <h4 style={{margin:'1rem 0 0.5rem'}}>Strengths</h4>
              <div className="team-member-skills">{selectedTrainee.strengths.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
              <h4 style={{margin:'1rem 0 0.5rem'}}>Areas to Improve</h4>
              <div className="team-member-skills">{selectedTrainee.weakness.map(w => <span key={w} className="skill-tag" style={{background:'rgba(220,53,69,0.08)',color:'#dc3545'}}>{w}</span>)}</div>
              <h4 style={{margin:'1rem 0 0.5rem'}}>Matching Projects</h4>
              {selectedTrainee.matchingProjects.map((p, i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.6rem 0.75rem',background:'#f8fafc',borderRadius:'8px',marginBottom:'0.4rem'}}>
                  <span>{p.projectName}</span><strong style={{color:'#0070C0'}}>{p.matchScore}%</strong>
                </div>
              ))}
              {selectedTrainee.managerStatus !== 'approved' && selectedTrainee.managerStatus !== 'pending' && (
                <button className="btn btn-primary" style={{marginTop:'1rem',width:'100%'}} onClick={() => setShowRecommendToManager(true)}>Recommend to Manager</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommend to Manager Modal */}
      {showRecommendToManager && selectedTrainee && (
        <div className="modal-overlay" onClick={() => setShowRecommendToManager(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recommend {selectedTrainee.username} to Manager</h3>
              <button className="btn-icon" onClick={() => setShowRecommendToManager(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="form-label">Note to Manager</label>
              <textarea className="form-input" value={managerNote} onChange={e => setManagerNote(e.target.value)} rows="4" placeholder="Enter your recommendation note..." style={{width:'100%',marginTop:'0.5rem'}} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRecommendToManager(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!managerNote} onClick={() => handleRecommendToManager(selectedTrainee.id)}>Submit Recommendation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTeamLead;
