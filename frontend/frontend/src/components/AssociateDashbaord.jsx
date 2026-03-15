// import React, { useState, useEffect } from "react";
// import api from "../api/axios";
// import "./styles/AssociateDashboard.css";
// import { Toaster, toast } from "sonner";
// import {
//   User,
//   Briefcase,
//   GraduationCap,
//   Target,
//   Lightbulb,
//   BookOpen,
//   Map,
//   Award,
//   Clock,
//   CheckCircle,
//   XCircle,
//   ChevronRight,
//   Sparkles,
//   Loader,
// } from "lucide-react";

// function AssociateDashboard({ userData, onLogout }) {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [profile, setProfile] = useState(null);
//   const [jobs, setJobs] = useState([]);
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [suggestion, setSuggestion] = useState("");
//   const [interviewQA, setInterviewQA] = useState(null);
//   const [careerPath, setCareerPath] = useState(null);
//   const [loading, setLoading] = useState({
//     profile: true,
//     jobs: true,
//     suggestion: false,
//     interview: false,
//     career: false,
//   });

//   // Fetch profile and public jobs on mount
//   useEffect(() => {
//     fetchProfile();
//     fetchPublicJobs();
//   }, []);

//   const fetchProfile = async () => {
//     setLoading((prev) => ({ ...prev, profile: true }));
//     try {
//       const response = await api.get("associate/profile/");
//       setProfile(response.data);
//     } catch (err) {
//       toast.error("Failed to load profile");
//     } finally {
//       setLoading((prev) => ({ ...prev, profile: false }));
//     }
//   };

//   const fetchPublicJobs = async () => {
//     setLoading((prev) => ({ ...prev, jobs: true }));
//     try {
//       const response = await api.get("/associate/jobs/public/");
//       setJobs(response.data);
//     } catch (err) {
//       toast.error("Failed to load jobs");
//     } finally {
//       setLoading((prev) => ({ ...prev, jobs: false }));
//     }
//   };

//   const handleGetSuggestion = async (job) => {
//     setSelectedJob(job);
//     setSuggestion("");
//     setLoading((prev) => ({ ...prev, suggestion: true }));
//     try {
//       const response = await api.post("/associate/suggest/", { job_id: job.id });
//       setSuggestion(response.data.suggestion);
//     } catch (err) {
//       toast.error("Failed to generate suggestion");
//     } finally {
//       setLoading((prev) => ({ ...prev, suggestion: false }));
//     }
//   };

//   const handleGetInterviewQA = async (job) => {
//     setSelectedJob(job);
//     setInterviewQA(null);
//     setLoading((prev) => ({ ...prev, interview: true }));
//     try {
//       const response = await api.post("/associate/interview-questions/", {
//         job_id: job.id,
//         levels: ["low", "medium", "high"],
//       });
//       setInterviewQA(response.data);
//     } catch (err) {
//       toast.error("Failed to generate interview questions");
//     } finally {
//       setLoading((prev) => ({ ...prev, interview: false }));
//     }
//   };

//   const handleGetCareerPath = async () => {
//     setLoading((prev) => ({ ...prev, career: true }));
//     try {
//       const response = await api.get("/associate/career-path/");
//       setCareerPath(response.data);
//       setActiveTab("career");
//     } catch (err) {
//       toast.error("Failed to generate career path");
//     } finally {
//       setLoading((prev) => ({ ...prev, career: false }));
//     }
//   };

//   // Helper to render strength/weakness chips
//   const renderSkillChips = (items, type) => {
//     const color = type === "strength" ? "green" : "red";
//     return items.map((item, idx) => (
//       <span key={idx} className={`skill-chip ${color}`}>
//         {item.courseName} {item.avgScore ? `(${item.avgScore}%)` : ""}
//       </span>
//     ));
//   };

//   // Profile Overview Card
//   const renderProfileCard = () => {
//     if (loading.profile) return <div className="loading-spinner">Loading profile...</div>;
//     if (!profile) return <div>No profile data</div>;

//     const userInfo = profile.userInfo || {};
//     return (
//       <div className="profile-card">
//         <div className="profile-header">
//           <div className="profile-avatar">{userInfo.name?.charAt(0) || "U"}</div>
//           <div className="profile-title">
//             <h2>{userInfo.name || "Unknown"}</h2>
//             <p>
//               <User size={14} /> {userInfo.userId} • {userInfo.location || "Location not set"}
//             </p>
//           </div>
//         </div>
//         <div className="profile-details">
//           <div className="detail-item">
//             <GraduationCap size={18} />
//             <span>Average Score: {userInfo.averageScore || "N/A"}%</span>
//           </div>
//           <div className="detail-item">
//             <Award size={18} />
//             <span>Rank: {profile.batchRank || "N/A"}</span>
//           </div>
//           <div className="detail-item">
//             <Clock size={18} />
//             <span>Joined: {profile.created_at?.split("T")[0]}</span>
//           </div>
//         </div>
//         <div className="profile-skills">
//           <div className="skill-section">
//             <h4>Strengths</h4>
//             <div className="skill-list">
//               {profile.strengths?.length > 0
//                 ? renderSkillChips(profile.strengths, "strength")
//                 : "No strengths recorded"}
//             </div>
//           </div>
//           <div className="skill-section">
//             <h4>Weaknesses / Areas to Improve</h4>
//             <div className="skill-list">
//               {profile.weaknesses?.length > 0
//                 ? renderSkillChips(profile.weaknesses, "weakness")
//                 : "No weaknesses recorded"}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Job Listings Card
//   const renderJobsList = () => {
//     if (loading.jobs) return <div className="loading-spinner">Loading jobs...</div>;
//     if (!jobs.length) return <div>No public jobs available at the moment.</div>;

//     return (
//       <div className="jobs-list">
//         {jobs.map((job) => (
//           <div key={job.id} className="job-card">
//             <div className="job-header">
//               <h3>{job.title}</h3>
//               <span className={`job-status ${job.status}`}>{job.status}</span>
//             </div>
//             <div className="job-meta">
//               <span>
//                 <Briefcase size={14} /> {job.department}
//               </span>
//               <span>
//                 <Map size={14} /> {job.location?.join(", ")}
//               </span>
//               <span>
//                 <Target size={14} /> Openings: {job.openings}
//               </span>
//             </div>
//             <div className="job-skills">
//               <strong>Tech:</strong> {job.techSkills?.join(", ")}
//             </div>
//             <div className="job-actions">
//               <button
//                 className="btn-suggestion"
//                 onClick={() => handleGetSuggestion(job)}
//                 disabled={loading.suggestion && selectedJob?.id === job.id}
//               >
//                 <Lightbulb size={16} /> Suggestion
//               </button>
//               <button
//                 className="btn-interview"
//                 onClick={() => handleGetInterviewQA(job)}
//                 disabled={loading.interview && selectedJob?.id === job.id}
//               >
//                 <BookOpen size={16} /> Interview Q&A
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // Suggestion Display
//   const renderSuggestion = () => {
//     if (!selectedJob) return null;
//     if (loading.suggestion) return <div className="loading-spinner">Generating suggestion...</div>;
//     if (!suggestion) return null;

//     return (
//       <div className="suggestion-card">
//         <h3>
//           <Sparkles size={20} /> AI Suggestion for {selectedJob.title}
//         </h3>
//         <p>{suggestion}</p>
//       </div>
//     );
//   };

//   // Interview Q&A Display
//   const renderInterviewQA = () => {
//     if (!selectedJob || !interviewQA) return null;
//     if (loading.interview) return <div className="loading-spinner">Generating questions...</div>;

//     return (
//       <div className="interview-qa-card">
//         <h3>Interview Questions & Answers for {selectedJob.title}</h3>
//         {["low", "medium", "high"].map((level) => (
//           <div key={level} className="qa-level">
//             <h4>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h4>
//             {interviewQA[level]?.map((item, idx) => (
//               <div key={idx} className="qa-item">
//                 <p className="question">Q{idx + 1}: {item.question}</p>
//                 <p className="answer">A: {item.answer}</p>
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // Career Path Display
//   const renderCareerPath = () => {
//     if (loading.career) return <div className="loading-spinner">Generating career path...</div>;
//     if (!careerPath) return null;

//     return (
//       <div className="career-path-card">
//         <h2>Your Personalized Career Roadmap</h2>
//         <div className="path-section">
//           <h3>Short Term (1-2 years)</h3>
//           <div className="path-roles">
//             <strong>Roles:</strong> {careerPath.short_term?.roles?.join(" → ")}
//           </div>
//           <div className="path-skills">
//             <strong>Skills to develop:</strong> {careerPath.short_term?.skills_to_develop?.join(", ")}
//           </div>
//           {careerPath.short_term?.certifications?.length > 0 && (
//             <div className="path-certs">
//               <strong>Certifications:</strong> {careerPath.short_term.certifications.join(", ")}
//             </div>
//           )}
//           <p className="path-advice">{careerPath.short_term?.advice}</p>
//         </div>

//         <div className="path-section">
//           <h3>Long Term (3-5 years)</h3>
//           <div className="path-roles">
//             <strong>Roles:</strong> {careerPath.long_term?.roles?.join(" → ")}
//           </div>
//           <div className="path-skills">
//             <strong>Skills to develop:</strong> {careerPath.long_term?.skills_to_develop?.join(", ")}
//           </div>
//           {careerPath.long_term?.certifications?.length > 0 && (
//             <div className="path-certs">
//               <strong>Certifications:</strong> {careerPath.long_term.certifications.join(", ")}
//             </div>
//           )}
//           <p className="path-advice">{careerPath.long_term?.advice}</p>
//         </div>

//         <div className="path-overall">
//           <h3>Overall Advice</h3>
//           <p>{careerPath.overall_advice}</p>
//         </div>
//       </div>
//     );
//   };

//   // Tab content
//   const renderOverview = () => (
//     <div className="tab-content overview-tab">
//       <div className="grid-2col">
//         <div className="left-col">{renderProfileCard()}</div>
//         <div className="right-col">
//           <div className="section-header">
//             <h3>Public Job Opportunities</h3>
//             <button className="btn-career" onClick={handleGetCareerPath}>
//               <Map size={16} /> Get Career Path
//             </button>
//           </div>
//           {renderJobsList()}
//         </div>
//       </div>
//       {renderSuggestion()}
//       {renderInterviewQA()}
//     </div>
//   );

//   const renderCareerTab = () => (
//     <div className="tab-content career-tab">
//       {renderCareerPath()}
//       {!careerPath && !loading.career && (
//         <div className="placeholder">
//           <p>Click "Get Career Path" in the Overview tab to generate your roadmap.</p>
//         </div>
//       )}
//     </div>
//   );

//   const sidebarItems = [
//     { id: "overview", label: "Overview", icon: <User size={18} /> },
//     { id: "career", label: "Career Path", icon: <Map size={18} /> },
//   ];

//   return (
//     <div className="associate-dashboard">
//       <Toaster richColors position="top-right" duration={3000} />

//       {/* Sidebar */}
//       <div className="assoc-sidebar">
//         <div className="assoc-sidebar-header">
//           <h2>Associate Portal</h2>
//           <p>Welcome, {userData?.username}</p>
//         </div>
//         <div className="assoc-sidebar-nav">
//           {sidebarItems.map((item) => (
//             <div
//               key={item.id}
//               className={`assoc-nav-item ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => setActiveTab(item.id)}
//             >
//               <span className="nav-icon">{item.icon}</span>
//               <span className="nav-label">{item.label}</span>
//             </div>
//           ))}
//           <div className="assoc-footer">
//             <button className="logout-btn" onClick={onLogout}>
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="assoc-main-content">
//         <div className="assoc-dashboard-header">
//           <h1>Associate Dashboard</h1>
//         </div>
//         {activeTab === "overview" && renderOverview()}
//         {activeTab === "career" && renderCareerTab()}
//       </div>
//     </div>
//   );
// }

// export default AssociateDashboard;



// import React, { useState, useEffect } from "react";
// import api from "../api/axios";
// import "./styles/AssociateDashboard.css";
// import { Toaster, toast } from "sonner";
// import {
//   User,
//   Briefcase,
//   GraduationCap,
//   Target,
//   Lightbulb,
//   BookOpen,
//   Map,
//   Award,
//   Clock,
//   CheckCircle,
//   XCircle,
//   ChevronRight,
//   Sparkles,
//   Loader,
//   TrendingUp,
//   Users,
//   PieChart,
//   BarChart,
// } from "lucide-react";

// function AssociateDashboard({ userData, onLogout }) {
//   const [activeTab, setActiveTab] = useState("overview");
  
//   // Profile data
//   const [profile, setProfile] = useState(null);
  
//   // Jobs data
//   const [jobs, setJobs] = useState([]);
//   const [selectedJob, setSelectedJob] = useState(null);
  
//   // AI generated data
//   const [suggestion, setSuggestion] = useState("");
//   const [interviewQA, setInterviewQA] = useState(null);
//   const [careerPath, setCareerPath] = useState(null);
  
//   // New dashboard insights
//   const [skillGaps, setSkillGaps] = useState([]);
//   const [similarProjects, setSimilarProjects] = useState([]);
//   const [peerComparison, setPeerComparison] = useState(null);
//   const [dashboardAdvice, setDashboardAdvice] = useState("");
  
//   // Loading states
//   const [loading, setLoading] = useState({
//     profile: true,
//     jobs: true,
//     suggestion: false,
//     interview: false,
//     career: false,
//     dashboard: true,
//     peer: true,
//   });

//   // Fetch profile, jobs, dashboard insights, and peer comparison on mount
//   useEffect(() => {
//     fetchProfile();
//     fetchPublicJobs();
//     fetchDashboardData();
//     fetchPeerComparison();
//   }, []);

//   const fetchProfile = async () => {
//     setLoading(prev => ({ ...prev, profile: true }));
//     try {
//       const response = await api.get("associate/profile/");
//       setProfile(response.data);
//     } catch (err) {
//       toast.error("Failed to load profile");
//     } finally {
//       setLoading(prev => ({ ...prev, profile: false }));
//     }
//   };

//   const fetchPublicJobs = async () => {
//     setLoading(prev => ({ ...prev, jobs: true }));
//     try {
//       const response = await api.get("/associate/jobs/public/");
//       setJobs(response.data);
//     } catch (err) {
//       toast.error("Failed to load jobs");
//     } finally {
//       setLoading(prev => ({ ...prev, jobs: false }));
//     }
//   };

//   // New: Fetch dashboard insights (skill gaps, similar projects, advice)
//   const fetchDashboardData = async () => {
//     setLoading(prev => ({ ...prev, dashboard: true }));
//     try {
//       const response = await api.get("/associate/dashboard/");
//       setSkillGaps(response.data.skill_gaps || []);
//       setSimilarProjects(response.data.similar_projects || []);
//       setDashboardAdvice(response.data.advice || "");
//     } catch (err) {
//       toast.error("Failed to load dashboard insights");
//     } finally {
//       setLoading(prev => ({ ...prev, dashboard: false }));
//     }
//   };

//   // New: Fetch peer comparison
//   const fetchPeerComparison = async () => {
//     setLoading(prev => ({ ...prev, peer: true }));
//     try {
//       const response = await api.get("/associate/peer-comparison/");
//       setPeerComparison(response.data);
//     } catch (err) {
//       // Silent fail – maybe not in a batch
//       console.log("Peer comparison not available");
//     } finally {
//       setLoading(prev => ({ ...prev, peer: false }));
//     }
//   };

//   const handleGetSuggestion = async (job) => {
//     setSelectedJob(job);
//     setSuggestion("");
//     setLoading(prev => ({ ...prev, suggestion: true }));
//     try {
//       const response = await api.post("/associate/suggest/", { job_id: job.id });
//       setSuggestion(response.data.suggestion);
//     } catch (err) {
//       toast.error("Failed to generate suggestion");
//     } finally {
//       setLoading(prev => ({ ...prev, suggestion: false }));
//     }
//   };

//   const handleGetInterviewQA = async (job) => {
//     setSelectedJob(job);
//     setInterviewQA(null);
//     setLoading(prev => ({ ...prev, interview: true }));
//     try {
//       const response = await api.post("/associate/interview-questions/", {
//         job_id: job.id,
//         levels: ["low", "medium", "high"],
//       });
//       setInterviewQA(response.data);
//     } catch (err) {
//       toast.error("Failed to generate interview questions");
//     } finally {
//       setLoading(prev => ({ ...prev, interview: false }));
//     }
//   };

//   const handleGetCareerPath = async () => {
//     setLoading(prev => ({ ...prev, career: true }));
//     try {
//       const response = await api.get("/associate/career-path/");
//       setCareerPath(response.data);
//       setActiveTab("career");
//     } catch (err) {
//       toast.error("Failed to generate career path");
//     } finally {
//       setLoading(prev => ({ ...prev, career: false }));
//     }
//   };

//   // Helper to render strength/weakness chips
//   const renderSkillChips = (items, type) => {
//     const color = type === "strength" ? "green" : "red";
//     return items.map((item, idx) => (
//       <span key={idx} className={`skill-chip ${color}`}>
//         {item.courseName} {item.avgScore ? `(${item.avgScore}%)` : ""}
//       </span>
//     ));
//   };

//   // Profile Overview Card
//   const renderProfileCard = () => {
//     if (loading.profile) return <div className="loading-spinner">Loading profile...</div>;
//     if (!profile) return <div>No profile data</div>;

//     const userInfo = profile.userInfo || {};
//     return (
//       <div className="profile-card">
//         <div className="profile-header">
//           <div className="profile-avatar">{userInfo.name?.charAt(0) || "U"}</div>
//           <div className="profile-title">
//             <h2>{userInfo.name || "Unknown"}</h2>
//             <p>
//               <User size={14} /> {userInfo.userId} • {userInfo.location || "Location not set"}
//             </p>
//           </div>
//         </div>
//         <div className="profile-details">
//           <div className="detail-item">
//             <GraduationCap size={18} />
//             <span>Average Score: {userInfo.averageScore || "N/A"}%</span>
//           </div>
//           <div className="detail-item">
//             <Award size={18} />
//             <span>Rank: {profile.batchRank || "N/A"}</span>
//           </div>
//           <div className="detail-item">
//             <Clock size={18} />
//             <span>Joined: {profile.created_at?.split("T")[0]}</span>
//           </div>
//         </div>
//         <div className="profile-skills">
//           <div className="skill-section">
//             <h4>Strengths</h4>
//             <div className="skill-list">
//               {profile.strengths?.length > 0
//                 ? renderSkillChips(profile.strengths, "strength")
//                 : "No strengths recorded"}
//             </div>
//           </div>
//           <div className="skill-section">
//             <h4>Weaknesses / Areas to Improve</h4>
//             <div className="skill-list">
//               {profile.weaknesses?.length > 0
//                 ? renderSkillChips(profile.weaknesses, "weakness")
//                 : "No weaknesses recorded"}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Peer Comparison Card (new)
//   const renderPeerComparison = () => {
//     if (loading.peer) return <div className="loading-spinner">Loading peer data...</div>;
//     if (!peerComparison) return null;

//     return (
//       <div className="peer-card">
//         <h3><Users size={20} /> Peer Comparison</h3>
//         <div className="peer-stats">
//           <div className="peer-stat">
//             <span className="stat-label">Batch</span>
//             <span className="stat-value">{peerComparison.batch}</span>
//           </div>
//           <div className="peer-stat">
//             <span className="stat-label">Your Rank</span>
//             <span className="stat-value">{peerComparison.your_rank} / {peerComparison.total_in_batch}</span>
//           </div>
//           <div className="peer-stat">
//             <span className="stat-label">Top Percentile</span>
//             <span className="stat-value">{peerComparison.top_percentile}%</span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Skill Gap Analysis (new)
//   const renderSkillGaps = () => {
//     if (loading.dashboard) return <div className="loading-spinner">Loading insights...</div>;
//     if (!skillGaps.length) return null;

//     return (
//       <div className="skill-gaps-card">
//         <h3><Target size={20} /> Skill Gap Analysis</h3>
//         <p className="insight-advice">{dashboardAdvice}</p>
//         <div className="gaps-list">
//           {skillGaps.map((gap, idx) => (
//             <div key={idx} className="gap-item">
//               <div className="gap-header">
//                 <span className="job-title">{gap.job_title}</span>
//                 <span className={`match-percent ${gap.has_all_skills ? 'full' : 'partial'}`}>
//                   {gap.match_percentage}% Match
//                 </span>
//               </div>
//               {!gap.has_all_skills && (
//                 <div className="missing-skills">
//                   <strong>Missing skills:</strong> {gap.missing_skills.join(", ")}
//                 </div>
//               )}
//               {gap.has_all_skills && (
//                 <div className="full-match">✅ You have all required skills!</div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Similar Projects (new)
//   const renderSimilarProjects = () => {
//     if (loading.dashboard) return null;
//     if (!similarProjects.length) return null;

//     return (
//       <div className="similar-projects-card">
//         <h3><TrendingUp size={20} /> People with Your Strengths Were Selected For</h3>
//         <div className="project-list">
//           {similarProjects.map((project) => (
//             <div key={project.id} className="project-item">
//               <h4>{project.title}</h4>
//               <p><Briefcase size={14} /> {project.department}</p>
//               <p><Map size={14} /> {project.location?.join(", ")}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Job Listings Card (existing)
//   const renderJobsList = () => {
//     if (loading.jobs) return <div className="loading-spinner">Loading jobs...</div>;
//     if (!jobs.length) return <div>No public jobs available at the moment.</div>;

//     return (
//       <div className="jobs-list">
//         {jobs.map((job) => (
//           <div key={job.id} className="job-card">
//             <div className="job-header">
//               <h3>{job.title}</h3>
//               <span className={`job-status ${job.status}`}>{job.status}</span>
//             </div>
//             <div className="job-meta">
//               <span>
//                 <Briefcase size={14} /> {job.department}
//               </span>
//               <span>
//                 <Map size={14} /> {job.location?.join(", ")}
//               </span>
//               <span>
//                 <Target size={14} /> Openings: {job.openings}
//               </span>
//             </div>
//             <div className="job-skills">
//               <strong>Tech:</strong> {job.techSkills?.join(", ")}
//             </div>
//             <div className="job-actions">
//               <button
//                 className="btn-suggestion"
//                 onClick={() => handleGetSuggestion(job)}
//                 disabled={loading.suggestion && selectedJob?.id === job.id}
//               >
//                 <Lightbulb size={16} /> Suggestion
//               </button>
//               <button
//                 className="btn-interview"
//                 onClick={() => handleGetInterviewQA(job)}
//                 disabled={loading.interview && selectedJob?.id === job.id}
//               >
//                 <BookOpen size={16} /> Interview Q&A
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // Suggestion Display (existing)
//   const renderSuggestion = () => {
//     if (!selectedJob) return null;
//     if (loading.suggestion) return <div className="loading-spinner">Generating suggestion...</div>;
//     if (!suggestion) return null;

//     return (
//       <div className="suggestion-card">
//         <h3>
//           <Sparkles size={20} /> AI Suggestion for {selectedJob.title}
//         </h3>
//         <p>{suggestion}</p>
//       </div>
//     );
//   };

//   // Interview Q&A Display (existing)
//   const renderInterviewQA = () => {
//     if (!selectedJob || !interviewQA) return null;
//     if (loading.interview) return <div className="loading-spinner">Generating questions...</div>;

//     return (
//       <div className="interview-qa-card">
//         <h3>Interview Questions & Answers for {selectedJob.title}</h3>
//         {["low", "medium", "high"].map((level) => (
//           <div key={level} className="qa-level">
//             <h4>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h4>
//             {interviewQA[level]?.map((item, idx) => (
//               <div key={idx} className="qa-item">
//                 <p className="question">Q{idx + 1}: {item.question}</p>
//                 <p className="answer">A: {item.answer}</p>
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // Career Path Display (existing)
//   const renderCareerPath = () => {
//     if (loading.career) return <div className="loading-spinner">Generating career path...</div>;
//     if (!careerPath) return null;

//     return (
//       <div className="career-path-card">
//         <h2>Your Personalized Career Roadmap</h2>
//         <div className="path-section">
//           <h3>Short Term (1-2 years)</h3>
//           <div className="path-roles">
//             <strong>Roles:</strong> {careerPath.short_term?.roles?.join(" → ")}
//           </div>
//           <div className="path-skills">
//             <strong>Skills to develop:</strong> {careerPath.short_term?.skills_to_develop?.join(", ")}
//           </div>
//           {careerPath.short_term?.certifications?.length > 0 && (
//             <div className="path-certs">
//               <strong>Certifications:</strong> {careerPath.short_term.certifications.join(", ")}
//             </div>
//           )}
//           <p className="path-advice">{careerPath.short_term?.advice}</p>
//         </div>

//         <div className="path-section">
//           <h3>Long Term (3-5 years)</h3>
//           <div className="path-roles">
//             <strong>Roles:</strong> {careerPath.long_term?.roles?.join(" → ")}
//           </div>
//           <div className="path-skills">
//             <strong>Skills to develop:</strong> {careerPath.long_term?.skills_to_develop?.join(", ")}
//           </div>
//           {careerPath.long_term?.certifications?.length > 0 && (
//             <div className="path-certs">
//               <strong>Certifications:</strong> {careerPath.long_term.certifications.join(", ")}
//             </div>
//           )}
//           <p className="path-advice">{careerPath.long_term?.advice}</p>
//         </div>

//         <div className="path-overall">
//           <h3>Overall Advice</h3>
//           <p>{careerPath.overall_advice}</p>
//         </div>
//       </div>
//     );
//   };

//   // Overview tab with all sections
//   const renderOverview = () => (
//     <div className="tab-content overview-tab">
//       {/* Top row: Profile + Peer Comparison */}
//       <div className="grid-2col">
//         <div className="left-col">{renderProfileCard()}</div>
//         <div className="right-col">{renderPeerComparison()}</div>
//       </div>

//       {/* Middle row: Skill Gaps & Similar Projects side by side */}
//       <div className="grid-2col">
//         <div className="left-col">{renderSkillGaps()}</div>
//         <div className="right-col">{renderSimilarProjects()}</div>
//       </div>

//       {/* Career Path button and Job listings */}
//       <div className="section-header">
//         <h3>Public Job Opportunities</h3>
//         <button className="btn-career" onClick={handleGetCareerPath}>
//           <Map size={16} /> Get Career Path
//         </button>
//       </div>
//       {renderJobsList()}

//       {/* AI Suggestions */}
//       {renderSuggestion()}
//       {renderInterviewQA()}
//     </div>
//   );

//   const renderCareerTab = () => (
//     <div className="tab-content career-tab">
//       {renderCareerPath()}
//       {!careerPath && !loading.career && (
//         <div className="placeholder">
//           <p>Click "Get Career Path" in the Overview tab to generate your roadmap.</p>
//         </div>
//       )}
//     </div>
//   );

//   const sidebarItems = [
//     { id: "overview", label: "Overview", icon: <User size={18} /> },
//     { id: "career", label: "Career Path", icon: <Map size={18} /> },
//   ];

//   return (
//     <div className="associate-dashboard">
//       <Toaster richColors position="top-right" duration={3000} />

//       {/* Sidebar */}
//       <div className="assoc-sidebar">
//         <div className="assoc-sidebar-header">
//           <h2>Associate Portal</h2>
//           <p>Welcome, {userData?.username}</p>
//         </div>
//         <div className="assoc-sidebar-nav">
//           {sidebarItems.map((item) => (
//             <div
//               key={item.id}
//               className={`assoc-nav-item ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => setActiveTab(item.id)}
//             >
//               <span className="nav-icon">{item.icon}</span>
//               <span className="nav-label">{item.label}</span>
//             </div>
//           ))}
//           <div className="assoc-footer">
//             <button className="logout-btn" onClick={onLogout}>
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="assoc-main-content">
//         <div className="assoc-dashboard-header">
//           <h1>Associate Dashboard</h1>
//         </div>
//         {activeTab === "overview" && renderOverview()}
//         {activeTab === "career" && renderCareerTab()}
//       </div>
//     </div>
//   );
// }

// export default AssociateDashboard;




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
  BookOpen,
  Map,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Sparkles,
  Loader,
  TrendingUp,
  Users,
  PieChart,
  BarChart,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";

function AssociateDashboard({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Profile data (real)
  const [profile, setProfile] = useState(null);
  
  // Jobs data (real)
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // AI generated data (real)
  const [suggestion, setSuggestion] = useState("");
  const [interviewQA, setInterviewQA] = useState(null);
  const [careerPath, setCareerPath] = useState(null);
  
  // Dashboard insights from backend (real)
  const [skillGaps, setSkillGaps] = useState([]);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [peerComparison, setPeerComparison] = useState(null);
  const [dashboardAdvice, setDashboardAdvice] = useState("");
  
  // Mock learning path (will be replaced with real API later)
  const [learningPath, setLearningPath] = useState([
    { id: 1, course: "Advanced React", provider: "Coursera", duration: "4 weeks", progress: 0, url: "#" },
    { id: 2, course: "Python for Data Science", provider: "edX", duration: "6 weeks", progress: 0, url: "#" },
    { id: 3, course: "AWS Certified Developer", provider: "Udemy", duration: "8 weeks", progress: 0, url: "#" },
  ]);

  // Loading states
  const [loading, setLoading] = useState({
    profile: true,
    jobs: true,
    suggestion: false,
    interview: false,
    career: false,
    dashboard: true,
    peer: true,
  });

  useEffect(() => {
    fetchProfile();
    fetchPublicJobs();
    fetchDashboardData();
    fetchPeerComparison();
  }, []);

  const fetchProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const response = await api.get("associate/profile/");
      setProfile(response.data);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchPublicJobs = async () => {
    setLoading(prev => ({ ...prev, jobs: true }));
    try {
      const response = await api.get("/associate/jobs/public/");
      setJobs(response.data);
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  };

  const fetchDashboardData = async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const response = await api.get("/associate/dashboard/");
      setSkillGaps(response.data.skill_gaps || []);
      setSimilarProjects(response.data.similar_projects || []);
      setDashboardAdvice(response.data.advice || "");
    } catch (err) {
      toast.error("Failed to load dashboard insights");
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  const fetchPeerComparison = async () => {
    setLoading(prev => ({ ...prev, peer: true }));
    try {
      const response = await api.get("/associate/peer-comparison/");
      setPeerComparison(response.data);
    } catch (err) {
      console.log("Peer comparison not available");
    } finally {
      setLoading(prev => ({ ...prev, peer: false }));
    }
  };

  const handleGetSuggestion = async (job) => {
    setSelectedJob(job);
    setSuggestion("");
    setLoading(prev => ({ ...prev, suggestion: true }));
    try {
      const response = await api.post("/associate/suggest/", { job_id: job.id });
      setSuggestion(response.data.suggestion);
    } catch (err) {
      toast.error("Failed to generate suggestion");
    } finally {
      setLoading(prev => ({ ...prev, suggestion: false }));
    }
  };

  const handleGetInterviewQA = async (job) => {
    setSelectedJob(job);
    setInterviewQA(null);
    setLoading(prev => ({ ...prev, interview: true }));
    try {
      const response = await api.post("/associate/interview-questions/", {
        job_id: job.id,
        levels: ["low", "medium", "high"],
      });
      setInterviewQA(response.data);
    } catch (err) {
      toast.error("Failed to generate interview questions");
    } finally {
      setLoading(prev => ({ ...prev, interview: false }));
    }
  };

  const handleGetCareerPath = async () => {
    setLoading(prev => ({ ...prev, career: true }));
    try {
      const response = await api.get("/associate/career-path/");
      setCareerPath(response.data);
      setActiveTab("career");
    } catch (err) {
      toast.error("Failed to generate career path");
    } finally {
      setLoading(prev => ({ ...prev, career: false }));
    }
  };

  // Helper to render strength/weakness chips
  const renderSkillChips = (items, type) => {
    const color = type === "strength" ? "green" : "red";
    return items.map((item, idx) => (
      <span key={idx} className={`skill-chip ${color}`}>
        {item.courseName} {item.avgScore ? `(${item.avgScore}%)` : ""}
      </span>
    ));
  };

  // Profile Overview Card
  const renderProfileCard = () => {
    if (loading.profile) return <div className="loading-spinner">Loading profile...</div>;
    if (!profile) return <div>No profile data</div>;

    const userInfo = profile.userInfo || {};
    return (
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{userInfo.name?.charAt(0) || "U"}</div>
          <div className="profile-title">
            <h2>{userInfo.name || "Unknown"}</h2>
            <p>
              <User size={14} /> {userInfo.userId} • {userInfo.location || "Location not set"}
            </p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-item">
            <GraduationCap size={18} />
            <span>Average Score: {userInfo.averageScore || "N/A"}%</span>
          </div>
          <div className="detail-item">
            <Award size={18} />
            <span>Rank: {profile.batchRank || "N/A"}</span>
          </div>
          <div className="detail-item">
            <Clock size={18} />
            <span>Joined: {profile.created_at?.split("T")[0]}</span>
          </div>
        </div>
        <div className="profile-skills">
          <div className="skill-section">
            <h4>Strengths</h4>
            <div className="skill-list">
              {profile.strengths?.length > 0
                ? renderSkillChips(profile.strengths, "strength")
                : "No strengths recorded"}
            </div>
          </div>
          <div className="skill-section">
            <h4>Weaknesses / Areas to Improve</h4>
            <div className="skill-list">
              {profile.weaknesses?.length > 0
                ? renderSkillChips(profile.weaknesses, "weakness")
                : "No weaknesses recorded"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Peer Comparison Card
  const renderPeerComparison = () => {
    if (loading.peer) return <div className="loading-spinner">Loading peer data...</div>;
    if (!peerComparison) return null;

    return (
      <div className="peer-card">
        <h3><Users size={20} /> Peer Comparison</h3>
        <div className="peer-stats">
          <div className="peer-stat">
            <span className="stat-label">Batch</span>
            <span className="stat-value">{peerComparison.batch}</span>
          </div>
          <div className="peer-stat">
            <span className="stat-label">Your Rank</span>
            <span className="stat-value">{peerComparison.your_rank} / {peerComparison.total_in_batch}</span>
          </div>
          <div className="peer-stat">
            <span className="stat-label">Top Percentile</span>
            <span className="stat-value">{peerComparison.top_percentile}%</span>
          </div>
        </div>
      </div>
    );
  };

  // Skill Gap Analysis
  const renderSkillGaps = () => {
    if (loading.dashboard) return <div className="loading-spinner">Loading insights...</div>;
    if (!skillGaps.length) return null;

    return (
      <div className="skill-gaps-card">
        <h3><Target size={20} /> Skill Gap Analysis</h3>
        <p className="insight-advice">{dashboardAdvice}</p>
        <div className="gaps-list">
          {skillGaps.map((gap, idx) => (
            <div key={idx} className="gap-item">
              <div className="gap-header">
                <span className="job-title">{gap.job_title}</span>
                <span className={`match-percent ${gap.has_all_skills ? 'full' : 'partial'}`}>
                  {gap.match_percentage}% Match
                </span>
              </div>
              {!gap.has_all_skills && (
                <div className="missing-skills">
                  <strong>Missing skills:</strong> {gap.missing_skills.join(", ")}
                </div>
              )}
              {gap.has_all_skills && (
                <div className="full-match">✅ You have all required skills!</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Similar Projects (people with your strengths were selected)
  const renderSimilarProjects = () => {
    if (loading.dashboard) return null;
    if (!similarProjects.length) return null;

    return (
      <div className="similar-projects-card">
        <h3><TrendingUp size={20} /> People with Your Strengths Were Selected For</h3>
        <div className="project-list">
          {similarProjects.map((project) => (
            <div key={project.id} className="project-item">
              <h4>{project.title}</h4>
              <p><Briefcase size={14} /> {project.department}</p>
              <p><Map size={14} /> {project.location?.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Learning Path (mock – will be replaced with real data)
  const renderLearningPath = () => (
    <div className="learning-path-card">
      <h3><BookOpen size={20} /> Recommended Learning Path</h3>
      <p>Based on your skill gaps, consider these courses (example suggestions):</p>
      <div className="course-list">
        {learningPath.map(course => (
          <div key={course.id} className="course-item">
            <div className="course-header">
              <h4>{course.course}</h4>
              <span className="course-provider">{course.provider}</span>
            </div>
            <div className="course-meta">
              <span><Clock size={14} /> {course.duration}</span>
              <a href={course.url} target="_blank" rel="noopener noreferrer" className="course-link">
                <LinkIcon size={14} /> Explore
              </a>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
            </div>
            <span className="progress-text">{course.progress}% complete</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Job Listings (public jobs)
  const renderJobsList = () => {
    if (loading.jobs) return <div className="loading-spinner">Loading jobs...</div>;
    if (!jobs.length) return <div>No public jobs available at the moment.</div>;

    return (
      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <span className={`job-status ${job.status}`}>{job.status}</span>
            </div>
            <div className="job-meta">
              <span>
                <Briefcase size={14} /> {job.department}
              </span>
              <span>
                <Map size={14} /> {job.location?.join(", ")}
              </span>
              <span>
                <Target size={14} /> Openings: {job.openings}
              </span>
            </div>
            <div className="job-skills">
              <strong>Tech:</strong> {job.techSkills?.join(", ")}
            </div>
            <div className="job-actions">
              <button
                className="btn-suggestion"
                onClick={() => handleGetSuggestion(job)}
                disabled={loading.suggestion && selectedJob?.id === job.id}
              >
                <Lightbulb size={16} /> Suggestion
              </button>
              <button
                className="btn-interview"
                onClick={() => handleGetInterviewQA(job)}
                disabled={loading.interview && selectedJob?.id === job.id}
              >
                <BookOpen size={16} /> Interview Q&A
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Suggestion Display
  const renderSuggestion = () => {
    if (!selectedJob) return null;
    if (loading.suggestion) return <div className="loading-spinner">Generating suggestion...</div>;
    if (!suggestion) return null;

    return (
      <div className="suggestion-card">
        <h3>
          <Sparkles size={20} /> AI Suggestion for {selectedJob.title}
        </h3>
        <p>{suggestion}</p>
      </div>
    );
  };

  // Interview Q&A Display
  const renderInterviewQA = () => {
    if (!selectedJob || !interviewQA) return null;
    if (loading.interview) return <div className="loading-spinner">Generating questions...</div>;

    return (
      <div className="interview-qa-card">
        <h3>Interview Questions & Answers for {selectedJob.title}</h3>
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
          <div className="path-roles">
            <strong>Roles:</strong> {careerPath.short_term?.roles?.join(" → ")}
          </div>
          <div className="path-skills">
            <strong>Skills to develop:</strong> {careerPath.short_term?.skills_to_develop?.join(", ")}
          </div>
          {careerPath.short_term?.certifications?.length > 0 && (
            <div className="path-certs">
              <strong>Certifications:</strong> {careerPath.short_term.certifications.join(", ")}
            </div>
          )}
          <p className="path-advice">{careerPath.short_term?.advice}</p>
        </div>

        <div className="path-section">
          <h3>Long Term (3-5 years)</h3>
          <div className="path-roles">
            <strong>Roles:</strong> {careerPath.long_term?.roles?.join(" → ")}
          </div>
          <div className="path-skills">
            <strong>Skills to develop:</strong> {careerPath.long_term?.skills_to_develop?.join(", ")}
          </div>
          {careerPath.long_term?.certifications?.length > 0 && (
            <div className="path-certs">
              <strong>Certifications:</strong> {careerPath.long_term.certifications.join(", ")}
            </div>
          )}
          <p className="path-advice">{careerPath.long_term?.advice}</p>
        </div>

        <div className="path-overall">
          <h3>Overall Advice</h3>
          <p>{careerPath.overall_advice}</p>
        </div>
      </div>
    );
  };

  // Overview tab
  const renderOverview = () => (
    <div className="tab-content overview-tab">
      {/* Row 1: Profile + Peer Comparison */}
      <div className="grid-2col">
        <div className="left-col">{renderProfileCard()}</div>
        <div className="right-col">{renderPeerComparison()}</div>
      </div>

      {/* Row 2: Skill Gaps & Similar Projects */}
      <div className="grid-2col">
        <div className="left-col">{renderSkillGaps()}</div>
        <div className="right-col">{renderSimilarProjects()}</div>
      </div>

      {/* Row 3: Learning Path (full width) */}
      <div className="full-width">{renderLearningPath()}</div>

      {/* Career Path button and Job listings */}
      <div className="section-header">
        <h3>Public Job Opportunities</h3>
        <button className="btn-career" onClick={handleGetCareerPath}>
          <Map size={16} /> Get Career Path
        </button>
      </div>
      {renderJobsList()}

      {/* AI Suggestions */}
      {renderSuggestion()}
      {renderInterviewQA()}
    </div>
  );

  const renderCareerTab = () => (
    <div className="tab-content career-tab">
      {renderCareerPath()}
      {!careerPath && !loading.career && (
        <div className="placeholder">
          <p>Click "Get Career Path" in the Overview tab to generate your roadmap.</p>
        </div>
      )}
    </div>
  );

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <User size={18} /> },
    { id: "career", label: "Career Path", icon: <Map size={18} /> },
  ];

  return (
    <div className="associate-dashboard">
      <Toaster richColors position="top-right" duration={3000} />

      {/* Sidebar */}
      <div className="assoc-sidebar">
        <div className="assoc-sidebar-header">
          <h2>Associate Portal</h2>
          <p>Welcome, {userData?.username}</p>
        </div>
        <div className="assoc-sidebar-nav">
          {sidebarItems.map((item) => (
            <div
              key={item.id}
              className={`assoc-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
          <div className="assoc-footer">
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="assoc-main-content">
        <div className="assoc-dashboard-header">
          <h1>Associate Dashboard</h1>
        </div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "career" && renderCareerTab()}
      </div>
    </div>
  );
}

export default AssociateDashboard;