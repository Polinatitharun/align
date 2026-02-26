// import React, { useState, useEffect } from 'react';
// import { Toaster, toast } from 'sonner';
// import {
//   LayoutDashboard,
//   Briefcase,
//   Users,
//   BarChart2,
//   FileText,
//   ExternalLink,
//   Lightbulb,
//   BarChart3,
//   LogOut,
//   TrendingUp,
//   CheckCircle,
//   Clock,
//   MapPin,
//   DollarSign,
//   Calendar,
//   Edit,
//   Trash2,
//   Eye,
//   Search,
//   Filter,
//   X,
//   ChevronRight,
//   User,
//   Mail,
//   Star,
//   Award,
//   Target,
//   PieChart,
//   Download,
//   Bell,
//   Settings,
//   Plus,
//   ArrowLeft,
//   Check,
//   AlertCircle,
//   Link,
//   GraduationCap,
//   BriefcaseBusiness,
//   Building,
//   DollarSign as Dollar,
//   CalendarDays,
//   BookOpen,
//   Brain,
//   Sparkles,
//   Zap,
//   ThumbsUp,
//   TrendingDown,
//   FileSpreadsheet,
//   File,
//   Upload,
//   Users2
// } from 'lucide-react';
// import Navbar from './Navbar';
// import Sidebar from './Sidebar';
// import api from '../api/axios';
// import './styles/HrDashboard.css';

// function DashboardHR({ userData, onLogout }) {
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [selectedTrainee, setSelectedTrainee] = useState(null);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [showExcelTemplate, setShowExcelTemplate] = useState(false);
//   const [showWordTemplate, setShowWordTemplate] = useState(false);
//   const [techSkills, setTechSkills] = useState([]);
//   const [softSkills, setSoftSkills] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // State for search and filter
//   const [searchQuery, setSearchQuery] = useState('');
//   const [locationFilter, setLocationFilter] = useState('');
  
//   const [jobs, setJobs] = useState([]);
//   const [trainees, setTrainees] = useState([]);
//   const [allTrainees, setAllTrainees] = useState([]);
//   const [skillTrends, setSkillTrends] = useState({ tech: [], soft: [] });

//   // State for job matches
//   const [jobMatches, setJobMatches] = useState(null);
//   const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  
//   // State for trainee matches
//   const [traineeMatches, setTraineeMatches] = useState(null);
//   const [traineeMatchesLoading, setTraineeMatchesLoading] = useState(false);

//   // NEW: State for Open Pool logic - track which trainees have no job matches
//   const [traineesWithNoMatches, setTraineesWithNoMatches] = useState([]);
//   const [checkingMatches, setCheckingMatches] = useState(false);

//   // State for new job creation
//   const [newJob, setNewJob] = useState({
//     title: '',
//     department: '',
//     location: [''],
//     openings: 1,
//     requirements: '',
//     techSkills: [],
//     softSkills: [],
//     description: '',
//     salary: '',
//     expiryDate: ''
//   });

//   // Fetch trainees from API
//   useEffect(() => {
//     if (activeTab === 'dashboard' || activeTab === 'trainees' || activeTab === 'mapped' || activeTab === 'unmapped' || activeTab === 'openPool') {
//       fetchTrainees();
//     }
//   }, [activeTab]);

//   // Fetch jobs on component mount and when active tab changes
//   useEffect(() => {
//     if (activeTab === 'dashboard' || activeTab === 'jobs' || activeTab === 'createJob') {
//       fetchJobs();
//     }
//   }, [activeTab]);

//   // Check for trainees with no matches when allTrainees changes
//   useEffect(() => {
//     if (allTrainees.length > 0 && activeTab === 'openPool') {
//       checkTraineesForOpenPool();
//     }
//   }, [allTrainees, activeTab]);

//   useEffect(() => {
//     setSkillTrends(computeSkillTrends(jobs));
//   }, [jobs]);

//   // Filter trainees based on search query, location, and tab
//   useEffect(() => {
//     let filtered = [...allTrainees];
    
//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(trainee =>
//         trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         trainee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         trainee.skills.some(skill => 
//           skill.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       );
//     }
    
//     // Location filter
//     if (locationFilter) {
//       filtered = filtered.filter(trainee => 
//         trainee.location.toLowerCase().includes(locationFilter.toLowerCase())
//       );
//     }
    
//     // Tab filter (mapped/unmapped/all/openPool)
//     if (activeTab === 'mapped') {
//       filtered = filtered.filter(trainee => trainee.isMapped === true);
//     } else if (activeTab === 'unmapped') {
//       // Show all unmapped trainees
//       filtered = filtered.filter(trainee => trainee.isMapped !== true);
//     } else if (activeTab === 'openPool') {
//       // Open Pool: Only trainees who have NO job matches
//       // Use the pre-computed list of trainees with no matches
//       const noMatchTraineeIds = traineesWithNoMatches.map(t => t.id || t.trainee_id);
//       filtered = filtered.filter(trainee => 
//         !trainee.isMapped && noMatchTraineeIds.includes(trainee.id)
//       );
//     }
    
//     setTrainees(filtered);
//   }, [searchQuery, locationFilter, activeTab, allTrainees, traineesWithNoMatches]);

//   // FIXED: Function to check which trainees have no job matches
//   const checkTraineesForOpenPool = async () => {
//     if (allTrainees.length === 0) return;
    
//     setCheckingMatches(true);
//     try {
//       const noMatchTrainees = [];
      
//       // Check each unmapped trainee for job matches
//       const unmappedTrainees = allTrainees.filter(t => !t.isMapped);
      
//       for (const trainee of unmappedTrainees) {
//         console.log(trainee)
//         try {
//           // Call trainee-matches API for each trainee
//           const response = await api.get(`/trainee-matches/${trainee.id}/`);
//           const matchesData = response.data;
          
//           // FIXED LOGIC: Check if trainee has no meaningful matches
//           // A trainee belongs to Open Pool if:
//           // 1. They have total_matches > 0 but all matches are in no_match with 0% scores
//           // 2. OR they have total_matches === 0 (edge case)
          
//           const hasNoMatch = (matchesData.total_matches >= 0 && 
//             matchesData.no_match && 
//             matchesData.no_match.length > 0 &&
//             (!matchesData.perfect_match || matchesData.perfect_match.length === 0) &&
//             (!matchesData.skills_only || matchesData.skills_only.length === 0) &&
//             (!matchesData.location_only || matchesData.location_only.length === 0) &&
//             (!matchesData.nearby || matchesData.nearby.length === 0)) ||
//             matchesData.total_matches === 0;
          
//           if (hasNoMatch) {
//             noMatchTrainees.push({
//               ...trainee,
//               trainee_id: trainee.id,
//               trainee_name: trainee.name,
//               trainee_location: trainee.location,
//               total_matches: matchesData.total_matches,
//               no_match_count: matchesData.no_match ? matchesData.no_match.length : 0
//             });
//           }
//         } catch (error) {
//           console.error(`Error checking matches for trainee ${trainee.id}:`, error);
//           // If API fails, assume no matches (add to open pool)
//           noMatchTrainees.push({
//             ...trainee,
//             trainee_id: trainee.id,
//             trainee_name: trainee.name,
//             trainee_location: trainee.location,
//             total_matches: 0,
//             no_match_count: 0
//           });
//         }
//       }
      
//       setTraineesWithNoMatches(noMatchTrainees);
//       console.log(`Found ${noMatchTrainees.length} trainees for Open Pool`, noMatchTrainees);
//     } catch (err) {
//       console.error('Error checking trainees for open pool:', err);
//       toast.error('Failed to check trainee matches for Open Pool');
//     } finally {
//       setCheckingMatches(false);
//     }
//   };

//   // API functions for mapping
//   const mappingAPI = {
//     // Update trainee mapping status
//     updateMapping: async (userId, mappingData) => {
//       try {
//         const response = await api.patch(`/api/userinfo/${userId}/update-mapping/`, mappingData);
//         return response.data;
//       } catch (error) {
//         console.error(`Error updating mapping for user ${userId}:`, error);
//         throw error;
//       }
//     },

//     // Get mapping status for a trainee
//     getMapping: async (userId) => {
//       try {
//         const response = await api.get(`/api/userinfo/${userId}/`);
//         return response.data;
//       } catch (error) {
//         console.error(`Error getting mapping for user ${userId}:`, error);
//         throw error;
//       }
//     }
//   };

//   const fetchTrainees = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await api.get('/api/profiles/');
      
//       // Transform API data to match frontend structure
//       const transformedTrainees = response.data.map(trainee => {
//         const userInfo = trainee.userInfo || {};
//         const skills = [
//           ...(trainee.strengths?.map(strength => strength.courseName) || []),
//           ...(trainee.weaknesses?.map(weakness => weakness.courseName) || [])
//         ];
        
//         const avgScore = userInfo.averageScore || 0;
        
//         return {
//           id: trainee.id,
//           userId: userInfo.userId || trainee.id,
//           name: userInfo.name || 'Unknown',
//           email: `${userInfo.employeeId || 'EMP' + trainee.id}@example.com`,
//           skills: skills,
//           score: Math.round(avgScore),
//           location: (userInfo.location || 'unknown').toLowerCase(),
//           matchedJobs: [],
//           certifications: trainee.certificates ? [trainee.certificates] : [],
//           preferredLocation: userInfo.location || 'Unknown',
          
//           // NEW: Mapping fields
//           isMapped: userInfo.isMapped || false,
//           projectId: userInfo.projectId || '',
//           projectName: userInfo.projectName || '',
          
//           // Store raw trainee data for API calls
//           traineeData: trainee
//         };
//       });
      
//       setTrainees(transformedTrainees);
//       setAllTrainees(transformedTrainees);
      
//       // Reset the no matches list when fetching new trainees
//       setTraineesWithNoMatches([]);
      
//     } catch (err) {
//       console.error('Error fetching trainees:', err);
//       setError('Failed to fetch trainees. Please try again.');
//       setTrainees([]);
//       setAllTrainees([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchJobs = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await jobAPI.getAllJobs();
//       setJobs(response);
//     } catch (err) {
//       setError('Failed to fetch jobs. Please try again.');
//       console.error('Error fetching jobs:', err);
      
//       // Fallback to mock data if API fails
//       setJobs([
//         { 
//           id: 1, 
//           title: 'Frontend Developer', 
//           department: 'Technology', 
//           location: ['Hyderabad', 'Bangalore'], 
//           openings: 5, 
//           filled: 2, 
//           matches: 15, 
//           status: 'active',
//           description: 'Develop and maintain responsive web applications using React.js, TypeScript, and modern frontend technologies.',
//           requirements: '3+ years of React experience, strong JavaScript fundamentals, experience with state management (Redux/MobX)',
//           techSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML5', 'Redux'],
//           softSkills: ['Communication', 'Teamwork', 'Problem Solving'],
//           salary: '$85,000 - $110,000',
//           postedDate: '2024-01-15',
//           expiryDate: '2024-03-15'
//         },
//         { 
//           id: 2, 
//           title: 'Data Scientist', 
//           department: 'Analytics', 
//           location: ['Remote'], 
//           openings: 3, 
//           filled: 1, 
//           matches: 8, 
//           status: 'active',
//           description: 'Build machine learning models and perform data analysis to drive business decisions.',
//           requirements: 'Master\'s in Data Science, experience with Python, ML libraries, and SQL',
//           techSkills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'TensorFlow'],
//           softSkills: ['Analytical Thinking', 'Communication', 'Research'],
//           salary: '$95,000 - $130,000',
//           postedDate: '2024-01-20',
//           expiryDate: '2024-03-20'
//         },
//         { 
//           id: 3, 
//           title: 'DevOps Engineer', 
//           department: 'Operations', 
//           location: ['Chennai'], 
//           openings: 4, 
//           filled: 3, 
//           matches: 12, 
//           status: 'active',
//           description: 'Design and implement CI/CD pipelines and manage cloud infrastructure.',
//           requirements: 'Experience with AWS, Docker, Kubernetes, and Terraform',
//           techSkills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
//           softSkills: ['Collaboration', 'Attention to Detail', 'Process Improvement'],
//           salary: '$100,000 - $140,000',
//           postedDate: '2024-01-10',
//           expiryDate: '2024-03-10'
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Job API methods
//   const jobAPI = {
//     getAllJobs: async () => {
//       try {
//         const response = await api.get("/jobs/");
//         return response.data;
//       } catch (error) {
//         console.error("Error fetching jobs:", error);
//         throw error;
//       }
//     },

//     getJobById: async (id) => {
//       try {
//         const response = await api.get(`/jobs/${id}/`);
//         return response.data;
//       } catch (error) {
//         console.error(`Error fetching job ${id}:`, error);
//         throw error;
//       }
//     },

//     createJob: async (jobData) => {
//       try {
//         const response = await api.post("/jobs/", jobData);
//         return response.data;
//       } catch (error) {
//         console.error("Error creating job:", error);
//         throw error;
//       }
//     },

//     updateJob: async (id, jobData) => {
//       try {
//         const response = await api.put(`/jobs/${id}/`, jobData);
//         return response.data;
//       } catch (error) {
//         console.error(`Error updating job ${id}:`, error);
//         throw error;
//       }
//     },

//     deleteJob: async (id) => {
//       try {
//         const response = await api.delete(`/jobs/${id}/`);
//         return response.data;
//       } catch (error) {
//         console.error(`Error deleting job ${id}:`, error);
//         throw error;
//       }
//     },

//     toggleJobStatus: async (id) => {
//       try {
//         const response = await api.patch(`/jobs/${id}/toggle-status/`);
//         return response.data;
//       } catch (error) {
//         console.error(`Error toggling job status ${id}:`, error);
//         throw error;
//       }
//     },

//     uploadExcel: async (file) => {
//       try {
//         const formData = new FormData();
//         formData.append("excel_file", file);

//         const response = await api.post("/jobs/upload-excel/", formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         });
//         return response.data;
//       } catch (error) {
//         console.error("Error uploading Excel:", error);
//         throw error;
//       }
//     },

//     uploadWord: async (file) => {
//       try {
//         const formData = new FormData();
//         formData.append("wordFile", file);

//         const response = await api.post("/jobs/upload-word/", formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         });
//         return response.data;
//       } catch (error) {
//         console.error("Error uploading Word:", error);
//         throw error;
//       }
//     },

//     downloadExcelTemplate: async () => {
//       try {
//         const response = await api.get("/jobs/download-excel-template/", {
//           responseType: "blob",
//         });
//         return response.data;
//       } catch (error) {
//         console.error("Error downloading Excel template:", error);
//         throw error;
//       }
//     },

//     downloadWordTemplate: async () => {
//       try {
//         const response = await api.get("/jobs/download-word-template/", {
//           responseType: "blob",
//         });
//         return response.data;
//       } catch (error) {
//         console.error("Error downloading Word template:", error);
//         throw error;
//       }
//     },
//   };

//   /**
//    * Function to auto-deactivate job when openings become 0
//    */
//   const checkAndAutoDeactivateJob = async (job) => {
//     try {
//       // Check if openings have reached 0
//       if (job.openings <= 0) {
//         // Create updated job data with status inactive
//         const updatedJobData = {
//           ...job,
//           status: 'inactive'
//         };
        
//         // Call API to update job status
//         const response = await jobAPI.updateJob(job.id, updatedJobData);
        
//         // Update local jobs state
//         setJobs(prevJobs => 
//           prevJobs.map(j => 
//             j.id === job.id 
//               ? { ...j, status: 'inactive', openings: 0 }
//               : j
//           )
//         );
        
//         toast.success(`Job "${job.title}" has been automatically deactivated as all positions are filled.`);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error auto-deactivating job:', error);
//       toast.error('Failed to auto-deactivate job.');
//       return false;
//     }
//   };

//   /**
//    * Function to update job vacancies after mapping trainee
//    * FIXED: Now properly updates state in real-time
//    */
//   const updateJobVacancies = async (job) => {
//     try {
//       // Calculate new filled count (increment by 1)
//       const newFilled = (job.filled || 0) + 1;
      
//       // Calculate new openings count (decrement by 1)
//       const newOpenings = Math.max(0, (job.openings || 0) - 1);
      
//       // Create updated job data
//       const updatedJobData = {
//         ...job,
//         filled: newFilled,
//         openings: newOpenings
//       };
      
//       // Call Edit Job API to update vacancies
//       const response = await jobAPI.updateJob(job.id, updatedJobData);
      
//       // FIXED: Update local jobs state IMMEDIATELY for real-time UI update
//       setJobs(prevJobs => 
//         prevJobs.map(j => 
//           j.id === job.id 
//             ? { ...j, filled: newFilled, openings: newOpenings }
//             : j
//         )
//       );
      
//       // FIXED: Also update selectedJob if it's the same job
//       if (selectedJob && selectedJob.id === job.id) {
//         setSelectedJob(prev => ({
//           ...prev,
//           filled: newFilled,
//           openings: newOpenings
//         }));
//       }
      
//       // Check if job should be auto-deactivated
//       if (newOpenings === 0) {
//         await checkAndAutoDeactivateJob(updatedJobData);
//       }
      
//       return updatedJobData;
//     } catch (error) {
//       console.error('Error updating job vacancies:', error);
//       toast.error('Failed to update job vacancies.');
//       throw error;
//     }
//   };

//   const normalizeSkill = (s) => (s || "")
//     .toString()
//     .trim()
//     .toLowerCase();

//   const computeSkillTrends = (jobs) => {
//     const techMap = new Map();
//     const softMap = new Map();

//     const WEIGHTS = {
//       basePerJob: 1,
//       openingsWeight: 0.5,
//       matchesWeight: 0.25,
//       inactivePenalty: 0.4,
//       unfilledBonus: 0.3,
//     };

//     for (const job of jobs || []) {
//       const isActive = job?.status === 'active';
//       const openings = Number(job?.openings ?? 0);
//       const filled = Number(job?.filled ?? 0);
//       const matches = Number(job?.matches ?? 0);
//       const unfilled = Math.max(0, openings - filled);

//       const jobWeight =
//         WEIGHTS.basePerJob +
//         (openings * WEIGHTS.openingsWeight) +
//         (matches * WEIGHTS.matchesWeight) +
//         (unfilled * WEIGHTS.unfilledBonus);

//       const effectiveWeight = isActive ? jobWeight : jobWeight * WEIGHTS.inactivePenalty;

//       const techSkills = Array.isArray(job?.techSkills) ? job.techSkills : [];
//       const softSkills = Array.isArray(job?.softSkills) ? job.softSkills : [];

//       techSkills.forEach((raw) => {
//         const skill = normalizeSkill(raw);
//         if (!skill) return;
//         const cur = techMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
//         techMap.set(skill, {
//           jobs: cur.jobs + 1,
//           openings: cur.openings + openings,
//           matches: cur.matches + matches,
//           demand: cur.demand + effectiveWeight,
//         });
//       });

//       softSkills.forEach((raw) => {
//         const skill = normalizeSkill(raw);
//         if (!skill) return;
//         const cur = softMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
//         softMap.set(skill, {
//           jobs: cur.jobs + 1,
//           openings: cur.openings + openings,
//           matches: cur.matches + matches,
//           demand: cur.demand + effectiveWeight,
//         });
//       });
//     }

//     const toSortedArray = (map) => {
//       const arr = Array.from(map.entries()).map(([name, stats]) => ({
//         name,
//         jobs: stats.jobs,
//         openings: stats.openings,
//         matches: stats.matches,
//         demandRaw: stats.demand,
//       }));
//       const maxDemand = Math.max(...arr.map(a => a.demandRaw), 1);
//       return arr
//         .map(a => ({
//           ...a,
//           demand: Math.round((a.demandRaw / maxDemand) * 100),
//         }))
//         .sort((a, b) => b.demand - a.demand || b.jobs - a.jobs)
//         .slice(0, 5); // Top 5 skills only
//     };

//     return {
//       tech: toSortedArray(techMap),
//       soft: toSortedArray(softMap),
//     };
//   };

//   const toggleJobStatus = async (jobId) => {
//     try {
//       await jobAPI.toggleJobStatus(jobId);
      
//       setJobs(jobs.map(job => 
//         job.id === jobId 
//           ? { ...job, status: job.status === 'active' ? 'inactive' : 'active' }
//           : job
//       ));
      
//       toast.success("Job status updated successfully!");
//     } catch (err) {
//       console.error('Error toggling job status:', err);
//       toast.error('Failed to update job status. Please try again.');
//     }
//   };

//   const handleMapToProject = async (trainee, job) => {
//     try {
//       setLoading(true);
      
//       // Prepare mapping data
//       const mappingData = {
//         isMapped: true,
//         projectId: job.id.toString(),
//         projectName: job.title
//       };

//       let userId = null;
//       if(trainee.traineeData){
//         userId = trainee.traineeData.userInfo.userId;
//       } else {
//         // Find userId from allTrainees
//         allTrainees.forEach((traineeData) => {
//           let t = traineeData.traineeData;
//           if(t.userInfo.name == trainee.trainee_name && t.userInfo.location == trainee.trainee_location){
//             userId = t.userInfo.userId;
//           }
//         });
//       }
      
//       if (!userId) {
//         toast.error('Could not find user ID for trainee');
//         return;
//       }
      
//       // 1. Update trainee mapping via API
//       await mappingAPI.updateMapping(userId, mappingData);
      
//       // 2. Update job vacancies (filled count +1, openings -1)
//       await updateJobVacancies(job);
      
//       // 3. Remove trainee from Open Pool list if they were in it
//       setTraineesWithNoMatches(prev => 
//         prev.filter(t => 
//           t.trainee_name !== (trainee.traineeData?.userInfo?.name || trainee.trainee_name)
//         )
//       );
      
//       // 4. Update local state to remove trainee from lists
//       if(trainee.traineeData){
//         setTrainees(prevTrainees => {
//           return prevTrainees.filter(t => 
//             !(t.traineeData.userInfo.name === trainee.traineeData.userInfo.name && 
//               t.traineeData.userInfo.location === trainee.traineeData.userInfo.location)
//           );
//         });
//       } else {
//         setTrainees(prevTrainees => {
//           return prevTrainees.filter(t => 
//             !(t.traineeData.userInfo.name === trainee.trainee_name && 
//               t.traineeData.userInfo.location === trainee.trainee_location)
//           );
//         });
//       }
      
//       // 5. Update allTrainees state
//       if(trainee.traineeData){
//         setAllTrainees(prev => 
//           prev.map(t => 
//             t.traineeData.userInfo.name === trainee.traineeData.userInfo.name
//               ? { ...t, ...mappingData }
//               : t
//           )
//         );
//       } else {
//         setAllTrainees(prev => 
//           prev.map(t => 
//             t.traineeData.userInfo.name === trainee.trainee_name
//               ? { ...t, ...mappingData }
//               : t
//           )
//         );
//       }
      
//       // 6. Update job matches if showing (remove trainee from matches)
//       if (jobMatches) {
//         if(trainee.traineeData){
//           const bucket = Object.keys(jobMatches).find(key => 
//             Array.isArray(jobMatches[key]) && 
//             jobMatches[key].some(m => m.trainee_name === trainee.traineeData.userInfo.name)
//           );
          
//           if (bucket) {
//             setJobMatches(prev => ({
//               ...prev,
//               [bucket]: prev[bucket].filter(m => m.trainee_name !== trainee.traineeData.userInfo.name),
//               total_matches: prev.total_matches - 1
//             }));
//           }
//         } else {
//           const bucket = Object.keys(jobMatches).find(key => 
//             Array.isArray(jobMatches[key]) && 
//             jobMatches[key].some(m => m.trainee_name === trainee.trainee_name)
//           );
          
//           if (bucket) {
//             setJobMatches(prev => ({
//               ...prev,
//               [bucket]: prev[bucket].filter(m => m.trainee_name !== trainee.trainee_name),
//               total_matches: prev.total_matches - 1
//             }));
//           }
//         }
//       }
      
//       // 7. If selected trainee is the one being mapped, update it
//       if(trainee.traineeData){
//         if (selectedTrainee && selectedTrainee.traineeData.userInfo.name === trainee.traineeData.userInfo.name) {
//           setSelectedTrainee({  
//             ...selectedTrainee,
//             ...mappingData
//           });
//         }
//       } else {
//         if (selectedTrainee && selectedTrainee.traineeData.userInfo.name === trainee.trainee_name) {
//           setSelectedTrainee({  
//             ...selectedTrainee,
//             ...mappingData
//           });
//         }
//       }
      
//       // 8. Show success message
//       if(trainee.traineeData){
//         toast.success(`Successfully mapped ${trainee.traineeData.userInfo.name} to ${job.title}`);
//       } else {
//         toast.success(`Successfully mapped ${trainee.trainee_name} to ${job.title}`);
//       }
      
//     } catch (err) {
//       console.error('Error mapping trainee:', err);
//       toast.error('Failed to map trainee. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUnmapFromProject = async (trainee) => {
//     try {
//       setLoading(true);
      
//       // Prepare unmapping data
//       const unmappingData = {
//         isMapped: false,
//         projectId: '',
//         projectName: ''
//       };
      
//       // Update trainee mapping via API
//       await mappingAPI.updateMapping(trainee.userId, unmappingData);
      
//       // Get job ID from trainee data to update filled positions
//       const jobId = trainee.projectId;
//       if (jobId) {
//         const job = jobs.find(j => j.id.toString() === jobId);
//         if (job) {
//           // Update job vacancies (filled count -1, openings +1)
//           const updatedJob = {
//             ...job,
//             filled: Math.max(0, (job.filled || 0) - 1),
//             openings: (job.openings || 0) + 1
//           };
          
//           // If job was inactive and now has openings, reactivate it
//           if (job.status === 'inactive' && updatedJob.openings > 0) {
//             updatedJob.status = 'active';
//           }
          
//           await jobAPI.updateJob(job.id, updatedJob);
          
//           // Update jobs state
//           setJobs(prev => prev.map(j => 
//             j.id === job.id ? updatedJob : j
//           ));
          
//           // Update selectedJob if it's the same job
//           if (selectedJob && selectedJob.id === job.id) {
//             setSelectedJob(prev => ({
//               ...prev,
//               filled: updatedJob.filled,
//               openings: updatedJob.openings,
//               status: updatedJob.status
//             }));
//           }
//         }
//       }
      
//       // Update local state
//       setAllTrainees(prev => 
//         prev.map(t => 
//           t.id === trainee.id 
//             ? { ...t, ...unmappingData }
//             : t
//         )
//       );
      
//       // When unmapping, we need to re-check if this trainee has no matches
//       // This will happen automatically when they switch to Open Pool tab
      
//       // Update trainees list if active
//       if (activeTab === 'mapped' || activeTab === 'unmapped' || activeTab === 'trainees' || activeTab === 'openPool') {
//         fetchTrainees();
//       }
      
//       // If trainee is selected, update it
//       if (selectedTrainee && selectedTrainee.id === trainee.id) {
//         setSelectedTrainee({
//           ...selectedTrainee,
//           ...unmappingData
//         });
//       }
      
//       toast.success(`Successfully unmapped ${trainee.name}`);
      
//     } catch (err) {
//       console.error('Error unmapping trainee:', err);
//       toast.error('Failed to unmap trainee. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Helper function to get all mapped trainee names
//    * Used for filtering in job matches modal
//    */
//   const getMappedTraineeNames = () => {
//     return allTrainees
//       .filter(trainee => trainee.isMapped)
//       .map(trainee => trainee.traineeData?.userInfo?.name || trainee.name);
//   };

//   const handleExcelUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const validExtensions = ['.xlsx', '.xls', '.csv'];
//     const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
//     if (!validExtensions.includes(fileExtension)) {
//       toast.error('Please upload a valid Excel file (.xlsx, .xls, .csv)');
//       event.target.value = '';
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('File size must be less than 10MB');
//       event.target.value = '';
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await jobAPI.uploadExcel(file);
      
//       await fetchJobs();
      
//       toast.success(`Excel file uploaded successfully! ${response.created_jobs || 0} jobs created.`);
//     } catch (err) {
//       console.error('Error uploading Excel:', err);
      
//       let errorMessage = 'Failed to upload Excel file. Please check the format and try again.';
      
//       if (err.message && err.message.includes('Missing required columns')) {
//         errorMessage = err.message;
//       } else if (err.response?.data) {
//         const data = err.response.data;
//         if (data.error) {
//           errorMessage = data.error;
//           if (data.expected_columns && data.found_columns) {
//             errorMessage += `\n\nExpected columns: ${data.expected_columns.join(', ')}`;
//             errorMessage += `\nFound columns: ${data.found_columns.join(', ')}`;
//           }
//         } else if (data.message) {
//           errorMessage = data.message;
//         }
//       }
      
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//       event.target.value = '';
//     }
//   };

//   const handleWordUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const validExtensions = ['.doc', '.docx'];
//     const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
//     if (!validExtensions.includes(fileExtension)) {
//       toast.error('Please upload a valid Word document (.doc, .docx)');
//       event.target.value = null;
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('File size must be less than 10MB');
//       event.target.value = null;
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await jobAPI.uploadWord(file);
      
//       await fetchJobs();
//       toast.success(`Word document uploaded successfully! ${response.created_jobs || 0} jobs created.`);
//     } catch (err) {
//       console.error('Error uploading Word:', err);
//       toast.error('Failed to upload Word document. Please check the format and try again.');
//     } finally {
//       setLoading(false);
//       event.target.value = null;
//     }
//   };

//   const handleDownloadExcelTemplate = async () => {
//     try {
//       setLoading(true);
//       const blob = await jobAPI.downloadExcelTemplate();
      
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'job_template.xlsx';
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
      
//       toast.success('Excel template downloaded successfully!');
//     } catch (err) {
//       console.error('Error downloading Excel template:', err);
//       toast.error('Failed to download Excel template. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownloadWordTemplate = async () => {
//     try {
//       setLoading(true);
//       const blob = await jobAPI.downloadWordTemplate();
      
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'job_template.docx';
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
      
//       toast.success('Word template downloaded successfully!');
//     } catch (err) {
//       console.error('Error downloading Word template:', err);
//       toast.error('Failed to download Word template. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateJob = async () => {
//     if (!newJob.title || !newJob.department || !newJob.description || !newJob.requirements) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     try {
//       setLoading(true);
//       const jobData = {
//         ...newJob,
//         location: newJob.location.filter(loc => loc.trim() !== ''),
//         techSkills: techSkills,
//         softSkills: softSkills,
//         status: 'active',
//         filled: 0,
//         matches: 0,
//         postedDate: new Date().toISOString().split('T')[0]
//       };

//       const response = await jobAPI.createJob(jobData);
      
//       await fetchJobs();
      
//       setNewJob({
//         title: '',
//         department: '',
//         location: [''],
//         openings: 1,
//         requirements: '',
//         techSkills: [],
//         softSkills: [],
//         description: '',
//         salary: '',
//         expiryDate: ''
//       });
//       setTechSkills([]);
//       setSoftSkills([]);
      
//       setActiveTab('jobs');
      
//       toast.success('Job created successfully!');
//     } catch (err) {
//       console.error('Error creating job:', err);
//       toast.error('Failed to create job. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateJob = async (updatedJob) => {
//     try {
//       setLoading(true);
//       await jobAPI.updateJob(updatedJob.id, updatedJob);
      
//       await fetchJobs();
      
//       setSelectedJob(null);
//       setIsEditMode(false);
//       setActiveTab('jobs');
//       setTechSkills([]);
//       setSoftSkills([]);
      
//       toast.success('Job updated successfully!');
//     } catch (err) {
//       console.error('Error updating job:', err);
//       toast.error('Failed to update job. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteJob = async (jobId) => {
//     if (!window.confirm('Are you sure you want to delete this job?')) {
//       return;
//     }

//     try {
//       setLoading(true);
//       await jobAPI.deleteJob(jobId);
      
//       setJobs(jobs.filter(j => j.id !== jobId));
      
//       toast.success('Job deleted successfully!');
//     } catch (err) {
//       console.error('Error deleting job:', err);
//       toast.error('Failed to delete job. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeTechSkill = (index) => {
//     const updatedSkills = techSkills.filter((_, i) => i !== index);
//     setTechSkills(updatedSkills);
//     if (selectedJob && isEditMode) {
//       setSelectedJob({...selectedJob, techSkills: updatedSkills});
//     } else {
//       setNewJob({
//         ...newJob,
//         techSkills: updatedSkills
//       });
//     }
//   };

//   const removeSoftSkill = (index) => {
//     const updatedSkills = softSkills.filter((_, i) => i !== index);
//     setSoftSkills(updatedSkills);
//     if (selectedJob && isEditMode) {
//       setSelectedJob({...selectedJob, softSkills: updatedSkills});
//     } else {
//       setNewJob({
//         ...newJob,
//         softSkills: updatedSkills
//       });
//     }
//   };

//   const handleTechSkillAdd = (e) => {
//     if (e.key === 'Enter' || e.key === ',') {
//       e.preventDefault();
//       const skill = e.target.value.trim();
//       if (skill && !techSkills.includes(skill)) {
//         const updatedSkills = [...techSkills, skill];
//         setTechSkills(updatedSkills);
//         if (selectedJob && isEditMode) {
//           setSelectedJob({...selectedJob, techSkills: updatedSkills});
//         } else {
//           setNewJob({
//             ...newJob,
//             techSkills: updatedSkills
//           });
//         }
//         e.target.value = '';
//       }
//     }
//   };

//   const handleSoftSkillAdd = (e) => {
//     if (e.key === 'Enter' || e.key === ',') {
//       e.preventDefault();
//       const skill = e.target.value.trim();
//       if (skill && !softSkills.includes(skill)) {
//         const updatedSkills = [...softSkills, skill];
//         setSoftSkills(updatedSkills);
//         if (selectedJob && isEditMode) {
//           setSelectedJob({...selectedJob, softSkills: updatedSkills});
//         } else {
//           setNewJob({
//             ...newJob,
//             softSkills: updatedSkills
//           });
//         }
//         e.target.value = '';
//       }
//     }
//   };

//   const addLocationField = () => {
//     setNewJob({
//       ...newJob,
//       location: [...newJob.location, '']
//     });
//   };

//   const removeLocationField = (index) => {
//     const newLocations = newJob.location.filter((_, i) => i !== index);
//     setNewJob({
//       ...newJob,
//       location: newLocations
//     });
//   };

//   const updateLocationField = (index, value) => {
//     const newLocations = [...newJob.location];
//     newLocations[index] = value;
//     setNewJob({
//       ...newJob,
//       location: newLocations
//     });
//   };

//   const calculateStatistics = () => {
//     const totalTrainees = allTrainees.length;
//     const totalJobs = jobs.length;
//     const mappedTrainees = allTrainees.filter(t => t.isMapped === true).length;
//     const unmappedTrainees = allTrainees.filter(t => !t.isMapped).length;
//     const activeJobs = jobs.filter(j => j.status === 'active').length;
//     const filledPositions = jobs.reduce((sum, job) => sum + (job.filled || 0), 0);
//     const totalOpenings = jobs.reduce((sum, job) => sum + (job.openings || 0), 0);
//     const fillRate = totalOpenings > 0 ? Math.round((filledPositions / totalOpenings) * 100) : 0;

//     return {
//       totalTrainees,
//       totalJobs,
//       mappedTrainees,
//       unmappedTrainees,
//       activeJobs,
//       filledPositions,
//       totalOpenings,
//       fillRate
//     };
//   };

//   const stats = calculateStatistics();

//   const fetchJobMatches = async (jobId) => {
//     setJobMatchesLoading(true);
//     try {
//       const response = await api.get(`/matches/${jobId}/`);
//       setJobMatches(response.data);
//     } catch (err) {
//       console.error('Error fetching job matches:', err);
//       toast.error('Failed to fetch job matches.');
//     } finally {
//       setJobMatchesLoading(false);
//     }
//   };

//   const fetchTraineeMatches = async (traineeId) => {
//     setTraineeMatchesLoading(true);
//     try {
//       const response = await api.get(`/trainee-matches/${traineeId}/`);
//       setTraineeMatches(response.data);
//     } catch (err) {
//       console.error('Error fetching trainee matches:', err);
//       toast.error('Failed to fetch trainee matches.');
//     } finally {
//       setTraineeMatchesLoading(false);
//     }
//   };

//   const handleViewTraineeProfileFromJob = (match) => {
//     const trainee  = allTrainees.find(at => at.traineeData.userInfo.name == match.trainee_name)

//     if (trainee) {
//       setSelectedTrainee(trainee);
//       setJobMatches(null);
//       setSelectedJob(null);
//       fetchTraineeMatches(allTrainees.indexOf(trainee)+1);
//     } else {
//       toast.error('Trainee not found in current list.');
//     }
//   };

//   const handleViewJobMatches = (job) => {
//     setSelectedJob(job);
//     fetchJobMatches(job.id);
//   };

//   const handleViewTraineeProfile = (trainee) => {
//     setSelectedTrainee(trainee);
//     fetchTraineeMatches(allTrainees.indexOf(trainee)+1);
//   };

//   const renderHiddenFileInputs = () => (
//     <>
//       <input
//         type="file"
//         id="excelUpload"
//         accept=".xlsx,.xls,.csv"
//         style={{ display: 'none' }}
//         onChange={handleExcelUpload}
//       />
//       <input
//         type="file"
//         id="wordUpload"
//         accept=".doc,.docx"
//         style={{ display: 'none' }}
//         onChange={handleWordUpload}
//       />
//     </>
//   );

//   const renderExcelTemplateModal = () => {
//     if (!showExcelTemplate) return null;

//     return (
//       <div className="modal-overlay" onClick={() => setShowExcelTemplate(false)}>
//         <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
//           <div className="modal-header">
//             <div className="modal-title">
//               <FileSpreadsheet size={24} />
//               <h2>Excel Upload Template</h2>
//             </div>
//             <button className="modal-close" onClick={() => setShowExcelTemplate(false)}>
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className="modal-body">
//             <h3>Here you can download this template</h3>
//           </div>
          
//           <div className="modal-actions">
//             <button className="btn-secondary" onClick={handleDownloadExcelTemplate} disabled={loading}>
//               <Download size={18} />
//               Download Template
//             </button>
//             <button className="btn-primary" onClick={() => {
//               document.getElementById('excelUpload').click();
//               setShowExcelTemplate(false);
//             }} disabled={loading}>
//               <Upload size={18} />
//               Upload Excel
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderWordTemplateModal = () => {
//     if (!showWordTemplate) return null;

//     return (
//       <div className="modal-overlay" onClick={() => setShowWordTemplate(false)}>
//         <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
//           <div className="modal-header">
//             <div className="modal-title">
//               <File size={24} />
//               <h2>Word Document Template</h2>
//             </div>
//             <button className="modal-close" onClick={() => setShowWordTemplate(false)}>
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className="modal-body">
//             <h3>Here you can download this template</h3>
//           </div>
          
//           <div className="modal-actions">
//             <button className="btn-secondary" onClick={handleDownloadWordTemplate} disabled={loading}>
//               <Download size={18} />
//               Download Template
//             </button>
//             <button className="btn-primary" onClick={() => {
//               document.getElementById('wordUpload').click();
//               setShowWordTemplate(false);
//             }} disabled={loading}>
//               <Upload size={18} />
//               Upload Word Doc
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderDashboard = () => {
//     return (
//       <div className="dashboard-content">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <p>Loading dashboard data...</p>
//           </div>
//         )}

//         {error && (
//           <div className="error-message">
//             <AlertCircle size={20} />
//             <span>{error}</span>
//           </div>
//         )}

//         <div className="stats-grid">
//           <div className="stat-card">
//             <div className="stat-icon">
//               <Users className="stat-icon-svg" />
//             </div>
//             <div className="stat-content">
//               <h3>Total Trainees</h3>
//               <div className="stat-value">{stats.totalTrainees}</div>
//             </div>
//           </div>
          
//           <div className="stat-card">
//             <div className="stat-icon">
//               <BriefcaseBusiness className="stat-icon-svg" />
//             </div>
//             <div className="stat-content">
//               <h3>Total Jobs</h3>
//               <div className="stat-value">{stats.totalJobs}</div>
//             </div>
//           </div>
          
//           <div className="stat-card">
//             <div className="stat-icon">
//               <CheckCircle className="stat-icon-svg" />
//             </div>
//             <div className="stat-content">
//               <h3>Mapped Trainees</h3>
//               <div className="stat-value">{stats.mappedTrainees}</div>
//             </div>
//           </div>
          
//           <div className="stat-card">
//             <div className="stat-icon">
//               <AlertCircle className="stat-icon-svg" />
//             </div>
//             <div className="stat-content">
//               <h3>Unmapped Trainees</h3>
//               <div className="stat-value">{stats.unmappedTrainees}</div>
//             </div>
//           </div>
          
//           <div className="stat-card">
//             <div className="stat-icon">
//               <Target className="stat-icon-svg" />
//             </div>
//             <div className="stat-content">
//               <h3>Active Jobs</h3>
//               <div className="stat-value">{stats.activeJobs}</div>
//             </div>
//           </div>
          
//           <div className="stat-card">
//             <div className="stat-icon">
//               <Briefcase className="stat-icon-svg" />
//             </div>
//             <div className="stat-content">
//               <h3>Fill Rate</h3>
//               <div className="stat-value">{stats.fillRate}%</div>
//             </div>
//           </div>
//         </div>

//         <h2 className="section-title">Top Skills in Demand</h2>
        
//         <div className="skills-section">
//           <div className="content-card">
//             <div className="card-header">
//               <h3>
//                 <Target size={20} />
//                 Technical Skills
//               </h3>
//             </div>
            
//             <div className="hr-skills-list">
//               {skillTrends.tech.map((skill) => (
//                 <div key={`tech-${skill.name}`} className="skill-item">
//                   <div className="skill-header">
//                     <span className="skill-name">
//                       {skill.name}
//                     </span>
//                     <div className="skill-stats">
//                       <span className="skill-jobs">{skill.jobs} jobs</span>
//                       <span className="skill-demand">{skill.demand}%</span>
//                     </div>
//                   </div>
//                   <div className="skill-bar">
//                     <div className="skill-fill" style={{ width: `${skill.demand}%`, background: '#3b82f6' }} />
//                   </div>
//                 </div>
//               ))}

//               {skillTrends.tech.length === 0 && (
//                 <div className="no-data">
//                   No technical skills found.
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="content-card">
//             <div className="card-header">
//               <h3>
//                 <Star size={20} />
//                 Soft Skills
//               </h3>
//             </div>
            
//             <div className="hr-skills-list">
//               {skillTrends.soft.map((skill) => (
//                 <div key={`soft-${skill.name}`} className="skill-item">
//                   <div className="skill-header">
//                     <span className="skill-name">
//                       {skill.name}
//                     </span>
//                     <div className="skill-stats">
//                       <span className="skill-jobs">{skill.jobs} jobs</span>
//                       <span className="skill-demand">{skill.demand}%</span>
//                     </div>
//                   </div>
//                   <div className="skill-bar">
//                     <div
//                       className="skill-fill"
//                       style={{
//                         width: `${skill.demand}%`,
//                         background: '#10b981',
//                       }}
//                     />
//                   </div>
//                 </div>
//               ))}

//               {skillTrends.soft.length === 0 && (
//                 <div className="no-data">
//                   No soft skills found.
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderJobManagement = () => (
//     <div className="job-management">
//       <div className="section-header">
//         <div className="header-title">
//           <h2>
//             <Briefcase size={24} />
//             Job Profiles Management
//           </h2>
//           <p className="subtitle">Manage and track all job positions</p>
//         </div>
//         <div className="header-actions">
//           <div className="upload-buttons">
//             <button 
//               className="btn-secondary"
//               onClick={() => setShowExcelTemplate(true)}
//               disabled={loading}
//             >
//               <FileSpreadsheet size={18} />
//               Upload Excel
//             </button>
//             <button 
//               className="btn-secondary"
//               onClick={() => setShowWordTemplate(true)}
//               disabled={loading}
//             >
//               <File size={18} />
//               Upload Word
//             </button>
//           </div>
//           <button 
//             className="btn-primary"
//             onClick={() => {
//               setSelectedJob(null);
//               setIsEditMode(false);
//               setActiveTab('createJob');
//             }}
//             disabled={loading}
//           >
//             <Plus size={18} />
//             Create New Job
//           </button>
//         </div>
//       </div>

//       {loading && (
//         <div className="loading-overlay">
//           <div className="loading-spinner"></div>
//           <p>Loading jobs...</p>
//         </div>
//       )}

//       {error && (
//         <div className="error-message">
//           <AlertCircle size={20} />
//           <span>{error}</span>
//         </div>
//       )}

//       {jobs.length === 0 && !loading && !error && (
//         <div className="no-data">
//           <Briefcase size={48} />
//           <h3>No Jobs Found</h3>
//           <p>Create your first job profile or upload jobs via Excel/Word</p>
//         </div>
//       )}

//       {jobs.length > 0 && (
//         <div className="table-container">
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>Job Title</th>
//                 <th>Department</th>
//                 <th>Location(s)</th>
//                 <th>Openings</th>
//                 <th>Filled</th>
                
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {jobs.map(job => (
//                 <tr key={job.id}>
//                   <td>
//                     <div className="job-title-cell">
//                       <div className="job-icon">
//                         <BriefcaseBusiness size={16} />
//                       </div>
//                       <span className="font-medium">{job.title}</span>
//                     </div>
//                   </td>
//                   <td>
//                     <div className="department-cell">
//                       <Building size={14} />
//                       {job.department}
//                     </div>
//                   </td>
//                   <td>
//                     <div className="location-cell">
//                       <MapPin size={14} />
//                       {Array.isArray(job.location) ? job.location.join(', ') : job.location}
//                     </div>
//                   </td>
//                   <td>
//                     <div className="openings-cell">
//                       {job.openings}
//                     </div>
//                   </td>
//                   <td>
//                     <div className={`filled-cell ${job.filled === job.openings ? 'filled-complete' : ''}`}>
//                       {job.filled}/{job.openings}
//                     </div>
//                   </td>
//                   {/* <td>
//                     <div className="matches-cell">
//                       {job.matches}
//                     </div>
//                   </td> */}
//                   <td>
//                     <button 
//                       className={`status-button ${job.status === 'active' ? 'status-active' : 'status-inactive'}`}
//                       onClick={() => toggleJobStatus(job.id)}
//                       disabled={loading}
//                     >
//                       {job.status === 'active' ? (
//                         <>
//                           <CheckCircle size={12} />
//                           Active
//                         </>
//                       ) : (
//                         <>
//                           <X size={12} />
//                           Inactive
//                         </>
//                       )}
//                     </button>
//                   </td>
//                   <td>
//                     <div className="action-buttons">
//                       <button 
//                         className="btn-icon btn-icon-view"
//                         onClick={() => handleViewJobMatches(job)}
//                         disabled={loading}
//                       >
//                         <Eye size={16} />
//                       </button>
//                       <button 
//                         className="btn-icon btn-icon-edit"
//                         onClick={() => {
//                           setSelectedJob(job);
//                           setIsEditMode(true);
//                           setActiveTab('createJob');
//                           setTechSkills(job.techSkills || []);
//                           setSoftSkills(job.softSkills || []);
//                         }}
//                         disabled={loading}
//                       >
//                         <Edit size={16} />
//                       </button>
//                       <button 
//                         className="btn-icon btn-icon-delete"
//                         onClick={() => handleDeleteJob(job.id)}
//                         disabled={loading}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );

//   const renderCreateJob = () => {
//     const jobToEdit = selectedJob || newJob;
//     const isEditing = !!selectedJob && isEditMode;

//     const handleSubmit = async (e) => {
//       e.preventDefault();
      
//       if (isEditing) {
//         await handleUpdateJob(jobToEdit);
//       } else {
//         await handleCreateJob();
//       }
//     };

//     return (
//       <div className="create-job">
//         <div className="section-header">
//           <div className="header-title">
//             <h2>
//               {isEditing ? (
//                 <>
//                   <Edit size={24} />
//                   Edit Job Profile
//                 </>
//               ) : (
//                 <>
//                   <Plus size={24} />
//                   Create New Job Profile
//                 </>
//               )}
//             </h2>
//             <p className="subtitle">
//               {isEditing ? 'Update existing job details' : 'Fill in the details to create a new job position'}
//             </p>
//           </div>
//           <button 
//             className="btn-secondary"
//             onClick={() => {
//               setSelectedJob(null);
//               setIsEditMode(false);
//               setActiveTab('jobs');
//               setNewJob({
//                 title: '',
//                 department: '',
//                 location: [''],
//                 openings: 1,
//                 requirements: '',
//                 techSkills: [],
//                 softSkills: [],
//                 description: '',
//                 salary: '',
//                 expiryDate: ''
//               });
//               setTechSkills([]);
//               setSoftSkills([]);
//             }}
//             disabled={loading}
//           >
//             <ArrowLeft size={18} />
//             Back to Jobs
//           </button>
//         </div>

//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <p>{isEditing ? 'Updating job...' : 'Creating job...'}</p>
//           </div>
//         )}

//         <div className="form-card">
//           <form onSubmit={handleSubmit}>
//             <div className="form-section">
//               <h3 className="form-section-title">
//                 <Briefcase size={20} />
//                 Basic Information
//               </h3>
//               <div className="form-row">
//                 <div className="form-group">
//                   <label>
//                     <span className="required">*</span>
//                     Job Title
//                   </label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     value={jobToEdit.title}
//                     onChange={(e) => isEditing ? 
//                       setSelectedJob({...jobToEdit, title: e.target.value}) :
//                       setNewJob({...newJob, title: e.target.value})
//                     }
//                     required
//                     placeholder="e.g., Senior Frontend Developer"
//                     disabled={loading}
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>
//                     <span className="required">*</span>
//                     Department
//                   </label>
//                   <select
//                     className="form-control"
//                     value={jobToEdit.department}
//                     onChange={(e) => isEditing ? 
//                       setSelectedJob({...jobToEdit, department: e.target.value}) :
//                       setNewJob({...newJob, department: e.target.value})
//                     }
//                     required
//                     disabled={loading}
//                   >
//                     <option value="">Select Department</option>
//                     <option value="Technology">Technology</option>
//                     <option value="Analytics">Analytics</option>
//                     <option value="Design">Design</option>
//                     <option value="Operations">Operations</option>
//                     <option value="Marketing">Marketing</option>
//                     <option value="Sales">Sales</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>
//                   <span className="required">*</span>
//                   Locations
//                   <span className="helper-text">
//                     (Add multiple locations if needed)
//                   </span>
//                 </label>
//                 {jobToEdit.location.map((loc, index) => (
//                   <div key={index} className="location-input-group">
//                     <input
//                       type="text"
//                       className="form-control"
//                       value={loc}
//                       onChange={(e) => {
//                         if (isEditing) {
//                           const newLocs = [...jobToEdit.location];
//                           newLocs[index] = e.target.value;
//                           setSelectedJob({...jobToEdit, location: newLocs});
//                         } else {
//                           updateLocationField(index, e.target.value);
//                         }
//                       }}
//                       required={index === 0}
//                       placeholder="e.g., Hyderabad"
//                       disabled={loading}
//                     />
//                     {jobToEdit.location.length > 1 && (
//                       <button
//                         type="button"
//                         className="btn-icon"
//                         onClick={() => {
//                           if (isEditing) {
//                             const newLocs = jobToEdit.location.filter((_, i) => i !== index);
//                             setSelectedJob({...jobToEdit, location: newLocs});
//                           } else {
//                             removeLocationField(index);
//                           }
//                         }}
//                         disabled={loading}
//                       >
//                         <X size={16} />
//                       </button>
//                     )}
//                   </div>
//                 ))}
//                 <button
//                   type="button"
//                   className="btn-secondary"
//                   onClick={addLocationField}
//                   disabled={loading}
//                 >
//                   <Plus size={16} />
//                   Add Another Location
//                 </button>
//               </div>

//               <div className="form-row">
//                 <div className="form-group">
//                   <label>
//                     <span className="required">*</span>
//                     Number of Openings
//                   </label>
//                   <input
//                     type="number"
//                     className="form-control"
//                     value={jobToEdit.openings}
//                     onChange={(e) => isEditing ? 
//                       setSelectedJob({...jobToEdit, openings: parseInt(e.target.value) || 1}) :
//                       setNewJob({...newJob, openings: parseInt(e.target.value) || 1})
//                     }
                    
//                     required
//                     disabled={loading}
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>
//                     <Calendar size={16} />
//                     Expiry Date
//                   </label>
//                   <input
//                     type="date"
//                     className="form-control"
//                     value={jobToEdit.expiryDate}
//                     onChange={(e) => isEditing ? 
//                       setSelectedJob({...jobToEdit, expiryDate: e.target.value}) :
//                       setNewJob({...newJob, expiryDate: e.target.value})
//                     }
//                     disabled={loading}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="form-section">
//               <h3 className="form-section-title">
//                 <BookOpen size={20} />
//                 Requirements & Skills
//               </h3>
              
//               <div className="form-group">
//                 <label>
//                   <span className="required">*</span>
//                   Technical Skills
//                 </label>
//                 <div className="skills-input">
//                   <input
//                     type="text"
//                     className="form-control"
//                     placeholder="Type technical skill and press Enter or comma"
//                     onKeyDown={handleTechSkillAdd}
//                     disabled={loading}
//                   />
//                   <div className="skills-tags">
//                     {(isEditing ? jobToEdit.techSkills || [] : techSkills).map((skill, index) => (
//                       <span key={index} className="skill-tag tech-tag">
//                         {skill}
//                         <button 
//                           type="button"
//                           className="tag-remove"
//                           onClick={() => {
//                             if (isEditing) {
//                               const newSkills = (jobToEdit.techSkills || []).filter((_, i) => i !== index);
//                               setSelectedJob({...jobToEdit, techSkills: newSkills});
//                             } else {
//                               removeTechSkill(index);
//                             }
//                           }}
//                           disabled={loading}
//                         >
//                           <X size={12} />
//                         </button>
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>
//                   Soft Skills
//                 </label>
//                 <div className="skills-input">
//                   <input
//                     type="text"
//                     className="form-control"
//                     placeholder="Type soft skill and press Enter or comma"
//                     onKeyDown={handleSoftSkillAdd}
//                     disabled={loading}
//                   />
//                   <div className="skills-tags">
//                     {(isEditing ? jobToEdit.softSkills || [] : softSkills).map((skill, index) => (
//                       <span key={index} className="skill-tag soft-tag">
//                         {skill}
//                         <button 
//                           type="button"
//                           className="tag-remove"
//                           onClick={() => {
//                             if (isEditing) {
//                               const newSkills = (jobToEdit.softSkills || []).filter((_, i) => i !== index);
//                               setSelectedJob({...jobToEdit, softSkills: newSkills});
//                             } else {
//                               removeSoftSkill(index);
//                             }
//                           }}
//                           disabled={loading}
//                         >
//                           <X size={12} />
//                         </button>
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>
//                   <span className="required">*</span>
//                   Job Description
//                 </label>
//                 <textarea
//                   className="form-control"
//                   rows="4"
//                   value={jobToEdit.description}
//                   onChange={(e) => isEditing ? 
//                     setSelectedJob({...jobToEdit, description: e.target.value}) :
//                     setNewJob({...newJob, description: e.target.value})
//                   }
//                   placeholder="Describe the job role, responsibilities, and expectations..."
//                   required
//                   disabled={loading}
//                 ></textarea>
//               </div>

//               <div className="form-group">
//                 <label>
//                   <span className="required">*</span>
//                   Requirements & Qualifications
//                 </label>
//                 <textarea
//                   className="form-control"
//                   rows="4"
//                   value={jobToEdit.requirements}
//                   onChange={(e) => isEditing ? 
//                     setSelectedJob({...jobToEdit, requirements: e.target.value}) :
//                     setNewJob({...newJob, requirements: e.target.value})
//                   }
//                   placeholder="List the required experience, education, certifications, etc."
//                   required
//                   disabled={loading}
//                 ></textarea>
//               </div>
//             </div>

//             <div className="form-actions">
//               <button 
//                 type="button" 
//                 className="btn-secondary"
//                 onClick={() => {
//                   setSelectedJob(null);
//                   setIsEditMode(false);
//                   setActiveTab('jobs');
//                   setNewJob({
//                     title: '',
//                     department: '',
//                     location: [''],
//                     openings: 1,
//                     requirements: '',
//                     techSkills: [],
//                     softSkills: [],
//                     description: '',
//                     salary: '',
//                     expiryDate: ''
//                   });
//                   setTechSkills([]);
//                   setSoftSkills([]);
//                 }}
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button 
//                 type="submit" 
//                 className="btn-primary"
//                 disabled={loading}
//               >
//                 {isEditing ? (
//                   <>
//                     <Check size={18} />
//                     {loading ? 'Updating...' : 'Update Job Profile'}
//                   </>
//                 ) : (
//                   <>
//                     <Plus size={18} />
//                     {loading ? 'Creating...' : 'Create Job Profile'}
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     );
//   };

//   const renderTraineesList = () => {
//     const uniqueLocations = [...new Set(allTrainees.map(t => t.location).filter(loc => loc))];
    
//     // Calculate Open Pool count based on actual no-match trainees
//     const openPoolCount = traineesWithNoMatches.length;
    
//     return (
//       <div className="trainees-list">
//         <div className="section-header">
//           <div className="header-title">
//             <h2>
//               <Users size={24} />
//               Trainees Management
//             </h2>
//             <p className="subtitle">Manage and track all trainees in the system</p>
//           </div>
//           <div className="view-options">
//             <button 
//               className={`btn-view-option ${activeTab === 'trainees' ? 'active' : ''}`}
//               onClick={() => setActiveTab('trainees')}
//             >
//               All Trainees
//             </button>
//             <button 
//               className={`btn-view-option ${activeTab === 'mapped' ? 'active' : ''}`}
//               onClick={() => setActiveTab('mapped')}
//             >
//               <CheckCircle size={16} />
//               Mapped ({stats.mappedTrainees})
//             </button>
//             <button 
//               className={`btn-view-option ${activeTab === 'unmapped' ? 'active' : ''}`}
//               onClick={() => setActiveTab('unmapped')}
//             >
//               <AlertCircle size={16} />
//               Unmapped ({stats.unmappedTrainees})
//             </button>
//             {/* Open Pool Tab - Now shows actual count from API check */}
//             <button 
//               className={`btn-view-option ${activeTab === 'openPool' ? 'active' : ''}`}
//               onClick={() => setActiveTab('openPool')}
//             >
//               <Users2 size={16} />
//               Open Pool ({openPoolCount})
//             </button>
//           </div>
//         </div>

//         <div className="search-filter">
//           <div className="search-box">
//             <input 
//               type="text" 
//               className="search-input" 
//               placeholder="Search trainees by name, skills, or location..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//           <div className="filter-group">
//             <select 
//               className="filter-select"
//               value={locationFilter}
//               onChange={(e) => setLocationFilter(e.target.value)}
//             >
//               <option value="">All Locations</option>
//               {uniqueLocations.map(location => (
//                 <option key={location} value={location}>
//                   {location.charAt(0).toUpperCase() + location.slice(1)}
//                 </option>
//               ))}
//             </select>
//             <button className="btn-icon" onClick={() => {
//               setSearchQuery('');
//               setLocationFilter('');
//             }}>
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {/* Show loading state for Open Pool checking */}
//         {checkingMatches && activeTab === 'openPool' && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <p>Checking trainee matches for Open Pool...</p>
//           </div>
//         )}

//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <p>Loading trainees...</p>
//           </div>
//         )}

//         {error && (
//           <div className="error-message">
//             <AlertCircle size={20} />
//             <span>{error}</span>
//           </div>
//         )}

//         {trainees.length === 0 && !loading && !checkingMatches && (
//           <div className="no-data">
//             <Users size={48} />
//             <h3>No Trainees Found</h3>
//             <p>No trainees match your search criteria or no trainees available</p>
//             {activeTab === 'openPool' && (
//               <button 
//                 className="btn-primary"
//                 onClick={checkTraineesForOpenPool}
//                 disabled={checkingMatches}
//               >
//                 <Search size={18} />
//                 Re-check for Open Pool
//               </button>
//             )}
//           </div>
//         )}

//         <div className="trainees-grid">
//           {trainees.map(trainee => (
//             <div key={trainee.id} className="trainee-card">
//               <div className="trainee-header">
//                 <div className="trainee-info-main">
//                   <div className="trainee-avatar">
//                     {trainee.name.charAt(0)}
//                   </div>
//                   <div className="trainee-info">
//                     <h4>{trainee.name}</h4>
//                     <div className="trainee-meta">
//                       <span className="trainee-email">
//                         <Mail size={14} />
//                         {trainee.email}
//                       </span>
//                       <span className="trainee-location">
//                         <MapPin size={14} />
//                         {trainee.location}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className={`mapping-indicator ${trainee.isMapped ? 'mapped' : 'unmapped'}`}>
//                   {trainee.isMapped ? (
//                     <>
//                       <CheckCircle size={14} />
//                       Mapped
//                       {trainee.projectName && (
//                         <span className="project-name-small">: {trainee.projectName}</span>
//                       )}
//                     </>
//                   ) : (
//                     <>
//                       <AlertCircle size={14} />
//                       Unmapped
//                       {activeTab === 'openPool' && (
//                         <span className="open-pool-badge">No Matches</span>
//                       )}
//                     </>
//                   )}
//                 </div>
//               </div>
              
//               <div className="trainee-skills">
//                 {trainee.skills.slice(0, 4).map(skill => (
//                   <span key={skill} className="skill-tag">
//                     {skill}
//                   </span>
//                 ))}
//                 {trainee.skills.length > 4 && (
//                   <span className="skill-tag-more">
//                     +{trainee.skills.length - 4}
//                   </span>
//                 )}
//               </div>
              
//               <div className="trainee-stats">
//                 <div className="trainee-stat">
//                   <span className="stat-label">Average Score</span>
//                   <div className="score-progress">
//                     <div className="progress-bar">
//                       <div 
//                         className="progress-fill" 
//                         style={{ width: `${trainee.score}%` }}
//                       ></div>
//                     </div>
//                     <span className="score-value">{trainee.score}%</span>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="trainee-actions">
//                 <button 
//                   className="btn-action btn-profile"
//                   onClick={() => handleViewTraineeProfile(trainee)}
//                 >
//                   <User size={16} />
//                   View Profile
//                 </button>
//                 {/* {activeTab === 'openPool' && !trainee.isMapped && (
//                   <button 
//                     className="btn-action btn-primary"
//                     onClick={() => {
//                       setSelectedTrainee(trainee);
//                       fetchTraineeMatches(trainee.userId || trainee.id);
//                     }}
//                   >
//                     <Search size={16} />
//                     Check Matches
//                   </button>
//                 )} */}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   const renderJobModal = () => {
//     if (!selectedJob || isEditMode) return null;

//     const handleDelete = async () => {
//       if (window.confirm('Are you sure you want to delete this job?')) {
//         await handleDeleteJob(selectedJob.id);
//         setSelectedJob(null);
//       }
//     };

//     return (
//       <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
//         <div className="modal-content" onClick={e => e.stopPropagation()}>
//           <div className="modal-header">
//             <div className="modal-title">
//               <Briefcase size={24} />
//               <h2>{selectedJob.title}</h2>
//             </div>
//             <button className="modal-close" onClick={() => setSelectedJob(null)} disabled={loading}>
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className="modal-body">
//             {loading && (
//               <div className="loading-overlay">
//                 <div className="loading-spinner"></div>
//                 <p>Loading...</p>
//               </div>
//             )}

//             <div className="job-details-grid">
//               <div className="detail-item">
//                 <Building size={16} />
//                 <div>
//                   <span className="detail-label">Department</span>
//                   <span className="detail-value">{selectedJob.department}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <MapPin size={16} />
//                 <div>
//                   <span className="detail-label">Location</span>
//                   <span className="detail-value">{Array.isArray(selectedJob.location) ? selectedJob.location.join(', ') : selectedJob.location}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <BriefcaseBusiness size={16} />
//                 <div>
//                   <span className="detail-label">Openings</span>
//                   <span className="detail-value">{selectedJob.openings} ({selectedJob.filled} filled)</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <Dollar size={16} />
//                 <div>
//                   <span className="detail-label">Salary</span>
//                   <span className="detail-value">{selectedJob.salary}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <div className={`status-badge status-${selectedJob.status}`}>
//                   {selectedJob.status === 'active' ? 'Active' : 'Inactive'}
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <CalendarDays size={16} />
//                 <div>
//                   <span className="detail-label">Posted</span>
//                   <span className="detail-value">{selectedJob.postedDate}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <Calendar size={16} />
//                 <div>
//                   <span className="detail-label">Expires</span>
//                   <span className="detail-value">{selectedJob.expiryDate}</span>
//                 </div>
//               </div>
//             </div>

//             <div className="job-section">
//               <h3>Job Description</h3>
//               <p>{selectedJob.description}</p>
//             </div>

//             <div className="job-section">
//               <h3>Requirements</h3>
//               <p>{selectedJob.requirements}</p>
//             </div>

//             <div className="job-section">
//               <h3>Technical Skills</h3>
//               <div className="skills-list">
//                 {selectedJob.techSkills.map(skill => (
//                   <span key={skill} className="skill-tag tech-tag">
//                     {skill}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             <div className="job-section">
//               <h3>Soft Skills</h3>
//               <div className="skills-list">
//                 {selectedJob.softSkills.map(skill => (
//                   <span key={skill} className="skill-tag soft-tag">
//                     {skill}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button 
//                 className="btn-secondary" 
//                 onClick={() => setSelectedJob(null)}
//                 disabled={loading}
//               >
//                 Close
//               </button>
//               <button 
//                 className="btn-danger" 
//                 onClick={handleDelete}
//                 disabled={loading}
//               >
//                 <Trash2 size={18} />
//                 Delete Job
//               </button>
//               <button 
//                 className="btn-primary" 
//                 onClick={() => {
//                   setIsEditMode(true);
//                   setActiveTab('createJob');
//                   setTechSkills(selectedJob.techSkills || []);
//                   setSoftSkills(selectedJob.softSkills || []);
//                 }}
//                 disabled={loading}
//               >
//                 <Edit size={18} />
//                 Edit Job
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderJobMatchesModal = () => {
//     if (!selectedJob || jobMatches === null) return null;

//     const bucketConfig = {
//       perfect_match: { title: 'Perfect Match', color: 'bucket-perfect' },
//       skills_only: { title: 'Skills Only', color: 'bucket-skills' },
//       location_only: { title: 'Location Only', color: 'bucket-location' },
//       nearby: { title: 'Nearby', color: 'bucket-nearby' },
//       no_match: { title: 'No Match', color: 'bucket-no-match' }
//     };

//     // Get list of already mapped trainee names for filtering
//     const mappedTraineeNames = getMappedTraineeNames();

//     return (
//       <div className="modal-overlay" onClick={() => {
//         setSelectedJob(null);
//         setJobMatches(null);
//       }}>
//         <div className="modal-content job-matches-modal" onClick={e => e.stopPropagation()}>
//           <div className="modal-header">
//             <div className="modal-title">
//               <Users size={24} />
//               <div>
//                 <h2>{jobMatches.job_title} - Matches</h2>
//                 <p className="subtitle">
//                   Total Matches: {jobMatches.total_matches} | 
//                   Available: {jobMatches.total_matches - mappedTraineeNames.length}
//                 </p>
//               </div>
//             </div>
//             <button className="modal-close" onClick={() => {
//               setSelectedJob(null);
//               setJobMatches(null);
//             }}>
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className="modal-body">
//             {jobMatchesLoading ? (
//               <div className="loading-state">
//                 <div className="loading-spinner"></div>
//                 <p>Loading job matches...</p>
//               </div>
//             ) : (
//               <div className="job-matches-content">
//                 <div className="match-summary">
//                   <div className="summary-card">
//                     <h3>Total Matches</h3>
//                     <div className="summary-value">{jobMatches.total_matches}</div>
//                   </div>
//                   <div className="summary-card">
//                     <h3>Job ID</h3>
//                     <div className="summary-value">#{jobMatches.job_id}</div>
//                   </div>
//                   <div className="summary-card">
//                     <h3>Openings</h3>
//                     <div className="summary-value">
//                       {selectedJob.openings} ({selectedJob.filled} filled)
//                       {selectedJob.openings <= 0 && (
//                         <div className="job-full-notice">
//                           <AlertCircle size={12} />
//                           Job is full
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
                
//                 {Object.entries(bucketConfig).map(([bucketKey, config]) => {
//                   const bucketData = jobMatches[bucketKey];
//                   if (!bucketData || bucketData.length === 0) return null;
                  
//                   // Filter out already mapped trainees
//                   const availableMatches = bucketData.filter(match => 
//                     !mappedTraineeNames.includes(match.trainee_name)
//                   );
                  
//                   if (availableMatches.length === 0) return null;
                  
//                   return (
//                     <div key={bucketKey} className={`bucket-section ${config.color}`}>
//                       <h3 className="bucket-title">
//                         {config.title} ({availableMatches.length} available of {bucketData.length})
//                       </h3>
//                       <div className="bucket-grid">
//                         {availableMatches.map((match) => (
//                           <div key={match.id || match.trainee_id} className="trainee-match-card">
//                             <div className="match-percentage">
//                               {match.total_percentage.toFixed(1)}%
//                             </div>
//                             <div className="bucket-tag">
//                               {match.bucket?.replace('_', ' ') || config.title}
//                             </div>
//                             <h4>{match.trainee_name}</h4>
//                             <div className="match-breakdown">
//                               <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
//                               <span>Location: {match.location_percentage.toFixed(1)}%</span>
//                             </div>
//                             <p className="location-info">
//                               <MapPin size={14} />
//                               {match.trainee_location}
//                             </p>
//                             <div className="match-actions">
//                               <button 
//                                 className="view-trainee-btn"
//                                 onClick={() => handleViewTraineeProfileFromJob(match)}
//                               >
//                                 <User size={16} />
//                                 View Profile
//                               </button>
//                               <button 
//                                 className="map-to-project-btn"
//                                 onClick={() => {
//                                   // Check if job still has openings
//                                   if (selectedJob.openings <= 0) {
//                                     toast.error('This job has no openings available.');
//                                     return;
//                                   }
//                                   match && handleMapToProject(match, selectedJob);
//                                 }}
//                                 disabled={selectedJob.openings <= 0}
//                               >
//                                 <Link size={16} />
//                                 {selectedJob.openings <= 0 ? 'Job Full' : 'Map to Project'}
//                               </button>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 })}
                
//                 {/* Show message if all trainees are already mapped */}
//                 {Object.values(bucketConfig).every(({ title }) => {
//                   const bucketKey = Object.keys(bucketConfig).find(key => bucketConfig[key].title === title);
//                   const bucketData = jobMatches[bucketKey];
//                   if (!bucketData) return true;
//                   const availableMatches = bucketData.filter(match => 
//                     !mappedTraineeNames.includes(match.trainee_name)
//                   );
//                   return availableMatches.length === 0;
//                 }) && (
//                   <div className="no-available-matches">
//                     <AlertCircle size={48} />
//                     <h3>All matched trainees are already mapped to other jobs</h3>
//                     <p>Check the Open Pool tab for unmapped trainees with no matches.</p>
//                     <button 
//                       className="btn-primary"
//                       onClick={() => {
//                         setSelectedJob(null);
//                         setJobMatches(null);
//                         setActiveTab('openPool');
//                       }}
//                     >
//                       <Users2 size={18} />
//                       Go to Open Pool
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
          
//           <div className="modal-footer">
//             <div className="footer-actions">
//               <button 
//                 className="btn-secondary"
//                 onClick={() => {
//                   setSelectedJob(null);
//                   setJobMatches(null);
//                 }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderTraineeModal = () => {
//     if (!selectedTrainee) return null;

//     const traineeData = selectedTrainee.traineeData || selectedTrainee;
//     const userInfo = traineeData.userInfo || {};

//     return (
//       <div className="modal-overlay" onClick={() => {
//         setSelectedTrainee(null);
//         setTraineeMatches(null);
//       }}>
//         <div className="modal-content trainee-profile-modal" onClick={e => e.stopPropagation()}>
//           <div className="modal-header">
//             <div className="modal-title">
//               <User size={24} />
//               <h2>{userInfo.name || selectedTrainee.name}</h2>
//             </div>
//             <button className="modal-close" onClick={() => {
//               setSelectedTrainee(null);
//               setTraineeMatches(null);
//             }}>
//               <X size={24} />
//             </button>
//           </div>

//           <div className="modal-body">
//             {traineeMatchesLoading ? (
//               <div className="loading-state">
//                 <div className="loading-spinner"></div>
//                 <p>Loading trainee matches...</p>
//               </div>
//             ) : (
//               <>
//                 <div className="trainee-details-section">
//                   <div className="mapping-status-section">
//                     <h4>Project Mapping</h4>
//                     <div className={`mapping-status ${selectedTrainee.isMapped ? 'mapped' : 'unmapped'}`}>
//                       <div className="status-indicator">
//                         {selectedTrainee.isMapped ? (
//                           <>
//                             <CheckCircle size={20} />
//                             <div>
//                               <strong>Mapped to Project</strong>
//                               <p>{selectedTrainee.projectName || 'Unknown Project'}</p>
//                               <small>Project ID: {selectedTrainee.projectId || 'N/A'}</small>
//                             </div>
//                           </>
//                         ) : (
//                           <>
//                             <AlertCircle size={20} />
//                             <div>
//                               <strong>Not Assigned</strong>
//                               <p>This trainee is available for project assignment</p>
//                               {traineeMatches && traineeMatches.total_matches === 0 && (
//                                 <div className="open-pool-status">
//                                   <Users2 size={16} />
//                                   <span>This trainee has no job matches (Open Pool)</span>
//                                 </div>
//                               )}
//                             </div>
//                           </>
//                         )}
//                       </div>
                      
//                       {selectedTrainee.isMapped ? (
//                         <button 
//                           className="btn-danger"
//                           onClick={() => handleUnmapFromProject(selectedTrainee)}
//                           disabled={loading}
//                         >
//                           <X size={18} />
//                           Unmap from Project
//                         </button>
//                       ) : (
//                         <div className="available-for-mapping">
//                           <p>Available for mapping to matching projects</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="profile-header">
//                     <div className="profile-avatar">
//                       {selectedTrainee.name.charAt(0)}
//                     </div>
//                     <div className="profile-info">
//                       <h3>{userInfo.name || selectedTrainee.name}</h3>
//                       <div className="profile-role">TRAINEE</div>
//                       <div className="profile-meta">
//                         <span className="profile-meta-item">
//                           <MapPin size={16} />
//                           {userInfo.location || selectedTrainee.location}
//                         </span>
//                         <span className="profile-meta-item">
//                           <Mail size={16} />
//                           {selectedTrainee.email}
//                         </span>
//                         <span className="profile-meta-item">
//                           <Target size={16} />
//                           DPI: {traineeData.dpi || 'N/A'}
//                         </span>
//                         <span className="profile-meta-item">
//                           <BarChart2 size={16} />
//                           Score: {userInfo.averageScore || selectedTrainee.score}%
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="trainee-details-grid">
//                     <div className="detail-item">
//                       <span className="detail-label">User ID</span>
//                       <span className="detail-value">{userInfo.userId || 'N/A'}</span>
//                     </div>
//                     <div className="detail-item">
//                       <span className="detail-label">Employee ID</span>
//                       <span className="detail-value">{userInfo.employeeId || 'N/A'}</span>
//                     </div>
//                     <div className="detail-item">
//                       <span className="detail-label">ISU</span>
//                       <span className="detail-value">{userInfo.isu || 'N/A'}</span>
//                     </div>
//                     <div className="detail-item">
//                       <span className="detail-label">Batch Rank</span>
//                       <span className="detail-value">{traineeData.batchRank || 'N/A'}</span>
//                     </div>
//                     <div className="detail-item">
//                       <span className="detail-label">Group Rank</span>
//                       <span className="detail-value">{traineeData.groupRank || 'N/A'}</span>
//                     </div>
//                     <div className="detail-item">
//                       <span className="detail-label">Average Score</span>
//                       <span className="detail-value">{userInfo.averageScore || 0}%</span>
//                     </div>
//                   </div>

//                   <div className="skills-section">
//                     <h4>Strengths</h4>
//                     <div className="skills-list">
//                       {traineeData.strengths?.map((strength, index) => (
//                         <span key={index} className="skill-tag tech-tag">
//                           {strength.courseName} ({strength.avgScore}%)
//                         </span>
//                       )) || <span className="no-data">No strengths data</span>}
//                     </div>

//                     <h4>Weaknesses</h4>
//                     <div className="skills-list">
//                       {traineeData.weaknesses?.map((weakness, index) => (
//                         <span key={index} className="skill-tag soft-tag">
//                           {weakness.courseName} ({weakness.avgScore}%)
//                         </span>
//                       )) || <span className="no-data">No weaknesses data</span>}
//                     </div>

//                     {/* <h4>Upskill Courses</h4>
//                     <div className="skills-list">
//                       {traineeData.upskillCourses ? (
//                         <span className="skill-tag">{traineeData.upskillCourses}</span>
//                       ) : (
//                         <span className="no-data">No upskill courses</span>
//                       )}
//                     </div> */}

//                     <h4>Certificates</h4>
//                     {/* <div className="skills-list">
//                       {traineeData.certificates ? (
//                         <span className="skill-tag">{traineeData.certificates}</span>
//                       ) : (
//                         <span className="no-data">No certificates</span>
//                       )}
//                     </div> */}
//                   </div>
//                 </div>

//                 {!selectedTrainee.isMapped && (
//                   <div className="projects-section">
//                     <div className="projects-header">
//                       <h3 className="section-title">
//                         <Briefcase size={18} />
//                         Project Matches
//                         {traineeMatches && (
//                           <span className="project-count">
//                             ({traineeMatches.total_matches} matches)
//                           </span>
//                         )}
//                       </h3>
//                     </div>

//                     {traineeMatches ? (
//                       <>
//                         {traineeMatches.total_matches === 0 || 
//                          (traineeMatches.total_matches > 0 && 
//                           traineeMatches.no_match && 
//                           traineeMatches.no_match.length > 0 &&
//                           (!traineeMatches.perfect_match || traineeMatches.perfect_match.length === 0) &&
//                           (!traineeMatches.skills_only || traineeMatches.skills_only.length === 0) &&
//                           (!traineeMatches.location_only || traineeMatches.location_only.length === 0) &&
//                           (!traineeMatches.nearby || traineeMatches.nearby.length === 0)) ? (
//                           <div className="no-matches open-pool-message">
//                             <Users2 size={48} />
//                             <h3>No Job Matches Found</h3>
//                             <p>This trainee has no matches with any existing jobs.</p>
//                             <div className="open-pool-info">
//                               <p><strong>This trainee is in the Open Pool.</strong></p>
//                               <p>Consider creating a new job or reassessing skill requirements.</p>
//                               <button 
//                                 className="btn-primary"
//                                 onClick={() => {
//                                   setSelectedTrainee(null);
//                                   setTraineeMatches(null);
//                                   setActiveTab('createJob');
//                                 }}
//                               >
//                                 <Plus size={18} />
//                                 Create New Job
//                               </button>
//                             </div>
//                           </div>
//                         ) : (
//                           <>
//                             {traineeMatches.perfect_match && traineeMatches.perfect_match.length > 0 && (
//                               <div className="bucket-section bucket-perfect">
//                                 <h3 className="bucket-title">Perfect Match ({traineeMatches.perfect_match.length})</h3>
//                                 <div className="projects-grid">
//                                   {traineeMatches.perfect_match.map((match) => {
//                                     const job = jobs.find(j => j.id === match.job_id);
//                                     // Skip jobs that are full (openings = 0)
//                                     if (job && job.openings <= 0) return null;
                                    
//                                     return (
//                                       <div key={match.match_id} className="project-match-card">
//                                         <div className="match-card-header">
//                                           <div className="project-title">
//                                             <h4>{match.job_title}</h4>
//                                             <div className="project-meta">
//                                               <span>
//                                                 <Building size={14} />
//                                                 Job ID: #{match.job_id}
//                                               </span>
//                                               <span>
//                                                 <MapPin size={14} />
//                                                 {Array.isArray(match.job_location) ? match.job_location.join(', ') : match.job_location}
//                                               </span>
//                                             </div>
//                                           </div>
//                                           <div className={`match-score ${match.total_percentage >= 80 ? 'high' : match.total_percentage >= 50 ? 'medium' : 'low'}`}>
//                                             <Target size={14} />
//                                             {match.total_percentage.toFixed(1)}%
//                                           </div>
//                                         </div>
//                                         <div className="match-details">
//                                           <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
//                                           <span>Location: {match.location_percentage.toFixed(1)}%</span>
//                                           <span>
//                                             <Calendar size={14} />
//                                             Posted: {match.posted_date}
//                                           </span>
//                                         </div>
//                                         <div className="project-actions">
//                                           <button 
//                                             className="map-to-project-btn"
//                                             onClick={() => {
//                                               const job = jobs.find(j => j.id === match.job_id);
//                                               if (job) {
//                                                 if (job.openings <= 0) {
//                                                   toast.error('This job has no openings available.');
//                                                   return;
//                                                 }
//                                                 handleMapToProject(selectedTrainee, job);
//                                               }
//                                             }}
//                                             disabled={job && job.openings <= 0}
//                                           >
//                                             <Link size={16} />
//                                             {job && job.openings <= 0 ? 'Job Full' : 'Map to Project'}
//                                           </button>
//                                         </div>
//                                       </div>
//                                     );
//                                   })}
//                                 </div>
//                               </div>
//                             )}

//                             {traineeMatches.skills_only && traineeMatches.skills_only.length > 0 && (
//                               <div className="bucket-section bucket-skills">
//                                 <h3 className="bucket-title">Skills Only ({traineeMatches.skills_only.length})</h3>
//                                 <div className="projects-grid">
//                                   {traineeMatches.skills_only.map((match) => {
//                                     const job = jobs.find(j => j.id === match.job_id);
//                                     if (job && job.openings <= 0) return null;
                                    
//                                     return (
//                                       <div key={match.match_id} className="project-match-card">
//                                         <div className="match-card-header">
//                                           <div className="project-title">
//                                             <h4>{match.job_title}</h4>
//                                             <div className="project-meta">
//                                               <span>
//                                                 <Building size={14} />
//                                                 Job ID: #{match.job_id}
//                                               </span>
//                                             </div>
//                                           </div>
//                                           <div className="match-score medium">
//                                             <Target size={14} />
//                                             {match.total_percentage.toFixed(1)}%
//                                           </div>
//                                         </div>
//                                         <div className="match-details">
//                                           <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
//                                           <span>
//                                             <Calendar size={14} />
//                                             Posted: {match.posted_date}
//                                           </span>
//                                         </div>
//                                         <div className="project-actions">
//                                           <button 
//                                             className="map-to-project-btn"
//                                             onClick={() => {
//                                               const job = jobs.find(j => j.id === match.job_id);
//                                               if (job) {
//                                                 if (job.openings <= 0) {
//                                                   toast.error('This job has no openings available.');
//                                                   return;
//                                                 }
//                                                 handleMapToProject(selectedTrainee, job);
//                                               }
//                                             }}
//                                             disabled={job && job.openings <= 0}
//                                           >
//                                             <Link size={16} />
//                                             {job && job.openings <= 0 ? 'Job Full' : 'Map to Project'}
//                                           </button>
//                                         </div>
//                                       </div>
//                                     );
//                                   })}
//                                 </div>
//                               </div>
//                             )}

//                             {traineeMatches.location_only && traineeMatches.location_only.length > 0 && (
//                               <div className="bucket-section bucket-location">
//                                 <h3 className="bucket-title">Location Only ({traineeMatches.location_only.length})</h3>
//                                 <div className="projects-grid">
//                                   {traineeMatches.location_only.map((match) => {
//                                     const job = jobs.find(j => j.id === match.job_id);
//                                     if (job && job.openings <= 0) return null;
                                    
//                                     return (
//                                       <div key={match.match_id} className="project-match-card">
//                                         <div className="match-card-header">
//                                           <div className="project-title">
//                                             <h4>{match.job_title}</h4>
//                                             <div className="project-meta">
//                                               <span>
//                                                 <Building size={14} />
//                                                 Job ID: #{match.job_id}
//                                               </span>
//                                             </div>
//                                           </div>
//                                           <div className="match-score medium">
//                                             <Target size={14} />
//                                             {match.total_percentage.toFixed(1)}%
//                                           </div>
//                                         </div>
//                                         <div className="match-details">
//                                           <span>Location: {match.location_percentage.toFixed(1)}%</span>
//                                           <span>
//                                             <Calendar size={14} />
//                                             Posted: {match.posted_date}
//                                           </span>
//                                         </div>
//                                         <div className="project-actions">
//                                           <button 
//                                             className="map-to-project-btn"
//                                             onClick={() => {
//                                               const job = jobs.find(j => j.id === match.job_id);
//                                               if (job) {
//                                                 if (job.openings <= 0) {
//                                                   toast.error('This job has no openings available.');
//                                                   return;
//                                                 }
//                                                 handleMapToProject(selectedTrainee, job);
//                                               }
//                                             }}
//                                             disabled={job && job.openings <= 0}
//                                           >
//                                             <Link size={16} />
//                                             {job && job.openings <= 0 ? 'Job Full' : 'Map to Project'}
//                                           </button>
//                                         </div>
//                                       </div>
//                                     );
//                                   })}
//                                 </div>
//                               </div>
//                             )}

//                             {traineeMatches.nearby && traineeMatches.nearby.length > 0 && (
//                               <div className="bucket-section bucket-nearby">
//                                 <h3 className="bucket-title">Nearby ({traineeMatches.nearby.length})</h3>
//                                 <div className="projects-grid">
//                                   {traineeMatches.nearby.map((match) => {
//                                     const job = jobs.find(j => j.id === match.job_id);
//                                     if (job && job.openings <= 0) return null;
                                    
//                                     return (
//                                       <div key={match.match_id} className="project-match-card">
//                                         <div className="match-card-header">
//                                           <div className="project-title">
//                                             <h4>{match.job_title}</h4>
//                                             <div className="project-meta">
//                                               <span>
//                                                 <Building size={14} />
//                                                 Job ID: #{match.job_id}
//                                               </span>
//                                             </div>
//                                           </div>
//                                           <div className="match-score low">
//                                             <Target size={14} />
//                                             {match.total_percentage.toFixed(1)}%
//                                           </div>
//                                         </div>
//                                         <div className="match-details">
//                                           <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
//                                           <span>Location: {match.location_percentage.toFixed(1)}%</span>
//                                           <span>
//                                             <Calendar size={14} />
//                                             Posted: {match.posted_date}
//                                           </span>
//                                         </div>
//                                         <div className="project-actions">
//                                           <button 
//                                             className="map-to-project-btn"
//                                             onClick={() => {
//                                               const job = jobs.find(j => j.id === match.job_id);
//                                               if (job) {
//                                                 if (job.openings <= 0) {
//                                                   toast.error('This job has no openings available.');
//                                                   return;
//                                                 }
//                                                 handleMapToProject(selectedTrainee, job);
//                                               }
//                                             }}
//                                             disabled={job && job.openings <= 0}
//                                           >
//                                             <Link size={16} />
//                                             {job && job.openings <= 0 ? 'Job Full' : 'Map to Project'}
//                                           </button>
//                                         </div>
//                                       </div>
//                                     );
//                                   })}
//                                 </div>
//                               </div>
//                             )}

//                             {traineeMatches.no_match && traineeMatches.no_match.length > 0 && (
//                               <div className="bucket-section bucket-no-match">
//                                 <h3 className="bucket-title">No Match ({traineeMatches.no_match.length})</h3>
//                                 <div className="projects-grid">
//                                   {traineeMatches.no_match.map((match) => {
//                                     const job = jobs.find(j => j.id === match.job_id);
//                                     if (job && job.openings <= 0) return null;
                                    
//                                     return (
//                                       <div key={match.match_id} className="project-match-card">
//                                         <div className="match-card-header">
//                                           <div className="project-title">
//                                             <h4>{match.job_title}</h4>
//                                             <div className="project-meta">
//                                               <span>
//                                                 <Building size={14} />
//                                                 Job ID: #{match.job_id}
//                                               </span>
//                                             </div>
//                                           </div>
//                                           <div className="match-score low">
//                                             <Target size={14} />
//                                             {match.total_percentage.toFixed(1)}%
//                                           </div>
//                                         </div>
//                                         <div className="match-details">
//                                           <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
//                                           <span>Location: {match.location_percentage.toFixed(1)}%</span>
//                                           <span>
//                                             <Calendar size={14} />
//                                             Posted: {match.posted_date}
//                                           </span>
//                                         </div>
//                                         <div className="project-actions">
//                                           <button 
//                                             className="map-to-project-btn"
//                                             onClick={() => {
//                                               const job = jobs.find(j => j.id === match.job_id);
//                                               if (job) {
//                                                 if (job.openings <= 0) {
//                                                   toast.error('This job has no openings available.');
//                                                   return;
//                                                 }
//                                                 handleMapToProject(selectedTrainee, job);
//                                               }
//                                             }}
//                                             disabled={job && job.openings <= 0}
//                                           >
//                                             <Link size={16} />
//                                             {job && job.openings <= 0 ? 'Job Full' : 'Map to Project'}
//                                           </button>
//                                         </div>
//                                       </div>
//                                     );
//                                   })}
//                                 </div>
//                               </div>
//                             )}
//                           </>
//                         )}
//                       </>
//                     ) : (
//                       <div className="no-matches-data">
//                         <Users size={48} />
//                         <h3>No match data loaded</h3>
//                         <p>Click the button below to fetch project matches for this trainee</p>
//                         <button 
//                           className="btn-primary"
//                           onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}
//                         >
//                           <Search size={18} />
//                           Find Project Matches
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </>
//             )}
//           </div>

//           <div className="modal-footer">
//             <div className="footer-actions">
//               <button 
//                 className="btn-secondary"
//                 onClick={() => {
//                   setSelectedTrainee(null);
//                   setTraineeMatches(null);
//                 }}
//               >
//                 Close
//               </button>
//               {!selectedTrainee.isMapped && !traineeMatches && !traineeMatchesLoading && (
//                 <button 
//                   className="btn-primary"
//                   onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}
//                 >
//                   <Search size={18} />
//                   Find Matches
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'dashboard':
//         return renderDashboard();
//       case 'jobs':
//         return renderJobManagement();
//       case 'createJob':
//         return renderCreateJob();
//       case 'trainees':
//       case 'mapped':
//       case 'unmapped':
//       case 'openPool':
//         return renderTraineesList();
//       default:
//         return renderDashboard();
//     }
//   };

//   const sidebarItems = [
//     { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
//     { id: 'jobs', label: 'Job Management', icon: <Briefcase size={20} /> },
//     { id: 'trainees', label: 'Trainees List', icon: <Users size={20} /> },
//   ];

//   return (
//     <div className="dashboard">
//       <Toaster richColors position="top-right" />

//       <Sidebar 
//         items={sidebarItems}
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//         userData={userData}
//         onLogout={onLogout}
//       />
      
//       <div className="main-content">
//         <div className="dashboard-header">
//           <div className="header-title">
//             <h1>
//               <LayoutDashboard size={28} />
//               HR Dashboard
//             </h1>
//             <div className="header-subtitle">
//               Welcome back, {userData?.name || 'HR Manager'} | Talent Management & Job Allocation
//             </div>
//           </div>
//           <div className="header-actions">
//             {loading && (
//               <div className="loading-indicator">
//                 <div className="loading-spinner small"></div>
//                 <span>Processing...</span>
//               </div>
//             )}
//           </div>
//         </div>
        
//         {renderContent()}
//       </div>
      
//       {renderHiddenFileInputs()}
//       {renderExcelTemplateModal()}
//       {renderWordTemplateModal()}
//       {renderJobModal()}
//       {renderJobMatchesModal()}
//       {renderTraineeModal()}
//     </div>
//   );
// }

// export default DashboardHR;




// DashboardHR.js – Full version with Job Visibility & Interview Locking
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart2,
  FileText,
  ExternalLink,
  Lightbulb,
  BarChart3,
  LogOut,
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  ChevronRight,
  User,
  Mail,
  Star,
  Award,
  Target,
  PieChart,
  Download,
  Bell,
  Settings,
  Plus,
  ArrowLeft,
  Check,
  AlertCircle,
  Link,
  GraduationCap,
  BriefcaseBusiness,
  Building,
  DollarSign as Dollar,
  CalendarDays,
  BookOpen,
  Brain,
  Sparkles,
  Zap,
  ThumbsUp,
  TrendingDown,
  FileSpreadsheet,
  File,
  Upload,
  Users2,
  Lock,
} from 'lucide-react';
import Sidebar from './Sidebar';
import api from '../api/axios';
import './styles/HrDashboard.css';

function DashboardHR({ userData, onLogout }) {
  // ==================== Core State ====================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showExcelTemplate, setShowExcelTemplate] = useState(false);
  const [showWordTemplate, setShowWordTemplate] = useState(false);
  const [techSkills, setTechSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Data
  const [jobs, setJobs] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [skillTrends, setSkillTrends] = useState({ tech: [], soft: [] });

  // Match data
  const [jobMatches, setJobMatches] = useState(null);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [traineeMatches, setTraineeMatches] = useState(null);
  const [traineeMatchesLoading, setTraineeMatchesLoading] = useState(false);

  // Open Pool
  const [traineesWithNoMatches, setTraineesWithNoMatches] = useState([]);
  const [checkingMatches, setCheckingMatches] = useState(false);

  // ==================== NEW: Interview Locking ====================
  const [selectedTraineeIds, setSelectedTraineeIds] = useState([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockInterviewDatetime, setLockInterviewDatetime] = useState('');
  const [lockComments, setLockComments] = useState('');

  const [interviewLocks, setInterviewLocks] = useState([]);
  const [lockStats, setLockStats] = useState(null);
  const [lockFilter, setLockFilter] = useState({ status: '', job: '' });

  // ==================== New Job State (with is_public) ====================
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: [''],
    openings: 1,
    requirements: '',
    techSkills: [],
    softSkills: [],
    description: '',
    salary: '',
    expiryDate: '',
    is_public: true, // NEW
  });

  // ==================== Helper: Normalize Skill ====================
  const normalizeSkill = (s) => (s || '').toString().trim().toLowerCase();

  // ==================== Compute Skill Trends ====================
  const computeSkillTrends = (jobs) => {
    const techMap = new Map();
    const softMap = new Map();
    const WEIGHTS = {
      basePerJob: 1,
      openingsWeight: 0.5,
      matchesWeight: 0.25,
      inactivePenalty: 0.4,
      unfilledBonus: 0.3,
    };
    for (const job of jobs || []) {
      const isActive = job?.status === 'active';
      const openings = Number(job?.openings ?? 0);
      const filled = Number(job?.filled ?? 0);
      const matches = Number(job?.matches ?? 0);
      const unfilled = Math.max(0, openings - filled);
      const jobWeight =
        WEIGHTS.basePerJob +
        (openings * WEIGHTS.openingsWeight) +
        (matches * WEIGHTS.matchesWeight) +
        (unfilled * WEIGHTS.unfilledBonus);
      const effectiveWeight = isActive ? jobWeight : jobWeight * WEIGHTS.inactivePenalty;

      const techSkills = Array.isArray(job?.techSkills) ? job.techSkills : [];
      const softSkills = Array.isArray(job?.softSkills) ? job.softSkills : [];

      techSkills.forEach((raw) => {
        const skill = normalizeSkill(raw);
        if (!skill) return;
        const cur = techMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
        techMap.set(skill, {
          jobs: cur.jobs + 1,
          openings: cur.openings + openings,
          matches: cur.matches + matches,
          demand: cur.demand + effectiveWeight,
        });
      });

      softSkills.forEach((raw) => {
        const skill = normalizeSkill(raw);
        if (!skill) return;
        const cur = softMap.get(skill) || { jobs: 0, openings: 0, matches: 0, demand: 0 };
        softMap.set(skill, {
          jobs: cur.jobs + 1,
          openings: cur.openings + openings,
          matches: cur.matches + matches,
          demand: cur.demand + effectiveWeight,
        });
      });
    }

    const toSortedArray = (map) => {
      const arr = Array.from(map.entries()).map(([name, stats]) => ({
        name,
        jobs: stats.jobs,
        openings: stats.openings,
        matches: stats.matches,
        demandRaw: stats.demand,
      }));
      const maxDemand = Math.max(...arr.map((a) => a.demandRaw), 1);
      return arr
        .map((a) => ({
          ...a,
          demand: Math.round((a.demandRaw / maxDemand) * 100),
        }))
        .sort((a, b) => b.demand - a.demand || b.jobs - a.jobs)
        .slice(0, 5);
    };

    return {
      tech: toSortedArray(techMap),
      soft: toSortedArray(softMap),
    };
  };

  // ==================== API Calls ====================
  const jobAPI = {
    getAllJobs: async () => {
      const res = await api.get('/jobs/');
      return res.data;
    },
    getJobById: async (id) => {
      const res = await api.get(`/jobs/${id}/`);
      return res.data;
    },
    createJob: async (jobData) => {
      const res = await api.post('/jobs/', jobData);
      return res.data;
    },
    updateJob: async (id, jobData) => {
      const res = await api.put(`/jobs/${id}/`, jobData);
      return res.data;
    },
    deleteJob: async (id) => {
      const res = await api.delete(`/jobs/${id}/`);
      return res.data;
    },
    toggleJobStatus: async (id) => {
      const res = await api.patch(`/jobs/${id}/toggle-status/`);
      return res.data;
    },
    uploadExcel: async (file) => {
      const formData = new FormData();
      formData.append('excel_file', file);
      const res = await api.post('/jobs/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    uploadWord: async (file) => {
      const formData = new FormData();
      formData.append('wordFile', file);
      const res = await api.post('/jobs/upload-word/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    downloadExcelTemplate: async () => {
      const res = await api.get('/jobs/download-excel-template/', {
        responseType: 'blob',
      });
      return res.data;
    },
    downloadWordTemplate: async () => {
      const res = await api.get('/jobs/download-word-template/', {
        responseType: 'blob',
      });
      return res.data;
    },
  };

  const mappingAPI = {
    updateMapping: async (userId, mappingData) => {
      const res = await api.patch(`/api/userinfo/${userId}/update-mapping/`, mappingData);
      return res.data;
    },
    getMapping: async (userId) => {
      const res = await api.get(`/api/userinfo/${userId}/`);
      return res.data;
    },
  };

  // Fetch trainees
  const fetchTrainees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/profiles/');
      const transformedTrainees = response.data.map((trainee) => {
        const userInfo = trainee.userInfo || {};
        const skills = [
          ...(trainee.strengths?.map((s) => s.courseName) || []),
          ...(trainee.weaknesses?.map((w) => w.courseName) || []),
        ];
        const avgScore = userInfo.averageScore || 0;
        return {
          id: trainee.id,
          userId: userInfo.userId || trainee.id,
          name: userInfo.name || 'Unknown',
          email: `${userInfo.employeeId || 'EMP' + trainee.id}@example.com`,
          skills,
          score: Math.round(avgScore),
          location: (userInfo.location || 'unknown').toLowerCase(),
          matchedJobs: [],
          certifications: trainee.certificates ? [trainee.certificates] : [],
          preferredLocation: userInfo.location || 'Unknown',
          isMapped: userInfo.isMapped || false,
          projectId: userInfo.projectId || '',
          projectName: userInfo.projectName || '',
          traineeData: trainee,
        };
      });
      setTrainees(transformedTrainees);
      setAllTrainees(transformedTrainees);
      setTraineesWithNoMatches([]);
    } catch (err) {
      console.error('Error fetching trainees:', err);
      setError('Failed to fetch trainees. Please try again.');
      setTrainees([]);
      setAllTrainees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobAPI.getAllJobs();
      setJobs(response);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs. Please try again.');
      // fallback mock data (optional – remove in production)
      setJobs([
        {
          id: 1,
          title: 'Frontend Developer',
          department: 'Technology',
          location: ['Hyderabad', 'Bangalore'],
          openings: 5,
          filled: 2,
          matches: 15,
          status: 'active',
          description: '...',
          requirements: '...',
          techSkills: ['React', 'JavaScript'],
          softSkills: ['Communication'],
          salary: '$85,000',
          postedDate: '2024-01-15',
          expiryDate: '2024-03-15',
          is_public: true,
        },
        // ... other fallback jobs
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Check Open Pool
  const checkTraineesForOpenPool = async () => {
    if (allTrainees.length === 0) return;
    setCheckingMatches(true);
    try {
      const noMatchTrainees = [];
      const unmappedTrainees = allTrainees.filter((t) => !t.isMapped);
      for (const trainee of unmappedTrainees) {
        try {
          const response = await api.get(`/trainee-matches/${trainee.id}/`);
          const matchesData = response.data;
          const hasNoMatch =
            (matchesData.total_matches >= 0 &&
              matchesData.no_match &&
              matchesData.no_match.length > 0 &&
              (!matchesData.perfect_match || matchesData.perfect_match.length === 0) &&
              (!matchesData.skills_only || matchesData.skills_only.length === 0) &&
              (!matchesData.location_only || matchesData.location_only.length === 0) &&
              (!matchesData.nearby || matchesData.nearby.length === 0)) ||
            matchesData.total_matches === 0;
          if (hasNoMatch) {
            noMatchTrainees.push({
              ...trainee,
              trainee_id: trainee.id,
              trainee_name: trainee.name,
              trainee_location: trainee.location,
              total_matches: matchesData.total_matches,
              no_match_count: matchesData.no_match ? matchesData.no_match.length : 0,
            });
          }
        } catch (error) {
          console.error(`Error checking matches for trainee ${trainee.id}:`, error);
          noMatchTrainees.push({
            ...trainee,
            trainee_id: trainee.id,
            trainee_name: trainee.name,
            trainee_location: trainee.location,
            total_matches: 0,
            no_match_count: 0,
          });
        }
      }
      setTraineesWithNoMatches(noMatchTrainees);
    } catch (err) {
      console.error('Error checking trainees for open pool:', err);
      toast.error('Failed to check trainee matches for Open Pool');
    } finally {
      setCheckingMatches(false);
    }
  };

  // Update job vacancies after mapping
  const updateJobVacancies = async (job) => {
    try {
      const newFilled = (job.filled || 0) + 1;
      const newOpenings = Math.max(0, (job.openings || 0) - 1);
      const updatedJobData = { ...job, filled: newFilled, openings: newOpenings };
      const response = await jobAPI.updateJob(job.id, updatedJobData);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, filled: newFilled, openings: newOpenings } : j))
      );
      if (selectedJob && selectedJob.id === job.id) {
        setSelectedJob((prev) => ({ ...prev, filled: newFilled, openings: newOpenings }));
      }
      if (newOpenings === 0) {
        await checkAndAutoDeactivateJob(updatedJobData);
      }
      return updatedJobData;
    } catch (error) {
      console.error('Error updating job vacancies:', error);
      toast.error('Failed to update job vacancies.');
      throw error;
    }
  };

  const checkAndAutoDeactivateJob = async (job) => {
    if (job.openings <= 0) {
      const updatedJobData = { ...job, status: 'inactive' };
      await jobAPI.updateJob(job.id, updatedJobData);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'inactive', openings: 0 } : j))
      );
      toast.success(`Job "${job.title}" auto‑deactivated.`);
    }
  };

  // Map trainee to project
  const handleMapToProject = async (trainee, job) => {
    try {
      setLoading(true);
      const mappingData = {
        isMapped: true,
        projectId: job.id.toString(),
        projectName: job.title,
      };

      let userId = null;
      if (trainee.traineeData) {
        userId = trainee.traineeData.userInfo.userId;
      } else {
        const found = allTrainees.find(
          (t) =>
            t.traineeData.userInfo.name === trainee.trainee_name &&
            t.traineeData.userInfo.location === trainee.trainee_location
        );
        if (found) userId = found.traineeData.userInfo.userId;
      }
      if (!userId) {
        toast.error('Could not find user ID for trainee');
        return;
      }

      await mappingAPI.updateMapping(userId, mappingData);
      await updateJobVacancies(job);

      // Remove from open pool if present
      setTraineesWithNoMatches((prev) =>
        prev.filter(
          (t) => t.trainee_name !== (trainee.traineeData?.userInfo?.name || trainee.trainee_name)
        )
      );

      // Update local trainee lists
      const updateTrainee = (t) => {
        if (trainee.traineeData) {
          return t.traineeData.userInfo.name === trainee.traineeData.userInfo.name
            ? { ...t, ...mappingData }
            : t;
        } else {
          return t.traineeData.userInfo.name === trainee.trainee_name ? { ...t, ...mappingData } : t;
        }
      };
      setAllTrainees((prev) => prev.map(updateTrainee));
      setTrainees((prev) => prev.filter(updateTrainee)); // remove from current filtered list

      // Update jobMatches if open
      if (jobMatches) {
        const bucket = Object.keys(jobMatches).find((key) =>
          Array.isArray(jobMatches[key]) &&
          jobMatches[key].some((m) => m.trainee_name === (trainee.traineeData?.userInfo?.name || trainee.trainee_name))
        );
        if (bucket) {
          setJobMatches((prev) => ({
            ...prev,
            [bucket]: prev[bucket].filter(
              (m) => m.trainee_name !== (trainee.traineeData?.userInfo?.name || trainee.trainee_name)
            ),
            total_matches: prev.total_matches - 1,
          }));
        }
      }

      toast.success(
        `Successfully mapped ${trainee.traineeData?.userInfo?.name || trainee.trainee_name} to ${job.title}`
      );
    } catch (err) {
      console.error('Error mapping trainee:', err);
      toast.error('Failed to map trainee.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmapFromProject = async (trainee) => {
    try {
      setLoading(true);
      const unmappingData = { isMapped: false, projectId: '', projectName: '' };
      await mappingAPI.updateMapping(trainee.userId, unmappingData);

      const jobId = trainee.projectId;
      if (jobId) {
        const job = jobs.find((j) => j.id.toString() === jobId);
        if (job) {
          const updatedJob = {
            ...job,
            filled: Math.max(0, (job.filled || 0) - 1),
            openings: (job.openings || 0) + 1,
          };
          if (job.status === 'inactive' && updatedJob.openings > 0) {
            updatedJob.status = 'active';
          }
          await jobAPI.updateJob(job.id, updatedJob);
          setJobs((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)));
          if (selectedJob && selectedJob.id === job.id) {
            setSelectedJob(updatedJob);
          }
        }
      }

      setAllTrainees((prev) => prev.map((t) => (t.id === trainee.id ? { ...t, ...unmappingData } : t)));
      if (activeTab === 'mapped' || activeTab === 'unmapped' || activeTab === 'trainees' || activeTab === 'openPool') {
        fetchTrainees();
      }
      if (selectedTrainee && selectedTrainee.id === trainee.id) {
        setSelectedTrainee({ ...selectedTrainee, ...unmappingData });
      }
      toast.success(`Successfully unmapped ${trainee.name}`);
    } catch (err) {
      console.error('Error unmapping trainee:', err);
      toast.error('Failed to unmap trainee.');
    } finally {
      setLoading(false);
    }
  };

  // Get mapped trainee names
  const getMappedTraineeNames = () => {
    return allTrainees.filter((t) => t.isMapped).map((t) => t.traineeData?.userInfo?.name || t.name);
  };

  // Fetch job matches
  const fetchJobMatches = async (jobId) => {
    setJobMatchesLoading(true);
    try {
      const response = await api.get(`/matches/${jobId}/`);
      setJobMatches(response.data);
    } catch (err) {
      console.error('Error fetching job matches:', err);
      toast.error('Failed to fetch job matches.');
    } finally {
      setJobMatchesLoading(false);
    }
  };

  // Fetch trainee matches
  const fetchTraineeMatches = async (traineeId) => {
    setTraineeMatchesLoading(true);
    try {
      const response = await api.get(`/trainee-matches/${traineeId}/`);
      setTraineeMatches(response.data);
    } catch (err) {
      console.error('Error fetching trainee matches:', err);
      toast.error('Failed to fetch trainee matches.');
    } finally {
      setTraineeMatchesLoading(false);
    }
  };

  const handleViewTraineeProfileFromJob = (match) => {
    const trainee = allTrainees.find((at) => at.traineeData.userInfo.name === match.trainee_name);
    if (trainee) {
      setSelectedTrainee(trainee);
      setJobMatches(null);
      setSelectedJob(null);
      fetchTraineeMatches(trainee.id);
    } else {
      toast.error('Trainee not found.');
    }
  };

  const handleViewJobMatches = (job) => {
    setSelectedJob(job);
    fetchJobMatches(job.id);
  };

  const handleViewTraineeProfile = (trainee) => {
    setSelectedTrainee(trainee);
    fetchTraineeMatches(trainee.id);
  };

  const toggleJobStatus = async (jobId) => {
    try {
      await jobAPI.toggleJobStatus(jobId);
      setJobs((jobs) =>
        jobs.map((job) =>
          job.id === jobId
            ? { ...job, status: job.status === 'active' ? 'inactive' : 'active' }
            : job
        )
      );
      toast.success('Job status updated!');
    } catch (err) {
      console.error('Error toggling job status:', err);
      toast.error('Failed to update job status.');
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      setLoading(true);
      await jobAPI.deleteJob(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
      toast.success('Job deleted successfully!');
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job.');
    } finally {
      setLoading(false);
    }
  };

  // Create job (with is_public)
  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.department || !newJob.description || !newJob.requirements) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      const jobData = {
        ...newJob,
        location: newJob.location.filter((loc) => loc.trim() !== ''),
        techSkills,
        softSkills,
        status: 'active',
        filled: 0,
        matches: 0,
        postedDate: new Date().toISOString().split('T')[0],
        is_public: newJob.is_public, // include
      };
      await jobAPI.createJob(jobData);
      await fetchJobs();
      // Reset form
      setNewJob({
        title: '',
        department: '',
        location: [''],
        openings: 1,
        requirements: '',
        techSkills: [],
        softSkills: [],
        description: '',
        salary: '',
        expiryDate: '',
        is_public: true,
      });
      setTechSkills([]);
      setSoftSkills([]);
      setActiveTab('jobs');
      toast.success('Job created successfully!');
    } catch (err) {
      console.error('Error creating job:', err);
      toast.error('Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  // Update job (with is_public)
  const handleUpdateJob = async (updatedJob) => {
    try {
      setLoading(true);
      await jobAPI.updateJob(updatedJob.id, updatedJob);
      await fetchJobs();
      setSelectedJob(null);
      setIsEditMode(false);
      setActiveTab('jobs');
      setTechSkills([]);
      setSoftSkills([]);
      toast.success('Job updated successfully!');
    } catch (err) {
      console.error('Error updating job:', err);
      toast.error('Failed to update job.');
    } finally {
      setLoading(false);
    }
  };

  // Skill input handlers
  const handleTechSkillAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = e.target.value.trim();
      if (skill && !techSkills.includes(skill)) {
        const updated = [...techSkills, skill];
        setTechSkills(updated);
        if (selectedJob && isEditMode) {
          setSelectedJob({ ...selectedJob, techSkills: updated });
        } else {
          setNewJob({ ...newJob, techSkills: updated });
        }
        e.target.value = '';
      }
    }
  };
  const handleSoftSkillAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = e.target.value.trim();
      if (skill && !softSkills.includes(skill)) {
        const updated = [...softSkills, skill];
        setSoftSkills(updated);
        if (selectedJob && isEditMode) {
          setSelectedJob({ ...selectedJob, softSkills: updated });
        } else {
          setNewJob({ ...newJob, softSkills: updated });
        }
        e.target.value = '';
      }
    }
  };
  const removeTechSkill = (index) => {
    const updated = techSkills.filter((_, i) => i !== index);
    setTechSkills(updated);
    if (selectedJob && isEditMode) {
      setSelectedJob({ ...selectedJob, techSkills: updated });
    } else {
      setNewJob({ ...newJob, techSkills: updated });
    }
  };
  const removeSoftSkill = (index) => {
    const updated = softSkills.filter((_, i) => i !== index);
    setSoftSkills(updated);
    if (selectedJob && isEditMode) {
      setSelectedJob({ ...selectedJob, softSkills: updated });
    } else {
      setNewJob({ ...newJob, softSkills: updated });
    }
  };

  // Location fields
  const addLocationField = () => {
    setNewJob({ ...newJob, location: [...newJob.location, ''] });
  };
  const removeLocationField = (index) => {
    setNewJob({ ...newJob, location: newJob.location.filter((_, i) => i !== index) });
  };
  const updateLocationField = (index, value) => {
    const newLocs = [...newJob.location];
    newLocs[index] = value;
    setNewJob({ ...newJob, location: newLocs });
  };

  // Stats
  const calculateStatistics = () => {
    const totalTrainees = allTrainees.length;
    const totalJobs = jobs.length;
    const mappedTrainees = allTrainees.filter((t) => t.isMapped === true).length;
    const unmappedTrainees = allTrainees.filter((t) => !t.isMapped).length;
    const activeJobs = jobs.filter((j) => j.status === 'active').length;
    const filledPositions = jobs.reduce((sum, job) => sum + (job.filled || 0), 0);
    const totalOpenings = jobs.reduce((sum, job) => sum + (job.openings || 0), 0);
    const fillRate = totalOpenings > 0 ? Math.round((filledPositions / totalOpenings) * 100) : 0;
    return {
      totalTrainees,
      totalJobs,
      mappedTrainees,
      unmappedTrainees,
      activeJobs,
      filledPositions,
      totalOpenings,
      fillRate,
    };
  };
  const stats = calculateStatistics();

  // ==================== NEW: Interview Lock Functions ====================
  const fetchInterviewLocks = async () => {
    try {
      setLoading(true);
      let url = '/interview-locks/';
      const params = new URLSearchParams();
      if (lockFilter.status) params.append('status', lockFilter.status);
      if (lockFilter.job) params.append('job', lockFilter.job);
      if (params.toString()) url += '?' + params.toString();
      const response = await api.get(url);
      setInterviewLocks(response.data);
    } catch (err) {
      toast.error('Failed to fetch interview locks');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockStats = async () => {
    try {
      const response = await api.get('/interview-locks/dashboard/');
      setLockStats(response.data);
    } catch (err) {
      console.error('Failed to fetch lock stats', err);
    }
  };

  const updateLockStatus = async (lockId, newStatus) => {
    try {
      await api.patch(`/interview-locks/${lockId}/`, { status: newStatus });
      toast.success('Status updated');
      fetchInterviewLocks();
      fetchLockStats();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const downloadLockReport = () => {
    window.open('/api/interview-locks/report/', '_blank');
  };

  const handleLockForInterview = async () => {
    if (selectedTraineeIds.length === 0) {
      toast.error('Select at least one trainee');
      return;
    }
    if (!lockInterviewDatetime) {
      toast.error('Please select interview date and time');
      return;
    }
    try {
      setLoading(true);
      await api.post('/interview-locks/bulk_create/', {
        trainee_ids: selectedTraineeIds,
        job_id: selectedJob.id,
        interview_datetime: lockInterviewDatetime,
        comments: lockComments,
      });
      toast.success(`Locked ${selectedTraineeIds.length} trainee(s) for interview`);
      setShowLockModal(false);
      setSelectedTraineeIds([]);
      setLockInterviewDatetime('');
      setLockComments('');
    } catch (err) {
      toast.error('Failed to lock trainees');
    } finally {
      setLoading(false);
    }
  };
  // ================================================================

  // ==================== Effects ====================
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'trainees' || activeTab === 'mapped' || activeTab === 'unmapped' || activeTab === 'openPool') {
      fetchTrainees();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'jobs' || activeTab === 'createJob') {
      fetchJobs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (allTrainees.length > 0 && activeTab === 'openPool') {
      checkTraineesForOpenPool();
    }
  }, [allTrainees, activeTab]);

  useEffect(() => {
    setSkillTrends(computeSkillTrends(jobs));
  }, [jobs]);

  // Filter trainees
  useEffect(() => {
    let filtered = [...allTrainees];
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (locationFilter) {
      filtered = filtered.filter((t) => t.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }
    if (activeTab === 'mapped') {
      filtered = filtered.filter((t) => t.isMapped === true);
    } else if (activeTab === 'unmapped') {
      filtered = filtered.filter((t) => t.isMapped !== true);
    } else if (activeTab === 'openPool') {
      const noMatchIds = traineesWithNoMatches.map((t) => t.id || t.trainee_id);
      filtered = filtered.filter((t) => !t.isMapped && noMatchIds.includes(t.id));
    }
    setTrainees(filtered);
  }, [searchQuery, locationFilter, activeTab, allTrainees, traineesWithNoMatches]);

  // Fetch interview locks when tab changes
  useEffect(() => {
    if (activeTab === 'interviewLocks') {
      fetchInterviewLocks();
      fetchLockStats();
    }
  }, [activeTab, lockFilter]);

  // ==================== Render Helpers ====================
  const renderHiddenFileInputs = () => (
    <>
      <input type="file" id="excelUpload" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelUpload} />
      <input type="file" id="wordUpload" accept=".doc,.docx" style={{ display: 'none' }} onChange={handleWordUpload} />
    </>
  );

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    // validation...
    try {
      setLoading(true);
      await jobAPI.uploadExcel(file);
      await fetchJobs();
      toast.success('Excel uploaded successfully!');
    } catch (err) {
      toast.error('Upload failed.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleWordUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      await jobAPI.uploadWord(file);
      await fetchJobs();
      toast.success('Word document uploaded!');
    } catch (err) {
      toast.error('Upload failed.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleDownloadExcelTemplate = async () => {
    try {
      setLoading(true);
      const blob = await jobAPI.downloadExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWordTemplate = async () => {
    try {
      setLoading(true);
      const blob = await jobAPI.downloadWordTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job_template.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  // Modals
  const renderExcelTemplateModal = () => {
    if (!showExcelTemplate) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowExcelTemplate(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <div className="modal-title">
              <FileSpreadsheet size={24} />
              <h2>Excel Upload Template</h2>
            </div>
            <button className="modal-close" onClick={() => setShowExcelTemplate(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <h3>Here you can download this template</h3>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleDownloadExcelTemplate} disabled={loading}>
              <Download size={18} /> Download Template
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                document.getElementById('excelUpload').click();
                setShowExcelTemplate(false);
              }}
              disabled={loading}
            >
              <Upload size={18} /> Upload Excel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWordTemplateModal = () => {
    if (!showWordTemplate) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowWordTemplate(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <div className="modal-title">
              <File size={24} />
              <h2>Word Document Template</h2>
            </div>
            <button className="modal-close" onClick={() => setShowWordTemplate(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <h3>Here you can download this template</h3>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleDownloadWordTemplate} disabled={loading}>
              <Download size={18} /> Download Template
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                document.getElementById('wordUpload').click();
                setShowWordTemplate(false);
              }}
              disabled={loading}
            >
              <Upload size={18} /> Upload Word Doc
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard render
  const renderDashboard = () => (
    <div className="dashboard-content">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      )}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Users className="stat-icon-svg" /></div>
          <div className="stat-content"><h3>Total Trainees</h3><div className="stat-value">{stats.totalTrainees}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BriefcaseBusiness className="stat-icon-svg" /></div>
          <div className="stat-content"><h3>Total Jobs</h3><div className="stat-value">{stats.totalJobs}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle className="stat-icon-svg" /></div>
          <div className="stat-content"><h3>Mapped Trainees</h3><div className="stat-value">{stats.mappedTrainees}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertCircle className="stat-icon-svg" /></div>
          <div className="stat-content"><h3>Unmapped Trainees</h3><div className="stat-value">{stats.unmappedTrainees}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Target className="stat-icon-svg" /></div>
          <div className="stat-content"><h3>Active Jobs</h3><div className="stat-value">{stats.activeJobs}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Briefcase className="stat-icon-svg" /></div>
          <div className="stat-content"><h3>Fill Rate</h3><div className="stat-value">{stats.fillRate}%</div></div>
        </div>
      </div>

      <h2 className="section-title">Top Skills in Demand</h2>
      <div className="skills-section">
        <div className="content-card">
          <div className="card-header"><h3><Target size={20} /> Technical Skills</h3></div>
          <div className="hr-skills-list">
            {skillTrends.tech.map((skill) => (
              <div key={`tech-${skill.name}`} className="skill-item">
                <div className="skill-header">
                  <span className="skill-name">{skill.name}</span>
                  <div className="skill-stats">
                    <span className="skill-jobs">{skill.jobs} jobs</span>
                    <span className="skill-demand">{skill.demand}%</span>
                  </div>
                </div>
                <div className="skill-bar"><div className="skill-fill" style={{ width: `${skill.demand}%`, background: '#3b82f6' }} /></div>
              </div>
            ))}
            {skillTrends.tech.length === 0 && <div className="no-data">No technical skills found.</div>}
          </div>
        </div>
        <div className="content-card">
          <div className="card-header"><h3><Star size={20} /> Soft Skills</h3></div>
          <div className="hr-skills-list">
            {skillTrends.soft.map((skill) => (
              <div key={`soft-${skill.name}`} className="skill-item">
                <div className="skill-header">
                  <span className="skill-name">{skill.name}</span>
                  <div className="skill-stats">
                    <span className="skill-jobs">{skill.jobs} jobs</span>
                    <span className="skill-demand">{skill.demand}%</span>
                  </div>
                </div>
                <div className="skill-bar"><div className="skill-fill" style={{ width: `${skill.demand}%`, background: '#10b981' }} /></div>
              </div>
            ))}
            {skillTrends.soft.length === 0 && <div className="no-data">No soft skills found.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  // Job Management
  const renderJobManagement = () => (
    <div className="job-management">
      <div className="section-header">
        <div className="header-title">
          <h2><Briefcase size={24} /> Job Profiles Management</h2>
          <p className="subtitle">Manage and track all job positions</p>
        </div>
        <div className="header-actions">
          <div className="upload-buttons">
            <button className="btn-secondary" onClick={() => setShowExcelTemplate(true)} disabled={loading}>
              <FileSpreadsheet size={18} /> Upload Excel
            </button>
            <button className="btn-secondary" onClick={() => setShowWordTemplate(true)} disabled={loading}>
              <File size={18} /> Upload Word
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setSelectedJob(null);
              setIsEditMode(false);
              setActiveTab('createJob');
            }}
            disabled={loading}
          >
            <Plus size={18} /> Create New Job
          </button>
        </div>
      </div>

      {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading jobs...</p></div>}
      {error && <div className="error-message"><AlertCircle size={20} /><span>{error}</span></div>}

      {jobs.length === 0 && !loading && !error && (
        <div className="no-data">
          <Briefcase size={48} />
          <h3>No Jobs Found</h3>
          <p>Create your first job profile or upload jobs via Excel/Word</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location(s)</th>
                <th>Openings</th>
                <th>Filled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="job-title-cell">
                      <div className="job-icon"><BriefcaseBusiness size={16} /></div>
                      <span className="font-medium">{job.title}</span>
                    </div>
                  </td>
                  <td>
                    <div className="department-cell"><Building size={14} />{job.department}</div>
                  </td>
                  <td>
                    <div className="location-cell"><MapPin size={14} />{Array.isArray(job.location) ? job.location.join(', ') : job.location}</div>
                  </td>
                  <td><div className="openings-cell">{job.openings}</div></td>
                  <td><div className={`filled-cell ${job.filled === job.openings ? 'filled-complete' : ''}`}>{job.filled}/{job.openings}</div></td>
                  <td>
                    <button
                      className={`status-button ${job.status === 'active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => toggleJobStatus(job.id)}
                      disabled={loading}
                    >
                      {job.status === 'active' ? <><CheckCircle size={12} /> Active</> : <><X size={12} /> Inactive</>}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-icon-view" onClick={() => handleViewJobMatches(job)} disabled={loading}><Eye size={16} /></button>
                      <button
                        className="btn-icon btn-icon-edit"
                        onClick={() => {
                          setSelectedJob(job);
                          setIsEditMode(true);
                          setActiveTab('createJob');
                          setTechSkills(job.techSkills || []);
                          setSoftSkills(job.softSkills || []);
                        }}
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteJob(job.id)} disabled={loading}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Create/Edit Job Form (with is_public)
  const renderCreateJob = () => {
    const jobToEdit = selectedJob || newJob;
    const isEditing = !!selectedJob && isEditMode;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isEditing) {
        await handleUpdateJob(jobToEdit);
      } else {
        await handleCreateJob();
      }
    };

    return (
      <div className="create-job">
        <div className="section-header">
          <div className="header-title">
            <h2>{isEditing ? <><Edit size={24} /> Edit Job Profile</> : <><Plus size={24} /> Create New Job Profile</>}</h2>
            <p className="subtitle">{isEditing ? 'Update existing job details' : 'Fill in the details to create a new job position'}</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setSelectedJob(null);
              setIsEditMode(false);
              setActiveTab('jobs');
              setNewJob({
                title: '',
                department: '',
                location: [''],
                openings: 1,
                requirements: '',
                techSkills: [],
                softSkills: [],
                description: '',
                salary: '',
                expiryDate: '',
                is_public: true,
              });
              setTechSkills([]);
              setSoftSkills([]);
            }}
            disabled={loading}
          >
            <ArrowLeft size={18} /> Back to Jobs
          </button>
        </div>

        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>{isEditing ? 'Updating job...' : 'Creating job...'}</p></div>}

        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="form-section-title"><Briefcase size={20} /> Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label><span className="required">*</span> Job Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={jobToEdit.title}
                    onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, title: e.target.value }) : setNewJob({ ...newJob, title: e.target.value })}
                    required
                    placeholder="e.g., Senior Frontend Developer"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label><span className="required">*</span> Department</label>
                  <select
                    className="form-control"
                    value={jobToEdit.department}
                    onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, department: e.target.value }) : setNewJob({ ...newJob, department: e.target.value })}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    <option value="Technology">Technology</option>
                    <option value="Analytics">Analytics</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>

              {/* Visibility dropdown */}
              <div className="form-row">
                <div className="form-group">
                  <label>Visibility</label>
                  <select
                    className="form-control"
                    value={jobToEdit.is_public ? 'public' : 'private'}
                    onChange={(e) => {
                      const val = e.target.value === 'public';
                      if (isEditing) {
                        setSelectedJob({ ...jobToEdit, is_public: val });
                      } else {
                        setNewJob({ ...newJob, is_public: val });
                      }
                    }}
                  >
                    <option value="public">Public (visible to associates)</option>
                    <option value="private">Private (internal only)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label><span className="required">*</span> Locations <span className="helper-text">(Add multiple locations if needed)</span></label>
                {jobToEdit.location.map((loc, index) => (
                  <div key={index} className="location-input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={loc}
                      onChange={(e) => {
                        if (isEditing) {
                          const newLocs = [...jobToEdit.location];
                          newLocs[index] = e.target.value;
                          setSelectedJob({ ...jobToEdit, location: newLocs });
                        } else {
                          updateLocationField(index, e.target.value);
                        }
                      }}
                      required={index === 0}
                      placeholder="e.g., Hyderabad"
                      disabled={loading}
                    />
                    {jobToEdit.location.length > 1 && (
                      <button type="button" className="btn-icon" onClick={() => {
                        if (isEditing) {
                          const newLocs = jobToEdit.location.filter((_, i) => i !== index);
                          setSelectedJob({ ...jobToEdit, location: newLocs });
                        } else {
                          removeLocationField(index);
                        }
                      }} disabled={loading}><X size={16} /></button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addLocationField} disabled={loading}>
                  <Plus size={16} /> Add Another Location
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><span className="required">*</span> Number of Openings</label>
                  <input
                    type="number"
                    className="form-control"
                    value={jobToEdit.openings}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (isEditing) {
                        setSelectedJob({ ...jobToEdit, openings: val });
                      } else {
                        setNewJob({ ...newJob, openings: val });
                      }
                    }}
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label><Calendar size={16} /> Expiry Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={jobToEdit.expiryDate}
                    onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, expiryDate: e.target.value }) : setNewJob({ ...newJob, expiryDate: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title"><BookOpen size={20} /> Requirements & Skills</h3>
              <div className="form-group">
                <label><span className="required">*</span> Technical Skills</label>
                <div className="skills-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type technical skill and press Enter or comma"
                    onKeyDown={handleTechSkillAdd}
                    disabled={loading}
                  />
                  <div className="skills-tags">
                    {(isEditing ? jobToEdit.techSkills || [] : techSkills).map((skill, index) => (
                      <span key={index} className="skill-tag tech-tag">
                        {skill}
                        <button type="button" className="tag-remove" onClick={() => removeTechSkill(index)} disabled={loading}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Soft Skills</label>
                <div className="skills-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type soft skill and press Enter or comma"
                    onKeyDown={handleSoftSkillAdd}
                    disabled={loading}
                  />
                  <div className="skills-tags">
                    {(isEditing ? jobToEdit.softSkills || [] : softSkills).map((skill, index) => (
                      <span key={index} className="skill-tag soft-tag">
                        {skill}
                        <button type="button" className="tag-remove" onClick={() => removeSoftSkill(index)} disabled={loading}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label><span className="required">*</span> Job Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={jobToEdit.description}
                  onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, description: e.target.value }) : setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Describe the job role, responsibilities, and expectations..."
                  required
                  disabled={loading}
                ></textarea>
              </div>

              <div className="form-group">
                <label><span className="required">*</span> Requirements & Qualifications</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={jobToEdit.requirements}
                  onChange={(e) => isEditing ? setSelectedJob({ ...jobToEdit, requirements: e.target.value }) : setNewJob({ ...newJob, requirements: e.target.value })}
                  placeholder="List the required experience, education, certifications, etc."
                  required
                  disabled={loading}
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => {
                setSelectedJob(null);
                setIsEditMode(false);
                setActiveTab('jobs');
                setNewJob({
                  title: '',
                  department: '',
                  location: [''],
                  openings: 1,
                  requirements: '',
                  techSkills: [],
                  softSkills: [],
                  description: '',
                  salary: '',
                  expiryDate: '',
                  is_public: true,
                });
                setTechSkills([]);
                setSoftSkills([]);
              }} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {isEditing ? <><Check size={18} /> {loading ? 'Updating...' : 'Update Job Profile'}</> : <><Plus size={18} /> {loading ? 'Creating...' : 'Create Job Profile'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Trainees List
  const renderTraineesList = () => {
    const uniqueLocations = [...new Set(allTrainees.map((t) => t.location).filter((loc) => loc))];
    const openPoolCount = traineesWithNoMatches.length;

    return (
      <div className="trainees-list">
        <div className="section-header">
          <div className="header-title">
            <h2><Users size={24} /> Trainees Management</h2>
            <p className="subtitle">Manage and track all trainees in the system</p>
          </div>
          <div className="view-options">
            <button className={`btn-view-option ${activeTab === 'trainees' ? 'active' : ''}`} onClick={() => setActiveTab('trainees')}>All Trainees</button>
            <button className={`btn-view-option ${activeTab === 'mapped' ? 'active' : ''}`} onClick={() => setActiveTab('mapped')}><CheckCircle size={16} /> Mapped ({stats.mappedTrainees})</button>
            <button className={`btn-view-option ${activeTab === 'unmapped' ? 'active' : ''}`} onClick={() => setActiveTab('unmapped')}><AlertCircle size={16} /> Unmapped ({stats.unmappedTrainees})</button>
            <button className={`btn-view-option ${activeTab === 'openPool' ? 'active' : ''}`} onClick={() => setActiveTab('openPool')}><Users2 size={16} /> Open Pool ({openPoolCount})</button>
          </div>
        </div>

        <div className="search-filter">
          <div className="search-box">
            <input type="text" className="search-input" placeholder="Search trainees by name, skills, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>
              ))}
            </select>
            <button className="btn-icon" onClick={() => { setSearchQuery(''); setLocationFilter(''); }}><X size={18} /></button>
          </div>
        </div>

        {checkingMatches && activeTab === 'openPool' && (
          <div className="loading-overlay"><div className="loading-spinner"></div><p>Checking trainee matches for Open Pool...</p></div>
        )}
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading trainees...</p></div>}
        {error && <div className="error-message"><AlertCircle size={20} /><span>{error}</span></div>}

        {trainees.length === 0 && !loading && !checkingMatches && (
          <div className="no-data">
            <Users size={48} />
            <h3>No Trainees Found</h3>
            <p>No trainees match your search criteria or no trainees available</p>
            {activeTab === 'openPool' && (
              <button className="btn-primary" onClick={checkTraineesForOpenPool} disabled={checkingMatches}>
                <Search size={18} /> Re-check for Open Pool
              </button>
            )}
          </div>
        )}

        <div className="trainees-grid">
          {trainees.map((trainee) => (
            <div key={trainee.id} className="trainee-card">
              <div className="trainee-header">
                <div className="trainee-info-main">
                  <div className="trainee-avatar">{trainee.name.charAt(0)}</div>
                  <div className="trainee-info">
                    <h4>{trainee.name}</h4>
                    <div className="trainee-meta">
                      <span className="trainee-email"><Mail size={14} /> {trainee.email}</span>
                      <span className="trainee-location"><MapPin size={14} /> {trainee.location}</span>
                    </div>
                  </div>
                </div>
                <div className={`mapping-indicator ${trainee.isMapped ? 'mapped' : 'unmapped'}`}>
                  {trainee.isMapped ? (
                    <><CheckCircle size={14} /> Mapped {trainee.projectName && <span className="project-name-small">: {trainee.projectName}</span>}</>
                  ) : (
                    <><AlertCircle size={14} /> Unmapped {activeTab === 'openPool' && <span className="open-pool-badge">No Matches</span>}</>
                  )}
                </div>
              </div>

              <div className="trainee-skills">
                {trainee.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
                {trainee.skills.length > 4 && <span className="skill-tag-more">+{trainee.skills.length - 4}</span>}
              </div>

              <div className="trainee-stats">
                <div className="trainee-stat">
                  <span className="stat-label">Average Score</span>
                  <div className="score-progress">
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${trainee.score}%` }}></div></div>
                    <span className="score-value">{trainee.score}%</span>
                  </div>
                </div>
              </div>

              <div className="trainee-actions">
                <button className="btn-action btn-profile" onClick={() => handleViewTraineeProfile(trainee)}>
                  <User size={16} /> View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Job Modal (view details)
  const renderJobModal = () => {
    if (!selectedJob || isEditMode) return null;
    const handleDelete = async () => {
      if (window.confirm('Are you sure you want to delete this job?')) {
        await handleDeleteJob(selectedJob.id);
        setSelectedJob(null);
      }
    };
    return (
      <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><Briefcase size={24} /><h2>{selectedJob.title}</h2></div>
            <button className="modal-close" onClick={() => setSelectedJob(null)} disabled={loading}><X size={24} /></button>
          </div>
          <div className="modal-body">
            {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading...</p></div>}
            <div className="job-details-grid">
              <div className="detail-item"><Building size={16} /><div><span className="detail-label">Department</span><span className="detail-value">{selectedJob.department}</span></div></div>
              <div className="detail-item"><MapPin size={16} /><div><span className="detail-label">Location</span><span className="detail-value">{Array.isArray(selectedJob.location) ? selectedJob.location.join(', ') : selectedJob.location}</span></div></div>
              <div className="detail-item"><BriefcaseBusiness size={16} /><div><span className="detail-label">Openings</span><span className="detail-value">{selectedJob.openings} ({selectedJob.filled} filled)</span></div></div>
              <div className="detail-item"><Dollar size={16} /><div><span className="detail-label">Salary</span><span className="detail-value">{selectedJob.salary}</span></div></div>
              <div className="detail-item"><div className={`status-badge status-${selectedJob.status}`}>{selectedJob.status === 'active' ? 'Active' : 'Inactive'}</div></div>
              <div className="detail-item"><CalendarDays size={16} /><div><span className="detail-label">Posted</span><span className="detail-value">{selectedJob.postedDate}</span></div></div>
              <div className="detail-item"><Calendar size={16} /><div><span className="detail-label">Expires</span><span className="detail-value">{selectedJob.expiryDate}</span></div></div>
            </div>
            <div className="job-section"><h3>Job Description</h3><p>{selectedJob.description}</p></div>
            <div className="job-section"><h3>Requirements</h3><p>{selectedJob.requirements}</p></div>
            <div className="job-section"><h3>Technical Skills</h3><div className="skills-list">{selectedJob.techSkills?.map(skill => <span key={skill} className="skill-tag tech-tag">{skill}</span>)}</div></div>
            <div className="job-section"><h3>Soft Skills</h3><div className="skills-list">{selectedJob.softSkills?.map(skill => <span key={skill} className="skill-tag soft-tag">{skill}</span>)}</div></div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedJob(null)} disabled={loading}>Close</button>
              <button className="btn-danger" onClick={handleDelete} disabled={loading}><Trash2 size={18} /> Delete Job</button>
              <button className="btn-primary" onClick={() => {
                setIsEditMode(true);
                setActiveTab('createJob');
                setTechSkills(selectedJob.techSkills || []);
                setSoftSkills(selectedJob.softSkills || []);
              }} disabled={loading}><Edit size={18} /> Edit Job</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Job Matches Modal (with checkboxes and lock)
  const renderJobMatchesModal = () => {
    if (!selectedJob || jobMatches === null) return null;

    const bucketConfig = {
      perfect_match: { title: 'Perfect Match', color: 'bucket-perfect' },
      skills_only: { title: 'Skills Only', color: 'bucket-skills' },
      location_only: { title: 'Location Only', color: 'bucket-location' },
      nearby: { title: 'Nearby', color: 'bucket-nearby' },
      no_match: { title: 'No Match', color: 'bucket-no-match' },
    };
    const mappedTraineeNames = getMappedTraineeNames();

    return (
      <div className="modal-overlay" onClick={() => { setSelectedJob(null); setJobMatches(null); setSelectedTraineeIds([]); }}>
        <div className="modal-content job-matches-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <Users size={24} />
              <div>
                <h2>{jobMatches.job_title} - Matches</h2>
                <p className="subtitle">Total Matches: {jobMatches.total_matches} | Available: {jobMatches.total_matches - mappedTraineeNames.length}</p>
              </div>
            </div>
            <button className="modal-close" onClick={() => { setSelectedJob(null); setJobMatches(null); setSelectedTraineeIds([]); }}><X size={24} /></button>
          </div>

          <div className="modal-body">
            {jobMatchesLoading ? (
              <div className="loading-state">...</div>
            ) : (
              <>
                <div className="modal-actions" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span>Selected: {selectedTraineeIds.length}</span>
                  <button
                    className="btn-primary"
                    onClick={() => setShowLockModal(true)}
                    disabled={selectedTraineeIds.length === 0}
                  >
                    <Lock size={18} /> Lock for Interview ({selectedTraineeIds.length})
                  </button>
                </div>

                <div className="job-matches-content">
                  {Object.entries(bucketConfig).map(([bucketKey, config]) => {
                    const bucketData = jobMatches[bucketKey];
                    if (!bucketData || bucketData.length === 0) return null;
                    const availableMatches = bucketData.filter(match => !mappedTraineeNames.includes(match.trainee_name));
                    if (availableMatches.length === 0) return null;

                    return (
                      <div key={bucketKey} className={`bucket-section ${config.color}`}>
                        <h3 className="bucket-title">{config.title} ({availableMatches.length} available of {bucketData.length})</h3>
                        <div className="bucket-grid">
                          {availableMatches.map((match) => (
                            <div key={match.id || match.trainee_id} className="trainee-match-card">
                              <input
                                type="checkbox"
                                className="trainee-checkbox"
                                checked={selectedTraineeIds.includes(match.trainee_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTraineeIds([...selectedTraineeIds, match.trainee_id]);
                                  } else {
                                    setSelectedTraineeIds(selectedTraineeIds.filter(id => id !== match.trainee_id));
                                  }
                                }}
                              />
                              <div className="match-percentage">{match.total_percentage.toFixed(1)}%</div>
                              <div className="bucket-tag">{match.bucket?.replace('_', ' ') || config.title}</div>
                              <h4>{match.trainee_name}</h4>
                              <div className="match-breakdown">
                                <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
                                <span>Location: {match.location_percentage.toFixed(1)}%</span>
                              </div>
                              <p className="location-info"><MapPin size={14} /> {match.trainee_location}</p>
                              <div className="match-actions">
                                <button className="view-trainee-btn" onClick={() => handleViewTraineeProfileFromJob(match)}>
                                  <User size={16} /> View Profile
                                </button>
                                <button
                                  className="map-to-project-btn"
                                  onClick={() => {
                                    if (selectedJob.openings <= 0) {
                                      toast.error('This job has no openings available.');
                                      return;
                                    }
                                    handleMapToProject(match, selectedJob);
                                  }}
                                  disabled={selectedJob.openings <= 0}
                                >
                                  <Link size={16} /> {selectedJob.openings <= 0 ? 'Job Full' : 'Map to Project'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => { setSelectedJob(null); setJobMatches(null); setSelectedTraineeIds([]); }}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Trainee Profile Modal
  const renderTraineeModal = () => {
    if (!selectedTrainee) return null;
    const traineeData = selectedTrainee.traineeData || selectedTrainee;
    const userInfo = traineeData.userInfo || {};

    return (
      <div className="modal-overlay" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>
        <div className="modal-content trainee-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><User size={24} /><h2>{userInfo.name || selectedTrainee.name}</h2></div>
            <button className="modal-close" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}><X size={24} /></button>
          </div>

          <div className="modal-body">
            {traineeMatchesLoading ? (
              <div className="loading-state"><div className="loading-spinner"></div><p>Loading trainee matches...</p></div>
            ) : (
              <>
                <div className="trainee-details-section">
                  <div className="mapping-status-section">
                    <h4>Project Mapping</h4>
                    <div className={`mapping-status ${selectedTrainee.isMapped ? 'mapped' : 'unmapped'}`}>
                      <div className="status-indicator">
                        {selectedTrainee.isMapped ? (
                          <><CheckCircle size={20} /><div><strong>Mapped to Project</strong><p>{selectedTrainee.projectName || 'Unknown Project'}</p><small>Project ID: {selectedTrainee.projectId || 'N/A'}</small></div></>
                        ) : (
                          <><AlertCircle size={20} /><div><strong>Not Assigned</strong><p>This trainee is available for project assignment</p></div></>
                        )}
                      </div>
                      {selectedTrainee.isMapped ? (
                        <button className="btn-danger" onClick={() => handleUnmapFromProject(selectedTrainee)} disabled={loading}>
                          <X size={18} /> Unmap from Project
                        </button>
                      ) : (
                        <div className="available-for-mapping"><p>Available for mapping to matching projects</p></div>
                      )}
                    </div>
                  </div>

                  <div className="profile-header">
                    <div className="profile-avatar">{selectedTrainee.name.charAt(0)}</div>
                    <div className="profile-info">
                      <h3>{userInfo.name || selectedTrainee.name}</h3>
                      <div className="profile-role">TRAINEE</div>
                      <div className="profile-meta">
                        <span className="profile-meta-item"><MapPin size={16} /> {userInfo.location || selectedTrainee.location}</span>
                        <span className="profile-meta-item"><Mail size={16} /> {selectedTrainee.email}</span>
                        <span className="profile-meta-item"><Target size={16} /> DPI: {traineeData.dpi || 'N/A'}</span>
                        <span className="profile-meta-item"><BarChart2 size={16} /> Score: {userInfo.averageScore || selectedTrainee.score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="trainee-details-grid">
                    <div className="detail-item"><span className="detail-label">User ID</span><span className="detail-value">{userInfo.userId || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Employee ID</span><span className="detail-value">{userInfo.employeeId || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">ISU</span><span className="detail-value">{userInfo.isu || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Batch Rank</span><span className="detail-value">{traineeData.batchRank || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Group Rank</span><span className="detail-value">{traineeData.groupRank || 'N/A'}</span></div>
                    <div className="detail-item"><span className="detail-label">Average Score</span><span className="detail-value">{userInfo.averageScore || 0}%</span></div>
                  </div>

                  <div className="skills-section">
                    <h4>Strengths</h4>
                    <div className="skills-list">
                      {traineeData.strengths?.map((strength, index) => (
                        <span key={index} className="skill-tag tech-tag">{strength.courseName} ({strength.avgScore}%)</span>
                      )) || <span className="no-data">No strengths data</span>}
                    </div>
                    <h4>Weaknesses</h4>
                    <div className="skills-list">
                      {traineeData.weaknesses?.map((weakness, index) => (
                        <span key={index} className="skill-tag soft-tag">{weakness.courseName} ({weakness.avgScore}%)</span>
                      )) || <span className="no-data">No weaknesses data</span>}
                    </div>
                    <h4>Certificates</h4>
                    <div className="skills-list">
                      {traineeData.certificates ? <span className="skill-tag">{traineeData.certificates}</span> : <span className="no-data">No certificates</span>}
                    </div>
                  </div>
                </div>

                {!selectedTrainee.isMapped && (
                  <div className="projects-section">
                    <div className="projects-header">
                      <h3 className="section-title"><Briefcase size={18} /> Project Matches {traineeMatches && <span className="project-count">({traineeMatches.total_matches} matches)</span>}</h3>
                    </div>

                    {traineeMatches ? (
                      <>
                        {traineeMatches.total_matches === 0 ? (
                          <div className="no-matches open-pool-message">
                            <Users2 size={48} /><h3>No Job Matches Found</h3><p>This trainee has no matches with any existing jobs.</p>
                            <div className="open-pool-info"><p><strong>This trainee is in the Open Pool.</strong></p><p>Consider creating a new job or reassessing skill requirements.</p>
                              <button className="btn-primary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); setActiveTab('createJob'); }}><Plus size={18} /> Create New Job</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {traineeMatches.perfect_match && traineeMatches.perfect_match.length > 0 && (
                              <div className="bucket-section bucket-perfect">
                                <h3 className="bucket-title">Perfect Match ({traineeMatches.perfect_match.length})</h3>
                                <div className="projects-grid">
                                  {traineeMatches.perfect_match.map((match) => {
                                    const job = jobs.find(j => j.id === match.job_id);
                                    if (job && job.openings <= 0) return null;
                                    return (
                                      <div key={match.match_id} className="project-match-card">
                                        <div className="match-card-header">
                                          <div className="project-title">
                                            <h4>{match.job_title}</h4>
                                            <div className="project-meta"><span><Building size={14} /> Job ID: #{match.job_id}</span><span><MapPin size={14} /> {Array.isArray(match.job_location) ? match.job_location.join(', ') : match.job_location}</span></div>
                                          </div>
                                          <div className={`match-score ${match.total_percentage >= 80 ? 'high' : match.total_percentage >= 50 ? 'medium' : 'low'}`}><Target size={14} /> {match.total_percentage.toFixed(1)}%</div>
                                        </div>
                                        <div className="match-details">
                                          <span>Skills: {match.skills_percentage.toFixed(1)}%</span>
                                          <span>Location: {match.location_percentage.toFixed(1)}%</span>
                                          <span><Calendar size={14} /> Posted: {match.posted_date}</span>
                                        </div>
                                        <div className="project-actions">
                                          <button className="map-to-project-btn" onClick={() => {
                                            const job = jobs.find(j => j.id === match.job_id);
                                            if (job) {
                                              if (job.openings <= 0) { toast.error('This job has no openings available.'); return; }
                                              handleMapToProject(selectedTrainee, job);
                                            }
                                          }} disabled={job && job.openings <= 0}><Link size={16} /> {job && job.openings <= 0 ? 'Job Full' : 'Map to Project'}</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {/* Similar blocks for skills_only, location_only, nearby, no_match */}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="no-matches-data">
                        <Users size={48} /><h3>No match data loaded</h3><p>Click the button below to fetch project matches for this trainee</p>
                        <button className="btn-primary" onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}>
                          <Search size={18} /> Find Project Matches
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <div className="footer-actions">
              <button className="btn-secondary" onClick={() => { setSelectedTrainee(null); setTraineeMatches(null); }}>Close</button>
              {!selectedTrainee.isMapped && !traineeMatches && !traineeMatchesLoading && (
                <button className="btn-primary" onClick={() => fetchTraineeMatches(selectedTrainee.userId || selectedTrainee.id)}>
                  <Search size={18} /> Find Matches
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== NEW: Interview Locks Tab ====================
  const renderInterviewLocks = () => {
    return (
      <div className="interview-locks">
        <div className="section-header">
          <div className="header-title">
            <h2><Lock size={24} /> Interview Locks Management</h2>
            <p className="subtitle">Track and manage locked candidates</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={downloadLockReport}>
              <Download size={18} /> Download Report
            </button>
          </div>
        </div>

        {lockStats && (
          <div className="stats-grid small">
            <div className="stat-card">
              <div className="stat-icon"><Lock size={20} /></div>
              <div className="stat-content"><h3>Locked</h3><div className="stat-value">{lockStats.total_locked}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={20} /></div>
              <div className="stat-content"><h3>Selected</h3><div className="stat-value">{lockStats.total_selected}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><X size={20} /></div>
              <div className="stat-content"><h3>Rejected</h3><div className="stat-value">{lockStats.total_rejected}</div></div>
            </div>
          </div>
        )}

        <div className="search-filter">
          <div className="filter-group">
            <select className="filter-select" value={lockFilter.status} onChange={(e) => setLockFilter({ ...lockFilter, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="locked">Locked</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="filter-select" value={lockFilter.job} onChange={(e) => setLockFilter({ ...lockFilter, job: e.target.value })}>
              <option value="">All Jobs</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            <button className="btn-icon" onClick={() => setLockFilter({ status: '', job: '' })}><X size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Job</th>
                  <th>Interview Date/Time</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Locked By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviewLocks.map(lock => (
                  <tr key={lock.id}>
                    <td><div className="trainee-info"><span className="font-medium">{lock.trainee_name}</span></div></td>
                    <td>{lock.job_title}</td>
                    <td>{new Date(lock.interview_datetime).toLocaleString()}</td>
                    <td>
                      <select
                        value={lock.status}
                        onChange={(e) => updateLockStatus(lock.id, e.target.value)}
                        className={`status-badge status-${lock.status}`}
                      >
                        <option value="locked">Locked</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{lock.comments || '-'}</td>
                    <td>{lock.locked_by_name}</td>
                    <td>
                      <button className="btn-icon btn-icon-view" onClick={() => {
                        const trainee = allTrainees.find(t => t.id === lock.trainee);
                        if (trainee) handleViewTraineeProfile(trainee);
                      }}><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
                {interviewLocks.length === 0 && <tr><td colSpan="7" className="no-data">No interview locks found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  // ================================================================

  // ==================== NEW: Lock Interview Modal ====================
  const renderLockInterviewModal = () => {
    if (!showLockModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowLockModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h3><Lock size={20} /> Lock for Interview</h3>
            <button className="modal-close" onClick={() => setShowLockModal(false)}><X /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Interview Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={lockInterviewDatetime}
                onChange={(e) => setLockInterviewDatetime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Comments (optional)</label>
              <textarea
                className="form-control"
                rows="3"
                value={lockComments}
                onChange={(e) => setLockComments(e.target.value)}
                placeholder="Add any notes or instructions..."
              />
            </div>
            <p>Selected trainees: {selectedTraineeIds.length}</p>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowLockModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleLockForInterview} disabled={!lockInterviewDatetime || loading}>
              {loading ? 'Locking...' : 'Lock for Interview'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  // ================================================================

  // Sidebar items (including new tab)
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'jobs', label: 'Job Management', icon: <Briefcase size={20} /> },
    { id: 'trainees', label: 'Trainees List', icon: <Users size={20} /> },
    { id: 'interviewLocks', label: 'Interview Locks', icon: <Lock size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'jobs': return renderJobManagement();
      case 'createJob': return renderCreateJob();
      case 'trainees':
      case 'mapped':
      case 'unmapped':
      case 'openPool':
        return renderTraineesList();
      case 'interviewLocks':
        return renderInterviewLocks();
      default: return renderDashboard();
    }
  };

  return (
    <div className="dashboard">
      <Toaster richColors position="top-right" />
      <Sidebar items={sidebarItems} activeTab={activeTab} onTabChange={setActiveTab} userData={userData} onLogout={onLogout} />
      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-title">
            <h1><LayoutDashboard size={28} /> HR Dashboard</h1>
            <div className="header-subtitle">Welcome back, {userData?.name || 'HR Manager'} | Talent Management & Job Allocation</div>
          </div>
          <div className="header-actions">
            {loading && <div className="loading-indicator"><div className="loading-spinner small"></div><span>Processing...</span></div>}
          </div>
        </div>
        {renderContent()}
      </div>

      {renderHiddenFileInputs()}
      {renderExcelTemplateModal()}
      {renderWordTemplateModal()}
      {renderJobModal()}
      {renderJobMatchesModal()}
      {renderTraineeModal()}
      {renderLockInterviewModal()}
    </div>
  );
}

export default DashboardHR;