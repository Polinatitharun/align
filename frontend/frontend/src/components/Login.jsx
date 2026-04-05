import React, { useState } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'sonner'; // ✅ Sonner

// ✅ Import Lucide icons
import {
  Eye,
  EyeOff,
  ArrowLeft,
  GraduationCap,
  UserCog,
  Briefcase,
  UserRound,
} from 'lucide-react';

function Login({ onLogin, onBack }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/login/', {
        email: credentials.email,
        password: credentials.password,
        username: credentials.email
      });

      const decodedData = jwtDecode(response.data.access);
      console.log("Decoded JWT data:", decodedData);

      const role = decodedData.role;

      const userData = {
        id: decodedData.user_id || 7,
        name: decodedData.username || credentials.email.split('@')[0],
        email: credentials.email,
        role: role,
        token: response.data.access,
        refreshToken: response.data.refresh,
        exp: decodedData.exp,
        iat: decodedData.iat
      };

      // Store tokens
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('userData', JSON.stringify(userData));

      // ✅ Enhanced success toast with role-based message
      const roleMessages = {
        'trainee': `Welcome back, ${userData.name}! Ready to explore opportunities?`,
        'ta': `Welcome, Team Lead ${userData.name}!`,
        'manager': `Welcome, Manager ${userData.name}! Dashboard is ready.`,
        'hr': `Welcome, HR Professional ${userData.name}! Let's manage talent.`
      };
      
      toast.success('Login Successful', {
        description: roleMessages[role] || `Welcome back, ${userData.name}!`,
        duration: 3000,
        icon: '👋',
      });

      // Proceed with login
      onLogin(role, userData);
    } catch (error) {
      console.log("Login error:", error);

      // ✅ Enhanced error toast with different types
      let toastConfig = {
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => {
            setCredentials({...credentials, password: ''});
            document.querySelector('input[name="email"]')?.focus();
          },
        },
      };

      if (error.response?.status === 401) {
        toast.error('Invalid Credentials', {
          description: 'Please check your email and password.',
          ...toastConfig
        });
      } else if (error.response?.status === 404) {
        toast.error('Account Not Found', {
          description: 'No user found with this email address.',
          ...toastConfig
        });
      } else if (error.response?.status === 403) {
        toast.error('Access Denied', {
          description: 'Your account is not authorized to access this system.',
          ...toastConfig
        });
      } else if (error.response?.status >= 500) {
        toast.error('Server Error', {
          description: 'Please try again in a few minutes.',
          ...toastConfig
        });
      } else if (error.message === 'Network Error') {
        toast.error('Network Error', {
          description: 'Please check your internet connection.',
          ...toastConfig
        });
      } else {
        const message = error?.response?.data?.detail ||
          error?.message ||
          'Login failed. Please check your credentials.';
        toast.error('Login Failed', {
          description: message,
          ...toastConfig
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Demo credentials for testing
  const handleDemoLogin = (role) => {
    const demoCredentials = {
      'trainee': { email: 'trainee@example.com', password: 'demo123' },
      'manager': { email: 'manager@example.com', password: 'demo123' },
      'ta': { email: 'ta@example.com', password: 'demo123' },
      'hr': { email: 'hr@example.com', password: 'demo123' }
    };

    setCredentials(demoCredentials[role]);
    
    // Show loading toast
    const demoToast = toast.loading(`Logging in as ${role}...`, {
      duration: 2000,
    });
    
    // Simulate login after a delay
    setTimeout(() => {
      toast.dismiss(demoToast);
      toast.info('Demo Mode', {
        description: `Using ${role} demo credentials`,
        duration: 2000,
      });
    }, 1000);
  };

  return (
    <div className="login-page">
      {/* ✅ Global Toaster Configuration */}
      <Toaster 
        position="top-right" 
        richColors 
        expand
        toastOptions={{
          classNames: {
            toast: '!rounded-lg !shadow-lg',
            title: '!font-semibold',
            description: '!text-sm !opacity-90',
          },
        }}
      />

      <style>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .login-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 450px;
          padding: 40px 30px;
        }
        .login-header { text-align: center; margin-bottom: 30px; }
        .login-title { font-size: 32px; color: #333; margin-bottom: 10px; font-weight: 600; }
        .login-subtitle { color: #666; font-size: 15px; }
        .login-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-label { margin-bottom: 8px; font-weight: 500; color: #374151; font-size: 14px; }
        .form-input {
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .password-wrapper { position: relative; }
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .login-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }
        .login-button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); }
        .login-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .back-button {
          width: 100%;
          background: transparent;
          color: #666;
          border: 2px solid #e5e7eb;
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .back-button:hover { background: #f9fafb; }
        .demo-section { margin-top: 25px; padding-top: 25px; border-top: 1px solid #e5e7eb; text-align: center; }
        .demo-title { font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500; }
        .demo-buttons { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .demo-button {
          padding: 10px 14px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .demo-button:hover { 
          background: #e5e7eb;
          transform: translateY(-1px);
        }
        .loading-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .login-container { padding: 30px 20px; }
          .login-title { font-size: 28px; }
          .demo-buttons { flex-direction: column; }
          .demo-button { width: 100%; }
        }
      `}</style>

      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Sign In</h1>
          <p className="login-subtitle">Enter your credentials to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="text"
              name="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="form-input"
              placeholder="Enter your Email"
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="form-input"
                placeholder="Enter your password"
                style={{ width: '100%' }}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
          
          <button 
            type="button" 
            className="back-button" 
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
        </form>

        {/* Demo Login Section */}
        {/* <div className="demo-section">
          <div className="demo-title">Quick Demo Login</div>
          <div className="demo-buttons">
            <button 
              type="button" 
              className="demo-button" 
              onClick={() => handleDemoLogin('trainee')}
              disabled={isLoading}
            >
              <GraduationCap size={16} /> Trainee
            </button>
            <button 
              type="button" 
              className="demo-button" 
              onClick={() => handleDemoLogin('manager')}
              disabled={isLoading}
            >
              <Briefcase size={16} /> Manager
            </button>
            <button 
              type="button" 
              className="demo-button" 
              onClick={() => handleDemoLogin('ta')}
              disabled={isLoading}
            >
              <UserCog size={16} /> Team Lead
            </button>
            <button 
              type="button" 
              className="demo-button" 
              onClick={() => handleDemoLogin('hr')}
              disabled={isLoading}
            >
              <UserRound size={16} /> HR
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Login;