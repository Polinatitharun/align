import React, { useState, useEffect } from "react";
import { LogOut, Network, ChevronRight, ChevronLeft } from "lucide-react";
import "./styles/Sidebar.css";

function Sidebar({ items, activeTab, onTabChange, userData, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
    
    // Cleanup on unmount
    return () => document.body.classList.remove("sidebar-collapsed");
  }, [isCollapsed]);

  return (
    <aside className={`modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="btn-collapse" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title="Toggle Sidebar"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="sidebar-brand">
        <div className="brand-title">
          <Network className="logo-icon" size={26} />
          {!isCollapsed && <span className="brand-text">Talent Align</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <div className="nav-item-content">
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </div>
            {(!isCollapsed && activeTab === item.id) && <ChevronRight size={16} className="active-indicator" />}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-wave-wrapper">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="sidebar-wave-svg">
            <path fill="var(--primary)" d="M0,60 C320,120 420,0 720,60 C1020,120 1120,0 1440,60 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
        <div className="sidebar-bottom-content">
          <div className="sidebar-user">
            <div className="avatar">
              {userData?.name?.charAt(0) || "U"}
            </div>
            <div className="user-meta">
              <span className="user-name">{userData?.name || "User"}</span>
              <span className="user-role">{userData?.role || "Team Member"}</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="btn-logout" onClick={onLogout}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;