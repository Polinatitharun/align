// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, userRole }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('access') && localStorage.getItem('userData');
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has the required role
  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role, or to home
    switch(userRole) {
      case 'hr':
        return <Navigate to="/hr-dashboard" replace />;
      case 'manager':
        return <Navigate to="/manager-dashboard" replace />;
      case 'ta':
        return <Navigate to="/teamlead-dashboard" replace />;
      case 'trainee':
        return <Navigate to="/associate-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'interviewer':
        return <Navigate to="/interviewer-dashboard" replace />;
      case 'course_owner':
        return <Navigate to="/course-owner-dashboard" replace />;
      
      default:
        return <Navigate to="/login" replace />;
    }
  }
  
  // User is authenticated and has correct role
  return children;
};

export default ProtectedRoute;