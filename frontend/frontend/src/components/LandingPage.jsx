import React from 'react';
import { useNavigate } from 'react-router-dom';
function LandingPage({ onNavigate }) {
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        /* Animated Background */
        .animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          z-index: 0;
        }
        
        /* Floating Elements */
        .floating-element {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 20s infinite linear;
        }
        
        .floating-element:nth-child(1) {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }
        
        .floating-element:nth-child(2) {
          width: 200px;
          height: 200px;
          bottom: 20%;
          right: 15%;
          animation-delay: -10s;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, 30px) rotate(120deg);
          }
          66% {
            transform: translate(-30px, 15px) rotate(240deg);
          }
        }
        
        /* Content */
        .content {
          position: relative;
          z-index: 1;
          max-width: 600px;
        }
        
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
        }
        
        .logo-icon {
          font-size: 48px;
        }
        
        .logo-text {
          font-size: 42px;
          font-weight: 700;
          background: linear-gradient(to right, #ffffff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .title {
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 40px;
          line-height: 1.6;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* CTA Button */
        .cta-button {
          background: white;
          color: #667eea;
          padding: 16px 40px;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        
        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }
        
        .cta-button:active {
          transform: translateY(0);
        }
        
        /* Footer Note */
        .footer-note {
          position: absolute;
          bottom: 30px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .title {
            font-size: 2.5rem;
          }
          
          .logo-text {
            font-size: 32px;
          }
          
          .logo-icon {
            font-size: 36px;
          }
          
          .subtitle {
            font-size: 1rem;
            padding: 0 20px;
          }
        }
        
        @media (max-width: 480px) {
          .title {
            font-size: 2rem;
          }
          
          .logo {
            flex-direction: column;
            gap: 8px;
          }
          
          .logo-text {
            font-size: 28px;
          }
          
          .cta-button {
            padding: 14px 30px;
            font-size: 1rem;
          }
        }
      `}</style>

      {/* Animated Background */}
      <div className="animated-bg">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>

      {/* Main Content */}
      <div className="content">
        <div className="logo">
          {/* <span className="logo-icon">🚀</span> */}
          <span className="logo-text">Talent Align</span>
        </div>
        
        <h1 className="title">
          AI-Powered Training
          <br />
          & Job Matching Platform
        </h1>
        
        <p className="subtitle">
          Transform your workforce with intelligent skill development, 
          performance evaluation, and precision job matching powered by 
          advanced AI and machine learning.
        </p>
        
        <button 
          className="cta-button"
           onClick={() => navigate('/login')}
        >
          <span>Get Started</span>
          <span>→</span>
        </button>
      </div>
      
      {/* <div className="footer-note">
        Click "Get Started" to access the platform
      </div> */}
    </div>
  );
}

export default LandingPage;