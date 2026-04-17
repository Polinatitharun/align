// LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LandingPage.css';
import { 
  Sparkles, 
  Target, 
  Users, 
  Brain, 
  BarChart3, 
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain size={28} />,
      title: 'AI-Powered Matching',
      description: 'Advanced algorithms match trainees to projects based on skills, location, and performance metrics.'
    },
    {
      icon: <Target size={28} />,
      title: 'Skill Gap Analysis',
      description: 'Identify skill shortages across your talent pool and get actionable upskilling recommendations.'
    },
    {
      icon: <Users size={28} />,
      title: 'Batch Management',
      description: 'Organize trainees by batches and compare performance across different cohorts.'
    },
    {
      icon: <BarChart3 size={28} />,
      title: 'Real-Time Analytics',
      description: 'Comprehensive dashboards with hiring funnels, time-to-fill metrics, and interviewer performance.'
    },
    {
      icon: <Shield size={28} />,
      title: 'Interview Locking',
      description: 'Secure interview scheduling with automated assignment and feedback collection.'
    },
    {
      icon: <Sparkles size={28} />,
      title: 'AI Assistant',
      description: 'Built-in chatbot provides instant answers about jobs, skills, and trainee data.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Sparkles size={28} className="logo-icon" />
            <span className="logo-text">Talent Align</span>
          </div>
          <button 
            className="nav-cta"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>AI-Powered Talent Management</span>
          </div>
          <h1 className="hero-title">
            Transform Your Workforce with
            <span className="gradient-text"> Intelligent Matching</span>
          </h1>
          <p className="hero-subtitle">
            Streamline recruitment, identify skill gaps, and match the right talent 
            to the right projects with our AI-driven platform.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary btn-large"
              onClick={() => navigate('/login')}
            >
              Get Started <ArrowRight size={20} />
            </button>
            <button className="btn-outline btn-large">
              Watch Demo
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">98%</span>
              <span className="stat-label">Match Accuracy</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">5x</span>
              <span className="stat-label">Faster Hiring</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">10k+</span>
              <span className="stat-label">Trainees Managed</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-card"></div>
            <div className="preview-card"></div>
            <div className="preview-card"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge">Why Choose Talent Align</span>
            <h2 className="section-title">
              Everything you need to <span className="gradient-text">optimize talent</span>
            </h2>
            <p className="section-subtitle">
              From skill assessment to project mapping, our platform provides end-to-end talent management.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to transform your talent strategy?</h2>
          <p className="cta-subtitle">Join leading organizations using Talent Align to build high-performing teams.</p>
          <button 
            className="btn-primary btn-large"
            onClick={() => navigate('/login')}
          >
            Start Free Trial <ArrowRight size={20} />
          </button>
          <div className="cta-trust">
            <CheckCircle size={16} /> No credit card required • 14-day free trial
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;