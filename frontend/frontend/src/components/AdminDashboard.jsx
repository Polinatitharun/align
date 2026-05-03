import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "./styles/AdminDashboard.css";
import { Toaster, toast } from "sonner";
import Sidebar from "./Sidebar";
import { Cloud } from "lucide-react";

import {
  Users,
  BarChart3,
  GraduationCap,
  UserCog,
  Briefcase,
  UserRound,
  Crown,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
  CheckCircle,
  XCircle,
  X,
  Info,
} from "lucide-react";

function AdminDashboard({ userData, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Activity log
  const [activities, setActivities] = useState([]);

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Confirmation Modal (replaces window.confirm)
  const [confirmState, setConfirmState] = useState({
    show: false,
    user: null,
  });

  // Edit/reset states
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Bulk upload
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('add');

  // Add/Edit user form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "trainee",
  });

  // Reset password form
  const [passwordReset, setPasswordReset] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    roles: [],
  });

  // --- Deco Integration State ---
  const [decoUsername, setDecoUsername] = useState("");
  const [decoPassword, setDecoPassword] = useState("");
  const [decoToken, setDecoToken] = useState(null);
  const [decoStatus, setDecoStatus] = useState(null);
  const [decoBatch, setDecoBatch] = useState("47");
  const [decoLoading, setDecoLoading] = useState(false);
  const [decoMessage, setDecoMessage] = useState("");

  const rolesDef = [
    { value: "trainee", label: "Trainee", icon: <GraduationCap size={16} /> },
    { value: "ta", label: "TL", icon: <UserCog size={16} /> },
    { value: "manager", label: "Manager", icon: <Briefcase size={16} /> },
    { value: "hr", label: "HR", icon: <UserRound size={16} /> },
    { value: "admin", label: "Admin", icon: <Crown size={16} /> },
    { value: "interviewer", label: "Interviewer", icon: <UserRound size={16} /> },
  ];

  // --- Activity Log ---
  const logAction = (action, username, details = "") => {
    const newActivity = {
      id: Date.now(),
      action,
      user: username,
      time: "Just now",
      details,
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 20));
  };

  // Initial load
  useEffect(() => {
    fetchUsers(true);
  }, []);

  const fetchUsers = async (isInitialLoad = false) => {
    try {
      setLoading(true);
      const response = await api.get("/users/");
      const usersWithFormattedData = response.data.map((user) => ({
        ...user,
        status: user.is_active ? "active" : "inactive",
        joinDate: user.date_joined ? user.date_joined.split("T")[0] : "N/A",
      }));
      setUsers(usersWithFormattedData);

      // Seed activities on first load
      if (isInitialLoad && usersWithFormattedData.length > 0) {
        const sortedUsers = [...usersWithFormattedData].sort(
          (a, b) => new Date(b.date_joined || 0) - new Date(a.date_joined || 0)
        );
        const initialActivities = sortedUsers.slice(0, 10).map((u, index) => ({
          id: `init-${index}`,
          action: "User Joined",
          user: u.username,
          time: u.joinDate,
        }));
        setActivities(initialActivities);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  useEffect(() => {
    if (users.length > 0) {
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.is_active).length;
      const inactiveUsers = users.filter((u) => !u.is_active).length;
      const roleStats = rolesDef.map((role) => ({
        ...role,
        count: users.filter((u) => u.role === role.value).length,
      }));
      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        roles: roleStats,
      });
    } else {
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        roles: rolesDef.map((role) => ({ ...role, count: 0 })),
      });
    }
  }, [users]);

  // --- Validation ---
  const validatePassword = (password) => {
    const errors = [];
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("At least one number");
    if (!/[^A-Za-z0-9]/.test(password))
      errors.push("At least one special character");

    return { strength, errors };
  };

  const DEFAULT_PASSWORD = "Tcs#12345";

  const validateForm = () => {
    const newErrors = {};
    if (!newUser.username.trim()) newErrors.username = "Username is required";
    if (!newUser.email.trim()) newErrors.email = "Email is required";

    // Password optional on Add. Validate only if provided.
    if (!editingUser) {
      if (newUser.password) {
        const pwdErrors = validatePassword(newUser.password).errors;
        if (pwdErrors.length > 0) newErrors.password = "Weak password";
        if (newUser.password !== newUser.confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordReset = () => {
    const newErrors = {};
    if (!passwordReset.newPassword)
      newErrors.newPassword = "Password is required";
    else if (validatePassword(passwordReset.newPassword).errors.length > 0)
      newErrors.newPassword = "Weak password";
    if (passwordReset.newPassword !== passwordReset.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleAddUser = async () => {
    if (!validateForm()) return;
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}/edit/`, {
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        });
        toast.success("User updated successfully!");
        logAction("User Updated", newUser.username);
      } else {
        const passwordToSend = newUser.password || DEFAULT_PASSWORD;

        await api.post("/users/add/", {
          username: newUser.username,
          email: newUser.email,
          password: passwordToSend,
          role: newUser.role,
        });
        toast.success("User added successfully!");
        logAction("User Created", newUser.username, `Default password applied`);
      }
      fetchUsers();
      setShowAddUserModal(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "trainee",
      });
      setEditingUser(null);
      setPasswordStrength(0);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleResetPassword = async () => {
    if (!validatePasswordReset()) return;
    try {
      await api.post(`/users/${resettingUser.id}/reset-password/`, {
        password: passwordReset.newPassword,
      });
      toast.success("Password reset successfully!");
      logAction("Password Reset", resettingUser.username);
      setShowResetPasswordModal(false);
      setPasswordReset({ newPassword: "", confirmPassword: "" });
      setResettingUser(null);
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  const askDeleteUser = (user) => {
    setConfirmState({ show: true, user });
  };

  const confirmDeleteUser = async () => {
    const userToDelete = confirmState.user;
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}/delete/`);
      toast.success("User deleted successfully!");
      logAction("User Deleted", userToDelete?.username || "Unknown User");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setConfirmState({ show: false, user: null });
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "trainee",
      password: "",
      confirmPassword: "",
    });
    setShowAddUserModal(true);
  };

  const handleResetPasswordClick = (user) => {
    setResettingUser(user);
    setPasswordReset({ newPassword: "", confirmPassword: "" });
    setShowResetPasswordModal(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const user = users.find((u) => u.id === userId);
      const newStatus = !user.is_active;
      await api.patch(`/users/${userId}/toggle-status/`, {
        is_active: newStatus,
      });
      toast.info(
        `User ${newStatus ? "activated" : "deactivated"} successfully!`
      );
      logAction(
        newStatus ? "User Activated" : "User Deactivated",
        user.username
      );
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  // Bulk upload
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      if (showBulkUploadModal) {
        let endpoint = "/users/upload-excel/";
        if (uploadType === "activate") endpoint = "/users/bulk-activate-upload/";
        if (uploadType === "deactivate") endpoint = "/users/bulk-deactivate-upload/";
        handleExcelUpload(endpoint, uploadedFile);
      } else {
        toast.success(`${uploadedFile.name} ready for upload`);
      }
    }
  };

  const handleExcelUpload = async (endpoint, fileOverride = null) => {
    const targetFile = fileOverride || file;
    if (!targetFile) {
      toast.warning("Please select a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", targetFile);
    try {
      setUploading(true);
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message || "Operation successful!");
      logAction("Bulk Upload", "System", "Excel/CSV file processed");
      fetchUsers();
      setFile(null);
      setShowBulkUploadModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // --- Deco Handlers ---
  const handleDecoLogin = async () => {
    if (!decoUsername || !decoPassword) {
      toast.warning("Please enter username and password");
      return;
    }
    setDecoLoading(true);
    setDecoMessage("");
    try {
      const response = await api.post("/deco/login/", {
        username: decoUsername,
        password: decoPassword,
      });
      if (response.data.success) {
        setDecoToken(response.data.token);
        toast.success("Logged in to Deco successfully");
      } else {
        toast.error("Login failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setDecoLoading(false);
    }
  };

  const handleDecoStatus = async () => {
    if (!decoToken) {
      toast.warning("Please login to Deco first");
      return;
    }
    setDecoLoading(true);
    setDecoMessage("");
    try {
      const response = await api.get("/deco/status/");
      setDecoStatus(response.data.available);
      if (response.data.available) {
        toast.success("Deco is available");
      } else {
        toast.warning("Deco is not available");
      }
    } catch (err) {
      toast.error("Failed to check status");
    } finally {
      setDecoLoading(false);
    }
  };

  const handleDecoFetch = async () => {
    if (!decoToken) {
      toast.warning("Please login to Deco first");
      return;
    }
    if (!decoBatch) {
      toast.warning("Please enter batch number");
      return;
    }
    setDecoLoading(true);
    setDecoMessage("");
    try {
      const response = await api.post(`/deco/fetch-trainees/${decoBatch}/`);
      setDecoMessage(`Success: ${response.data.message}`);
      toast.success(`Fetched and stored trainees for batch ${decoBatch}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Fetch failed");
    } finally {
      setDecoLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Tabs ---
  const renderUsersTab = () => (
    <div className="adm-users-tab">
      <div className="adm-section-header">
        <div className="adm-header-title">
          <h2><Users size={24} /> User Management</h2>
          <p className="adm-subtitle">Monitor and manage all platform identities</p>
        </div>
        <div className="adm-header-actions">
          <div className="adm-search-box">
            <input
              type="text"
              placeholder="Search users by name, email or ID..."
              className="adm-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="adm-action-group">
            <button
              className="btn btn-success"
              onClick={() => setShowBulkUploadModal(true)}
            >
              <FileSpreadsheet size={18} /> Bulk Import
            </button>
            <button
              className="btn btn-primary btn-cta"
              onClick={() => {
                setEditingUser(null);
                setNewUser({
                  username: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  role: "trainee",
                });
                setShowAddUserModal(true);
              }}
            >
              <Plus size={18} /> Add New User
            </button>
          </div>
        </div>
      </div>

      <div className="adm-users-table-container">
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Syncing user directory...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Contact Email</th>
                  <th>Access Role</th>
                  <th>Account Status</th>
                  <th>Join Date</th>
                  <th>Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-user-avatar">
                          {user.username?.charAt(0)}
                        </div>
                        <div className="adm-user-details">
                          <div className="adm-user-name">{user.username}</div>
                          <div className="adm-user-id">UID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><div className="adm-email-cell">{user.email}</div></td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {rolesDef.find((r) => r.value === user.role)?.icon}{" "}
                        {rolesDef.find((r) => r.value === user.role)?.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${user.is_active ? "status-active" : "status-inactive"}`}
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.is_active ? "Click to Deactivate" : "Click to Activate"}
                      >
                        {user.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {user.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td><div className="adm-date-cell">{user.joinDate}</div></td>
                    <td>
                      <div className="adm-action-buttons">
                        <button
                          className="btn-icon btn-icon-edit"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <UserCog size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-view"
                          onClick={() => handleResetPasswordClick(user)}
                          title="Reset Password"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-delete"
                          onClick={() => askDeleteUser(user)}
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="adm-statistics-tab">
      <div className="adm-section-header">
        <div className="adm-header-title">
          <h2><BarChart3 size={24} /> System Analytics</h2>
          <p className="adm-subtitle">Real-time telemetry and platform usage metrics</p>
        </div>
      </div>

      <div className="admin-hero-stats">
        <div className="hero-stat-card">
          <div className="hero-stat-value">{stats.totalUsers}</div>
          <div className="hero-stat-label">Total Identities</div>
        </div>
        <div className="hero-stat-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <div className="hero-stat-value">{stats.activeUsers}</div>
          <div className="hero-stat-label">Active Sessions</div>
        </div>
        <div className="hero-stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <div className="hero-stat-value">{stats.inactiveUsers}</div>
          <div className="hero-stat-label">Suspended Accounts</div>
        </div>
      </div>

      <div className="adm-analytics-grid">
        <div className="adm-analytics-card">
          <div className="adm-card-header">
            <h3>Identity Distribution</h3>
            <span className="badge-outline">By Access Role</span>
          </div>
          <div className="adm-distribution-list">
            {stats.roles.map((role) => (
              <div key={role.value} className="adm-dist-row">
                <div className="adm-dist-info">
                  <span className={`role-badge role-${role.value}`}>{role.icon} {role.label}</span>
                  <span className="adm-dist-count">{role.count} users</span>
                </div>
                <div className="adm-progress-container">
                  <div 
                    className="adm-progress-fill" 
                    style={{ 
                      width: `${stats.totalUsers > 0 ? (role.count / stats.totalUsers) * 100 : 0}%`,
                      backgroundColor: role.value === 'admin' ? '#ef4444' : role.value === 'trainee' ? '#10b981' : 'var(--primary)'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-analytics-card">
          <div className="adm-card-header">
            <h3>Administrative Audit Trail</h3>
            <button className="btn-text">View All</button>
          </div>
          <div className="adm-audit-feed">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="adm-audit-item">
                  <div className="adm-audit-icon">
                    <div className="icon-circle"><FileText size={16} /></div>
                  </div>
                  <div className="adm-audit-content">
                    <div className="adm-audit-action">{activity.action}</div>
                    <div className="adm-audit-meta">
                      <span className="audit-user">{activity.user}</span>
                      <span className="audit-divider">•</span>
                      <span className="audit-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="adm-empty-state">
                <FileText size={40} />
                <p>No recent administrative actions recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- NEW Deco Tab ---
  const renderDecoTab = () => (
    <div className="adm-deco-tab">
      <div className="adm-section-header">
        <div className="adm-header-title">
          <h2><Cloud size={24} /> Deco System Integration</h2>
          <p className="adm-subtitle">Synchronize platform data with corporate identity services</p>
        </div>
      </div>

      <div className="adm-deco-panels">
        <div className="adm-deco-control-panel">
          <div className="adm-deco-card">
            <div className="adm-card-header">
              <h3>Service Authentication</h3>
              <div className={`connection-status ${decoToken ? 'connected' : 'disconnected'}`}>
                <div className="status-dot"></div>
                {decoToken ? 'Linked' : 'Disconnected'}
              </div>
            </div>
            
            <div className="form-group">
              <label>Service Identity</label>
              <input
                type="text"
                className="form-control"
                value={decoUsername}
                onChange={(e) => setDecoUsername(e.target.value)}
                placeholder="Service Account ID"
                disabled={decoToken}
              />
            </div>
            <div className="form-group">
              <label>Access Credential</label>
              <input
                type="password"
                className="form-control"
                value={decoPassword}
                onChange={(e) => setDecoPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={decoToken}
              />
            </div>
            
            <button
              className={`btn ${decoToken ? 'btn-secondary' : 'btn-primary'} btn-block`}
              onClick={handleDecoLogin}
              disabled={decoLoading || decoToken}
            >
              {decoLoading ? <div className="loading-spinner-sm"></div> : decoToken ? "Identity Verified" : "Establish Connection"}
            </button>
          </div>

          {decoToken && (
            <div className="adm-deco-card margin-top-2">
              <div className="adm-card-header">
                <h3>System Availability</h3>
                <button 
                  className="btn-icon-refresh" 
                  onClick={handleDecoStatus}
                  disabled={decoLoading}
                >
                  <BarChart3 size={16} />
                </button>
              </div>
              <div className="status-display">
                {decoStatus === null ? (
                  <p className="helper-text">Check availability status...</p>
                ) : (
                  <div className={`status-badge-large ${decoStatus ? 'online' : 'offline'}`}>
                    {decoStatus ? <CheckCircle size={24} /> : <XCircle size={24} />}
                    <span>Deco Services are {decoStatus ? 'Operational' : 'Unreachable'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="adm-deco-data-panel">
          <div className="adm-deco-card h-full">
            <div className="adm-card-header">
              <h3>Data Synchronization</h3>
              <span className="badge-outline">Batch Fetch</span>
            </div>
            <p className="helper-text margin-bottom-2">Import identity records directly from Deco by specifying a target batch identifier.</p>
            
            <div className="form-group">
              <label>Corporate Batch Identifier</label>
              <div className="input-with-action">
                <input
                  type="text"
                  className="form-control"
                  value={decoBatch}
                  onChange={(e) => setDecoBatch(e.target.value)}
                  placeholder="e.g. BATCH-47-2024"
                  disabled={!decoToken}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleDecoFetch}
                  disabled={decoLoading || !decoToken}
                >
                  {decoLoading ? "Syncing..." : "Sync Directory"}
                </button>
              </div>
            </div>

            <div className="sync-instructions">
              <h4>Synchronization Protocol:</h4>
              <ul>
                <li>Identities will be mapped based on corporate email addresses.</li>
                <li>New records will be provisioned as <code>trainees</code> by default.</li>
                <li>System will prevent duplicate record creation.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Modals ---
  const renderAddUserModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {editingUser ? <UserCog size={20} /> : <Plus size={20} />}
            <h2>{editingUser ? "Edit Profile" : "Create New Identity"}</h2>
          </div>
          <button className="modal-close" onClick={() => setShowAddUserModal(false)}><X /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label><span className="required">*</span> Username</label>
            <input
              type="text"
              placeholder="e.g. john_doe"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className={errors.username ? "form-control error" : "form-control"}
              disabled={loading}
            />
            {errors.username && <span className="helper-text error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label><span className="required">*</span> Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className={errors.email ? "form-control error" : "form-control"}
              disabled={loading}
            />
            {errors.email && <span className="helper-text error">{errors.email}</span>}
          </div>

          {!editingUser && (
            <>
              <div className="form-group">
                <label>Access Password <span className="helper-text">(Optional)</span></label>
                <input
                  type="password"
                  placeholder="Leave blank for default"
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({ ...newUser, password: e.target.value });
                    setPasswordStrength(validatePassword(e.target.value).strength);
                  }}
                  className={errors.password ? "form-control error" : "form-control"}
                  disabled={loading}
                />
                <div className="password-strength-bar">
                  <div className={`password-strength-fill ${passwordStrength >= 4 ? 'strength-strong' : passwordStrength >= 2 ? 'strength-medium' : 'strength-weak'}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat access password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? "form-control error" : "form-control"}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label><span className="required">*</span> Administrative Role</label>
            <div className="role-select-grid">
              {rolesDef.map((r) => (
                <div
                  key={r.value}
                  className={`role-option ${newUser.role === r.value ? 'selected' : ''}`}
                  onClick={() => setNewUser({ ...newUser, role: r.value })}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddUserModal(false)} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddUser} disabled={loading}>
            {editingUser ? "Update Identity" : "Provision Account"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResetPasswordModal = () => (
    <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title"><KeyRound size={20} /><h2>Reset Password</h2></div>
          <button className="modal-close" onClick={() => setShowResetPasswordModal(false)}><X /></button>
        </div>
        <div className="modal-body">
          <p className="helper-text margin-bottom-1">Updating credentials for <strong>{resettingUser?.username}</strong></p>
          <div className="form-group">
            <label>New Secure Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Min. 8 characters"
              value={passwordReset.newPassword}
              onChange={(e) => {
                setPasswordReset({ ...passwordReset, newPassword: e.target.value });
                setPasswordStrength(validatePassword(e.target.value).strength);
              }}
            />
            <div className="password-strength-bar">
              <div className={`password-strength-fill ${passwordStrength >= 4 ? 'strength-strong' : passwordStrength >= 2 ? 'strength-medium' : 'strength-weak'}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
            </div>
          </div>
          <div className="form-group">
            <label>Verify Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat new password"
              value={passwordReset.confirmPassword}
              onChange={(e) => setPasswordReset({ ...passwordReset, confirmPassword: e.target.value })}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleResetPassword}>Reset Credentials</button>
        </div>
      </div>
    </div>
  );

  const renderBulkUploadModal = () => (
    <div className="modal-overlay" onClick={() => setShowBulkUploadModal(false)}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title"><FileSpreadsheet size={20} /><h2>Bulk Identity Operations</h2></div>
          <button className="modal-close" onClick={() => setShowBulkUploadModal(false)}><X /></button>
        </div>
        <div className="modal-body">
          <div className="bulk-actions-grid">
            <div className="bulk-action-card">
              <div className="bulk-action-icon"><UserCog size={24} /></div>
              <h4>Provision Identities</h4>
              <p>Add multiple new users to the platform directory at once.</p>
              <button className="btn btn-primary btn-sm" onClick={() => { setUploadType('add'); document.getElementById('adm-file-upload').click(); }}>Select File</button>
            </div>
            <div className="bulk-action-card">
              <div className="bulk-action-icon"><CheckCircle size={24} /></div>
              <h4>Batch Activation</h4>
              <p>Re-activate a list of users across different roles.</p>
              <button className="btn btn-success btn-sm" onClick={() => { setUploadType('activate'); document.getElementById('adm-file-upload').click(); }}>Select File</button>
            </div>
            <div className="bulk-action-card">
              <div className="bulk-action-icon"><XCircle size={24} /></div>
              <h4>Batch Suspension</h4>
              <p>Suspend account access for multiple identities simultaneously.</p>
              <button className="btn btn-danger btn-sm" onClick={() => { setUploadType('deactivate'); document.getElementById('adm-file-upload').click(); }}>Select File</button>
            </div>
          </div>

          <div className="alert-info margin-top-1">
            <div className="alert-icon"><Info size={18} /></div>
            <div className="alert-content">
              <h4>Schema Requirements</h4>
              <p>File must be <strong>.xlsx</strong> or <strong>.csv</strong> with columns: <code>username</code>, <code>email</code>, <code>role</code>. <a href="/template/user_bulk_template.xlsx" className="link" download>Download Sample Template</a></p>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowBulkUploadModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  const sidebarItems = [
    { id: "users", label: "User Management", icon: <Users size={18} /> },
    { id: "statistics", label: "Statistics", icon: <BarChart3 size={18} /> },
    { id: "deco", label: "Deco Integration", icon: <Cloud size={18} /> }, // NEW
  ];

  return (
    <div className="dashboard-page">
      <Toaster richColors position="top-right" duration={3000} />
      <Sidebar
        items={sidebarItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userData={userData}
        onLogout={onLogout}
      />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="dashboard-content">
          <div className="tab-panel">
            {activeTab === "users" && renderUsersTab()}
            {activeTab === "statistics" && renderStatisticsTab()}
            {activeTab === "deco" && renderDecoTab()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddUserModal && renderAddUserModal()}
      {showResetPasswordModal && renderResetPasswordModal()}
      {showBulkUploadModal && renderBulkUploadModal()}

      {confirmState.show && (
        <div className="modal-overlay" onClick={() => setConfirmState({ show: false, user: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn-icon" onClick={() => setConfirmState({ show: false, user: null })}>✕</button>
            </div>
            <p>Are you sure you want to delete <strong>{confirmState.user?.username}</strong> (ID: {confirmState.user?.id})?</p>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={confirmDeleteUser}>Delete</button>
              <button className="btn btn-ghost" onClick={() => setConfirmState({ show: false, user: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;