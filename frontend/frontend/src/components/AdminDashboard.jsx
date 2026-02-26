import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "./styles/AdminDashboard.css";
import { Toaster, toast } from "sonner";
import { LogOut } from "lucide-react";

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

  const rolesDef = [
    { value: "trainee", label: "Trainee", icon: <GraduationCap size={16} /> },
    { value: "ta", label: "TL", icon: <UserCog size={16} /> },
    { value: "manager", label: "Manager", icon: <Briefcase size={16} /> },
    { value: "hr", label: "HR", icon: <UserRound size={16} /> },
    { value: "admin", label: "Admin", icon: <Crown size={16} /> },
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
      toast.success(`${uploadedFile.name} ready for upload`);
    }
  };

  const handleExcelUpload = async (endpoint) => {
    if (!file) {
      toast.warning("Please select a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
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
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
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
        <h2>User Management</h2>
        <div className="adm-user-actions">
          <input
            type="text"
            placeholder="Search users..."
            className="adm-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* <label className="adm-btn-secondary" htmlFor="adm-file-upload">
            <FileSpreadsheet
              size={16}
              style={{ verticalAlign: "text-bottom", marginRight: 6 }}
            />{" "}
            Excel Upload
          </label> */}
          <input
            id="adm-file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="adm-btn-primary"
            onClick={() => setShowBulkUploadModal(true)}
          >
            Upload Excel
          </button>
          <button
            className="adm-btn-primary"
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
            <Users
              size={16}
              style={{ verticalAlign: "text-bottom", marginRight: 6 }}
            />{" "}
            Add User
          </button>
        </div>
      </div>

      <div className="adm-users-table-container">
        {loading ? (
          <div className="adm-loading-spinner">Loading users...</div>
        ) : (
          <table className="adm-users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="adm-user-info">
                      <div className="adm-user-avatar">
                        {user.username?.charAt(0)}
                      </div>
                      <div>
                        <div className="adm-user-name">{user.username}</div>
                        <div className="adm-user-id">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`adm-role-badge adm-role-${user.role}`}>
                      {rolesDef.find((r) => r.value === user.role)?.icon}{" "}
                      {rolesDef.find((r) => r.value === user.role)?.label}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`adm-status-badge adm-status-${
                        user.is_active ? "active" : "inactive"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{user.joinDate}</td>
                  <td>
                    <div className="adm-action-buttons">
                      <button
                        className="adm-btn-edit"
                        onClick={() => handleEditUser(user)}
                      >
                        <UserCog size={16} style={{ marginRight: 4 }} /> Edit
                      </button>
                      <button
                        className="adm-btn-reset"
                        onClick={() => handleResetPasswordClick(user)}
                      >
                        <KeyRound size={16} style={{ marginRight: 4 }} /> Reset
                      </button>
                      <button
                        className={`adm-btn-status ${
                          user.is_active
                            ? "adm-btn-deactivate"
                            : "adm-btn-activate"
                        }`}
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.is_active ? "Deactivate" : "Activate"}
                      >
                        {user.is_active ? (
                          <PauseCircle size={16} />
                        ) : (
                          <PlayCircle size={16} />
                        )}
                      </button>
                      <button
                        className="adm-btn-delete"
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
        )}
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="adm-statistics-tab">
      <div className="adm-section-header">
        <h2>System Statistics</h2>
      </div>

      <div className="adm-stats-grid">
        <div className="adm-stat-card adm-primary">
          <div className="adm-stat-icon">
            <Users size={24} />
          </div>
          <div className="adm-stat-content">
            <h3>Total Users</h3>
            <div className="adm-stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="adm-stat-card adm-success">
          <div className="adm-stat-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="adm-stat-content">
            <h3>Active Users</h3>
            <div className="adm-stat-value">{stats.activeUsers}</div>
          </div>
        </div>
        <div className="adm-stat-card adm-warning">
          <div className="adm-stat-icon">
            <PauseCircle size={24} />
          </div>
          <div className="adm-stat-content">
            <h3>Inactive Users</h3>
            <div className="adm-stat-value">{stats.inactiveUsers}</div>
          </div>
        </div>
      </div>

      <div className="adm-charts-grid">
        <div className="adm-chart-card">
          <h3>User Distribution by Role</h3>
          <div className="adm-role-distribution">
            {stats.roles.map((role) => (
              <div key={role.value} className="adm-role-dist-item">
                <div className="adm-role-info">
                  <span className="adm-role-icon-small">{role.icon}</span>
                  <span className="adm-role-name">{role.label}</span>
                </div>
                <div className="adm-role-stats">
                  <div className="adm-role-count">{role.count}</div>
                  <div className="adm-role-percentage">
                    {stats.totalUsers > 0
                      ? ((role.count / stats.totalUsers) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-chart-card">
          <h3>Recent Activity</h3>
          <div className="adm-activity-feed">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="adm-activity-item">
                  <div className="adm-activity-icon">
                    <FileText size={20} />
                  </div>
                  <div className="adm-activity-content">
                    <div className="adm-activity-action">{activity.action}</div>
                    <div className="adm-activity-details">
                      <span className="adm-activity-user">{activity.user}</span>
                      <span className="adm-activity-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="adm-activity-item">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <div className="adm-detailed-stats">
        <h3>Detailed User Statistics</h3>
        <div className="adm-detailed-grid">
          <div className="adm-detailed-card">
            <h4>Role Distribution</h4>
            <div className="adm-distribution-chart">
              {stats.roles.map((role) => (
                <div key={role.value} className="adm-distribution-item">
                  <div className="adm-dist-label">
                    <span className="adm-dist-icon">{role.icon}</span>
                    <span>{role.label}</span>
                  </div>
                  <div className="adm-dist-bar">
                    <div
                      className="adm-dist-fill"
                      style={{
                        width: `${
                          stats.totalUsers > 0
                            ? (role.count / stats.totalUsers) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="adm-dist-value">{role.count} users</div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-detailed-card">
            <h4>User Status Overview</h4>
            <div className="adm-status-overview">
              <div className="adm-status-item">
                <div className="adm-status-label adm-active">Active Users</div>
                <div className="adm-status-count">{stats.activeUsers}</div>
              </div>
              <div className="adm-status-item">
                <div className="adm-status-label adm-inactive">
                  Inactive Users
                </div>
                <div className="adm-status-count">{stats.inactiveUsers}</div>
              </div>
              <div className="adm-status-item">
                <div className="adm-status-label adm-total">Total Users</div>
                <div className="adm-status-count">{stats.totalUsers}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Modals ---
  const renderAddUserModal = () => (
    <div
      className="adm-modal-overlay"
      onClick={() => setShowAddUserModal(false)}
    >
      <div className="adm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
          <button
            className="adm-modal-close"
            onClick={() => setShowAddUserModal(false)}
          >
            ×
          </button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-form-group">
            <label>Username *</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              className={errors.username ? "adm-error" : ""}
            />
            {errors.username && (
              <span className="adm-error-message">{errors.username}</span>
            )}
          </div>

          <div className="adm-form-group">
            <label>Email *</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className={errors.email ? "adm-error" : ""}
            />
            {errors.email && (
              <span className="adm-error-message">{errors.email}</span>
            )}
          </div>

          {!editingUser && (
            <>
              <div className="adm-form-group">
                <label>Password (optional)</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({ ...newUser, password: e.target.value });
                    setPasswordStrength(
                      validatePassword(e.target.value).strength
                    );
                  }}
                  className={errors.password ? "adm-error" : ""}
                  placeholder="Leave blank to use default"
                />
                {errors.password && (
                  <span className="adm-error-message">{errors.password}</span>
                )}
                <div className="adm-password-strength">
                  <div className="adm-strength-meter">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`adm-strength-bar ${
                          passwordStrength >= level ? "adm-active" : ""
                        }`}
                        style={{ width: "20%" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="adm-form-group">
                <label>
                  Confirm Password (only required if password entered)
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) =>
                    setNewUser({ ...newUser, confirmPassword: e.target.value })
                  }
                  className={errors.confirmPassword ? "adm-error" : ""}
                  placeholder="Leave blank if password is blank"
                />
                {errors.confirmPassword && (
                  <span className="adm-error-message">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </>
          )}

          <div className="adm-form-group">
            <label>Role *</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {rolesDef.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-modal-actions">
          <button className="adm-btn-primary" onClick={handleAddUser}>
            {editingUser ? "Update" : "Add"}
          </button>
          <button
            className="adm-btn-secondary"
            onClick={() => setShowAddUserModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderResetPasswordModal = () => (
    <div
      className="adm-modal-overlay"
      onClick={() => setShowResetPasswordModal(false)}
    >
      <div className="adm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>Reset Password for {resettingUser?.username}</h2>
          <button
            className="adm-modal-close"
            onClick={() => setShowResetPasswordModal(false)}
          >
            ×
          </button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-form-group">
            <label>New Password</label>
            <input
              type="password"
              value={passwordReset.newPassword}
              onChange={(e) => {
                setPasswordReset({
                  ...passwordReset,
                  newPassword: e.target.value,
                });
                setPasswordStrength(validatePassword(e.target.value).strength);
              }}
            />
          </div>
          <div className="adm-form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={passwordReset.confirmPassword}
              onChange={(e) =>
                setPasswordReset({
                  ...passwordReset,
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="adm-modal-actions">
          <button className="adm-btn-primary" onClick={handleResetPassword}>
            Reset
          </button>
          <button
            className="adm-btn-secondary"
            onClick={() => setShowResetPasswordModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderBulkUploadModal = () => (
    <div
      className="adm-modal-overlay"
      onClick={() => setShowBulkUploadModal(false)}
    >
      <div className="adm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>Excel Bulk Operations</h2>
          <button
            className="adm-modal-close"
            onClick={() => setShowBulkUploadModal(false)}
          >
            ×
          </button>
        </div>

        <div className="adm-modal-body">
          <div className="adm-upload-instructions">
            <h4>Instructions:</h4>
            <ul>
              <li>Upload an Excel file (.xlsx, .xls)</li>
              <li>
                File should contain columns: <code>username</code>,{" "}
                <code>email</code>, <code>role</code>
              </li>
              <li>
                For <strong>Add Users</strong>, also include{" "}
                <code>password</code> column (optional; default applied if
                missing)
              </li>
              <li>
                For other operations, only <code>username</code> column is
                required
              </li>
              <li>
                Roles: <code>trainee</code>, <code>teamlead</code>,{" "}
                <code>manager</code>, <code>hr</code>, <code>admin</code>
              </li>
              <li>
                <a href="/template/user_bulk_template.xlsx" download='user_bulk_template.xlsx'>
                  Download Excel template
                </a>
              </li>
            </ul>
          </div>

          <div className="adm-file-upload-area">
            <input
              type="file"
              id="adm-file-upload-modal"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label
              htmlFor="adm-file-upload-modal"
              className="adm-file-upload-label"
            >
              {file ? ` ${file.name}` : "Click to upload Excel"}
            </label>

            {file && (
              <div className="adm-file-info">
                <p>Selected file: {file.name}</p>
                <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>

          <div className="adm-excel-upload-grid">
            {[
              {
                endpoint: "/users/upload-excel/",
                label: "Upload & Add Users",
                btnClass: "adm-super-btn-success",
                description: "Add new users from Excel file",
              },
              {
                endpoint: "/users/bulk-activate-upload/",
                label: "Upload & Activate Users",
                btnClass: "adm-btn-primary",
                description: "Activate users listed in Excel file",
              },
              {
                endpoint: "/users/bulk-deactivate-upload/",
                label: "Upload & Deactivate Users",
                btnClass: "adm-btn-warning",
                description: "Deactivate users listed in Excel file",
              },
            ].map((item, idx) => (
              <div key={idx} className="adm-excel-upload-card">
                <div className="adm-excel-card-content">
                  <h4>{item.label}</h4>
                  <p>{item.description}</p>
                  <button
                    onClick={() => handleExcelUpload(item.endpoint)}
                    className={`adm-btn ${item.btnClass}`}
                    disabled={!file || uploading}
                  >
                    {uploading ? "Uploading..." : item.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-modal-actions">
          <button
            className="adm-btn-secondary"
            onClick={() => setShowBulkUploadModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const sidebarItems = [
    { id: "users", label: "User Management", icon: <Users size={18} /> },
    { id: "statistics", label: "Statistics", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="adm-dashboard">
      <Toaster richColors position="top-right" duration={3000} />

      {/* Fixed Sidebar */}
      <div className="adm-sidebar">
        <div className="adm-sidebar-header">
          <h2>Admin Panel</h2>
          <p>System Administration</p>
        </div>
        <div className="adm-sidebar-nav">
          <div>
            {sidebarItems.map((item) => (
              <div
                key={item.id}
                className={`adm-nav-item ${
                  activeTab === item.id ? "adm-active" : ""
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="adm-nav-icon">{item.icon}</span>
                <span className="adm-nav-label">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="adm-header-actions">
            <button className="adm-btn-danger" onClick={onLogout}>
              <span className="logout-icon" aria-hidden="true">
                <LogOut size={20} color="currentColor" strokeWidth={2} />
              </span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Right Pane */}
      <div className="adm-main-content">
        <div className="adm-dashboard-header">
          <div className="adm-header-title">
            <h1>Admin Dashboard</h1>
          </div>
        </div>

        {activeTab === "users" && renderUsersTab()}
        {activeTab === "statistics" && renderStatisticsTab()}
      </div>

      {/* Modals */}
      {showAddUserModal && renderAddUserModal()}
      {showResetPasswordModal && renderResetPasswordModal()}
      {showBulkUploadModal && renderBulkUploadModal()}

      {/* Delete Confirmation Modal */}
      {confirmState.show && (
        <div
          className="adm-modal-overlay"
          onClick={() => setConfirmState({ show: false, user: null })}
        >
          <div
            className="adm-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h2>Confirm Delete</h2>
              <button
                className="adm-modal-close"
                onClick={() => setConfirmState({ show: false, user: null })}
              >
                ×
              </button>
            </div>
            <div className="adm-modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{confirmState.user?.username}</strong> (ID:{" "}
                {confirmState.user?.id})?
              </p>
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn-danger" onClick={confirmDeleteUser}>
                Delete
              </button>
              <button
                className="adm-btn-secondary"
                onClick={() => setConfirmState({ show: false, user: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
