import React, { useState } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Network,
  Lock,
  Mail,
  ArrowRight
} from 'lucide-react';
import './styles/Login.css';

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
      const role = decodedData.role;

      const userData = {
        id: decodedData.user_id,
        name: decodedData.username || credentials.email.split('@')[0],
        email: credentials.email,
        role: role,
        token: response.data.access,
        refreshToken: response.data.refresh,
        exp: decodedData.exp
      };

      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('userData', JSON.stringify(userData));

      toast.success('Welcome Back!', {
        description: `Successfully logged in as ${role.toUpperCase()}`,
        duration: 3000,
      });

      onLogin(role, userData);
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid email or password. Please try again.';
      toast.error('Login Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      <Toaster position="top-right" richColors />
      
      {/* Left Panel: Illustration */}
      <div className="login-left">
        <div className="illustration-container">
          <img src="/assets/login-hero.png" alt="Secure Login" className="login-illustration" />
          <div className="illustration-overlay">
            <h2>Experience Intelligent <span className="highlight">Talent Alignment</span></h2>
            <p>Our platform ensures the right people are in the right places, powered by advanced AI proximity matching.</p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-brand" onClick={onBack}>
            <Network className="logo-icon" />
            <span>Talent Align</span>
          </div>
          
          <div className="login-intro">
            <h1>Welcome Back</h1>
            <p>Please enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-footer">
             <button className="btn-back-home" onClick={onBack}>
               <ArrowLeft size={16} /> Back to Landing Page
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;