import { useState } from "react";
import { createUser } from "../services/api";
import "./CreateUser.css";

export default function CreateUser() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    employeeCode: "",
    role: "",
    department: "",
    joiningDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBack = () => {
    // Check if we're coming from HR dashboard or Admin dashboard
    const currentPath = window.location.pathname;
    if (currentPath.includes('/hr')) {
      window.location.href = '/hr';
    } else {
      window.location.href = '/admin';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!user.name || !user.email || !user.role || !user.employeeCode) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      await createUser({
        ...user,
        joiningDate: user.joiningDate || new Date().toISOString().split('T')[0],
        isActive: true
      });
      setSuccess("User created successfully!");
      setUser({
        name: "",
        email: "",
        employeeCode: "",
        role: "",
        department: "",
        joiningDate: ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h2>Create User</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name*</label>
            <input
              type="text"
              id="name"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="employeeCode">Employee Code*</label>
            <input
              type="text"
              id="employeeCode"
              value={user.employeeCode}
              onChange={(e) => setUser({ ...user, employeeCode: e.target.value })}
              placeholder="e.g., EMP001"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Role*</label>
            <select
              id="role"
              value={user.role}
              onChange={(e) => setUser({ ...user, role: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              <option value="ADMIN">Admin</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="FINANCE">Finance</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              value={user.department}
              onChange={(e) => setUser({ ...user, department: e.target.value })}
              placeholder="e.g., IT, HR, Finance"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="joiningDate">Joining Date</label>
            <input
              type="date"
              id="joiningDate"
              value={user.joiningDate}
              onChange={(e) => setUser({ ...user, joiningDate: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}