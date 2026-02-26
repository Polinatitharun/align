import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import DashboardHR from './components/DashboardHR';
import DashboardManager from './components/DashboardManager';
import DashboardTeamLead from './components/DashboardTeamLead';
import DashboardTrainee from './components/DashboardTrainee';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardInterviewer from './components/interviewDashbaord';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (on page refresh)
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setUserRole(parsedData.role);
    }
  }, []);

  const handleLogin = (role, data) => {
    setUserRole(role);
    setUserData(data);
    // Store in localStorage for persistence
    localStorage.setItem('userData', JSON.stringify(data));
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserData(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  };

  const getDashboardPath = (role) => {
  switch (role) {
    case 'hr':
      return '/hr-dashboard';
    case 'manager':
      return '/manager-dashboard';
    case 'ta':
      return '/teamlead-dashboard';
    case 'trainee':
      return '/trainee-dashboard';
    case 'admin':
      return '/admin-dashboard';
    default:
      return '/';
  }
};

  return (
    // <Router>
    //   <div className="App">
    //     <Routes>
    //       {/* Public Routes */}
    //       <Route path="/" element={<LandingPage />} />
    //      <Route 
    //       path="/login" 
    //       element={
    //         userRole ? (
    //           <Navigate to={getDashboardPath(userRole)} replace />
    //         ) : (
    //           <Login onLogin={handleLogin} onBack={() => window.history.back()} />
    //         )
    //       }
    //       />

          
    //       {/* Protected Routes based on role */}
    //       <Route 
    //         path="/hr-dashboard" 
    //         element={
    //           <ProtectedRoute allowedRoles={['hr']} userRole={userRole}>
    //             <DashboardHR userData={userData} onLogout={handleLogout} />
    //           </ProtectedRoute>
    //         } 
    //       />
          
    //       <Route 
    //         path="/manager-dashboard" 
    //         element={
    //           <ProtectedRoute allowedRoles={['manager']} userRole={userRole}>
    //             <DashboardManager userData={userData} onLogout={handleLogout} />
    //           </ProtectedRoute>
    //         } 
    //       />
          
    //       <Route 
    //         path="/teamlead-dashboard" 
    //         element={
    //           <ProtectedRoute allowedRoles={['ta']} userRole={userRole}>
    //             <DashboardTeamLead userData={userData} onLogout={handleLogout} />
    //           </ProtectedRoute>
    //         } 
    //       />
          
    //       <Route 
    //         path="/trainee-dashboard" 
    //         element={
    //           <ProtectedRoute allowedRoles={['trainee']} userRole={userRole}>
    //             <DashboardTrainee userData={userData} onLogout={handleLogout} />
    //           </ProtectedRoute>
    //         } 
    //       />
          
    //       <Route 
    //         path="/admin-dashboard" 
    //         element={
    //           <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
    //             <AdminDashboard userData={userData} onLogout={handleLogout} />
    //           </ProtectedRoute>
    //         } 
    //       />
          
    //       {/* Catch-all route */}
    //       <Route path="*" element={<Navigate to="/" replace />} />
    //     </Routes>
    //   </div>
    // </Router>
    <DashboardInterviewer/>
  );
}

export default App;