import { useState, useEffect } from "react";
import CreateUser from "./CreateUser";
import { getUsers } from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [activeForm, setActiveForm] = useState("");
  const [viewMode, setViewMode] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
    totalDepartments: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await getUsers();
      const users = response.data;
      setUsers(users);
      
      const totalUsers = users.length;
      const totalRoles = [...new Set(users.map(emp => emp.role))].length;
      const totalDepartments = [...new Set(users.map(emp => emp.department).filter(Boolean))].length;
      const activeUsers = users.filter(emp => emp.isActive === true).length;
      
      setStats({
        totalUsers: totalUsers,
        totalRoles: totalRoles,
        totalDepartments: totalDepartments,
        activeUsers: activeUsers
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleStatClick = async (type) => {
    setLoading(true);
    setViewMode(type);
    setActiveForm("");
    
    if (users.length === 0) {
      try {
        const response = await getUsers();
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    }
    
    setLoading(false);
  };

  const getFilteredUsers = (mode) => {
    let filtered = [];
    
    switch(mode) {
      case "users":
        filtered = users;
        break;
      case "roles":
        filtered = users.filter(user => user.role);
        break;
      case "departments":
        filtered = users.filter(user => user.department);
        break;
      case "active":
        filtered = users.filter(user => user.isActive === true);
        break;
      default:
        filtered = [];
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (filterRole && filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    return filtered;
  };

  const goBack = () => {
    setViewMode("");
  };

  const renderForm = () => {
    switch(activeForm) {
      case "create":
        return <CreateUser />;
      default:
        return null;
    }
  };

  const renderStats = () => {
    return (
      <div className="dashboard-stats">
        <h2>System Overview</h2>
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => handleStatClick("users")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatClick("roles")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.96l4.24 4.24M20.46 14.04l-4.24 4.24M7.78 18.78L3.54 23.02"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalRoles}</h3>
              <p>User Roles</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatClick("departments")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalDepartments}</h3>
              <p>Departments</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatClick("active")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.activeUsers}</h3>
              <p>Active Users</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserDetails = () => {
    const filteredUsers = getFilteredUsers(viewMode);
    
    return (
      <div className="user-details">
        <div className="user-details-header">
          <button className="back-btn" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <h2>
            {viewMode === "users" && "All Users"}
            {viewMode === "roles" && "Users by Role"}
            {viewMode === "departments" && "Users by Department"}
            {viewMode === "active" && "Active Users"}
          </h2>
          
          {viewMode === "users" && (
            <div className="filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by name, email, or employee code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-dropdown">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="role-select"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="FINANCE">Finance</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee Code</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.employeeCode}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{user.department || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${user.isActive === true ? 'active' : 'inactive'}`}>
                        {user.isActive === true ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="nav-buttons">
        <button 
          className={`nav-btn ${activeForm === "create" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "create" ? "" : "create")}
        >
          Create User
        </button>
      </div>

      <div className="form-container">
        {viewMode ? renderUserDetails() : (activeForm ? renderForm() : renderStats())}
      </div>
    </div>
  );
}