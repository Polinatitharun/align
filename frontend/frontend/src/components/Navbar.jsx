import React from 'react';

function Navbar({ userData, onLogout }) {
  return (
    <nav className="navbar">
      <style>{`
        .navbar {
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 0 30px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          display:flex;
          flex-direction:row;
        }
        
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }
        
        .user-details h4 {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }
        
        .user-details p {
          font-size: 12px;
          color: #6b7280;
        }
        
        .logout-btn {
          padding: 8px 20px;
          background: white;
          color: #ef4444;
          border: 1px solid #ef4444;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .logout-btn:hover {
          background: #ef4444;
          color: white;
        }
        
        .notifications {
          position: relative;
          cursor: pointer;
        }
        
        .notification-icon {
          font-size: 20px;
          color: #6b7280;
        }
        
        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .navbar {
            padding: 0 20px;
          }
          
          .user-details {
            display: none;
          }
        }
      `}</style>
      
      <div className="navbar-brand">
        <div className="logo">AI Training Platform</div>
      </div>
      
      <div className="navbar-actions">
        <div className="notifications">

        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {userData?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <h4>{userData?.name || 'User'}</h4>
            <p>{userData?.role?.toUpperCase() || 'USER'}</p>
          </div>
        </div>
        
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;