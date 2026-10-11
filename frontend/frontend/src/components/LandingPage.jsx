import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Brain, 
  Target, 
  Zap, 
  Users, 
  Search, 
  BarChart3,
  ShieldCheck,
  Globe,
  Sparkles,
  TrendingUp,
  Cpu,
  Network
} from 'lucide-react';
import './styles/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="glass-nav">
        <div className="nav-content">
          <div className="logo">
            <Network className="logo-icon" />
            <span>Talent Align</span>
          </div>
          <div className="nav-links">
            <a href="#problem">The Problem</a>
            <a href="#solution">Our Solution</a>
            <a href="#how-it-works">How it Works</a>
            <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content reveal">
          <div className="badge">Powered by AI Matching</div>
          <h1>Precision Talent Alignment for <span className="highlight">Modern Enterprises</span></h1>
          <p>Bridge the gap between potential and performance. Our AI-driven engine matches the right talent to the right projects with surgical precision.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
          </div>
        </div>
        <div className="hero-image reveal">
          <img src="/assets/landing-hero.png" alt="AI Matching Engine" />
        </div>
      </section>

      {/* Problem Statement Section */}
      <section id="problem" className="problem-section">
        <div className="landing-section-header reveal">
          <div className="section-badge badge-danger">Market Analysis</div>
          <h2>The <span className="highlight-danger">Challenge</span></h2>
          <p>Traditional talent management systems are failing to keep pace with the velocity of modern enterprise projects, leading to massive operational friction.</p>
        </div>
        <div className="problem-grid">
          <div className="problem-card reveal">
            <div className="icon-box danger"><Target size={32} /></div>
            <h3>Manual Matching</h3>
            <p>Recruiters spend hours manually scanning profiles, leading to inconsistent results and high bias.</p>
          </div>
          <div className="problem-card reveal">
            <div className="icon-box danger"><TrendingUp size={32} /></div>
            <h3>Skill Gaps</h3>
            <p>Hidden skill shortages across the organization cause project delays and lost revenue.</p>
          </div>
          <div className="problem-card reveal">
            <div className="icon-box danger"><Globe size={32} /></div>
            <h3>Location Friction</h3>
            <p>Difficulty in coordinating talent across various geographies without complex manual tracking.</p>
          </div>
        </div>
      </section>

      {/* Our Solution Section */}
      <section id="solution" className="solution-section">
        <div className="landing-section-header reveal">
          <div className="section-badge badge-success">Advanced Intelligence</div>
          <h2>Our <span className="highlight-success">Intelligent Solution</span></h2>
          <p>We leverage high-performance AI algorithms to transform static personnel data into a dynamic, project-ready talent ecosystem.</p>
        </div>
        <div className="solution-content">
          <div className="solution-image reveal">
             <img src="/assets/intelligent-solution.png" alt="Intelligent Solution Illustration" style={{width: '100%', maxWidth: '500px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
          </div>
          <div className="solution-list reveal">
            <div className="solution-item">
              <CheckCircle className="check-icon" />
              <div>
                <h4>Haversine Proximity Matching</h4>
                <p>Advanced geographic algorithms find the closest talent for on-site requirements.</p>
              </div>
            </div>
            <div className="solution-item">
              <CheckCircle className="check-icon" />
              <div>
                <h4>Multi-Dimensional Skill Analysis</h4>
                <p>Go beyond keywords. Our AI understands proficiency, related skills, and future potential.</p>
              </div>
            </div>
            <div className="solution-item">
              <CheckCircle className="check-icon" />
              <div>
                <h4>Real-time Talent Analytics</h4>
                <p>Instant visibility into bench strength, demand trends, and hiring funnels.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="landing-section-header reveal">
          <div className="section-badge">Workflow Orchestration</div>
          <h2>How it <span className="highlight">Works</span></h2>
          <p>A precision-engineered 4-step process designed to optimize your global workforce allocation with zero friction.</p>
        </div>
        <div className="steps-container">
          <div className="step-card reveal">
            <div className="step-num">01</div>
            <div className="step-icon"><Users size={24} /></div>
            <h4>Ingest Data</h4>
            <p>Upload trainee profiles via Excel, Word, or direct DECO integration.</p>
          </div>
          <div className="step-card reveal">
            <div className="step-num">02</div>
            <div className="step-icon"><Brain size={24} /></div>
            <h4>AI Analysis</h4>
            <p>Our engine analyzes strengths, weaknesses, and geographic coordinates.</p>
          </div>
          <div className="step-card reveal">
            <div className="step-num">03</div>
            <div className="step-icon"><Cpu size={24} /></div>
            <h4>Precision Match</h4>
            <p>Generate bucketed matches (Perfect, Skills-only, Nearby) for every job.</p>
          </div>
          <div className="step-card reveal">
            <div className="step-num">04</div>
            <div className="step-icon"><ShieldCheck size={24} /></div>
            <h4>Secure Mapping</h4>
            <p>Lock interviews, gather feedback, and map talent to projects officially.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Sparkles className="logo-icon" />
            <span>Talent Align</span>
          </div>
          <p>&copy; 2026 TCS Talent Align. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;