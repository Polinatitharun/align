
import React from "react";
import Navbar from "./Navbar";
// ⬇️ Import the logout icon from lucide-react
import { LogOut } from "lucide-react";

function Sidebar({ items, activeTab, onTabChange, userData, onLogout }) {
  // console.log(userData)
  return (
    <div className="sidebar-layout">
      <style>{`
        .sidebar-layout {
          display: flex;
          min-height: 100vh;
        }
        
        /* Make the sidebar fixed and non-scrollable */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 250px;
          height: 100vh;
          background: #1f2937;
          color: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          z-index: 100;
        }
        
        .sidebar-header {
          padding: 30px 20px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;             /* header height stays fixed */
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .profile-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 600;
        }
        
        .profile-info h3 {
          font-size: 16px;
          color: white ;
          margin-bottom: 4px;
          font-weight: 600;
        }
        
        .profile-info p {
          font-size: 12px;
          /* color: #6b7280; */
        }
        
        /* Remove scrolling from the nav area too */
        .sidebar-nav {
          flex: 1;                    /* occupies remaining space */
          padding: 20px 0;
          overflow: hidden;           /* critical: no scroll even if items overflow */
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          /* Optional: clamp if items overflow */
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        
        .nav-item:hover {
          background: #f9fafb;
          color: #374151;
        }
        
        .nav-item.active {
          background: #f3f4f6;
          color: #111827;
          border-left-color: #667eea;
          font-weight: 600;
        }
        
        .nav-icon {
          font-size: 18px;
          width: 24px;
          flex-shrink: 0;
        }
        
        .nav-label {
          font-size: 14px;
        }
        
        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;             /* footer stays visible */
        }
        
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: rgb(243, 56, 56);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: rgb(220, 40, 40);
        }

        /* Make sure the icon has a consistent size */
        .logout-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Since sidebar is fixed, push main content to the right */
        .main-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: 250px;         /* equal to sidebar width */
          min-height: 100vh;
        }
        
        @media (max-width: 768px) {
          .sidebar {
            width: 70px;
          }
          
          .sidebar-header {
            padding: 20px 10px;
          }
          
          .user-profile {
            justify-content: center;
          }
          
          .profile-info {
            display: none;
          }
          
          .nav-label {
            display: none;
          }
          
          .nav-item {
            justify-content: center;
            padding: 14px 10px;
          }
          
          .sidebar-footer {
            padding: 10px;
          }
          
          .logout-btn span.logout-text {
            display: none; /* hides the text on mobile, keeps icon visible */
          }

          /* Update content offset on mobile */
          .main-content-wrapper {
            margin-left: 70px;
          }
        }
      `}</style>

      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="profile-avatar">
              
              {userData?.name?.charAt(0) || "U"}
            </div>
            <div className="profile-info-1">
              <h3>{userData?.name || "User"}</h3>
              <p>{userData?.role?.toUpperCase() || "USER"}</p>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {items.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => onTabChange(item.id)}
              title={item.label} /* helps when labels get ellipsized */
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout} title="Logout">
            {/* Lucide LogOut icon */}
            <span className="logout-icon" aria-hidden="true">
              <LogOut size={20} color="currentColor" strokeWidth={2} />
            </span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* If you want the Navbar and page content visible to the right, keep this wrapper */}
      {/* <div className="main-content-wrapper">
        <Navbar userData={userData} onLogout={onLogout} />
        // ...your page content here
      </div> */}
    </div>
  );
}

export default Sidebar;