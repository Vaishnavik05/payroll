import { useState, useEffect } from "react";
import CreateUser from "./CreateUser";
import AdminPayroll from "./AdminPayroll";
import { getUsers, getDashboardStats } from "../services/api";
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
    activeUsers: 0,
    inactiveUsers: 0,
    totalRoles: 0,
    totalDepartments: 0,
    totalPayrollsProcessed: 0,
    currentMonthPayrolls: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalDeductions: 0,
    averageSalary: 0,
    totalTaxCollected: 0,
    completedPayrollCycles: 0,
    totalPayrollCycles: 0,
    recentPayrolls: 0,
    employeesWithSalaryStructure: 0,
    payrollProcessingRate: 0,
    taxComplianceRate: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      // Fallback to basic user stats if dashboard API fails
      try {
        const usersResponse = await getUsers();
        const users = usersResponse.data;
        setUsers(users);
        
        const totalUsers = users.length;
        const totalRoles = [...new Set(users.map(emp => emp.role))].length;
        const totalDepartments = [...new Set(users.map(emp => emp.department).filter(Boolean))].length;
        const activeUsers = users.filter(emp => emp.isActive === true).length;
        
        setStats(prev => ({
          ...prev,
          totalUsers: totalUsers,
          totalRoles: totalRoles,
          totalDepartments: totalDepartments,
          activeUsers: activeUsers
        }));
      } catch (userErr) {
        console.error("Error fetching users:", userErr);
      }
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
      case "payroll":
        return <AdminPayroll />;
      default:
        return null;
    }
  };

  const renderStats = () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount || 0);
    };

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
              <p>Total Employees</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => setActiveForm("payroll")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalPayrollsProcessed}</h3>
              <p>Payrolls Processed</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalGrossSalary)}</h3>
              <p>Total Gross Salary</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.averageSalary)}</h3>
              <p>Average Salary</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalDeductions)}</h3>
              <p>Total Deductions</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalTaxCollected)}</h3>
              <p>Total Tax Collected</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => setActiveForm("payroll")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.currentMonthPayrolls}</h3>
              <p>This Month Payrolls</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.payrollProcessingRate.toFixed(1)}%</h3>
              <p>Payroll Coverage</p>
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
                      <span className="status-badge active">
                        Active
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
        <button 
          className={`nav-btn ${activeForm === "payroll" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "payroll" ? "" : "payroll")}
        >
          Payroll Management
        </button>
      </div>

      <div className="form-container">
        {viewMode ? renderUserDetails() : (activeForm ? renderForm() : renderStats())}
      </div>
    </div>
  );
}