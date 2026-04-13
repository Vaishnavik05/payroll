import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [employeecode, setEmployeecode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  
  const handleLogin = async () => {
    setError("");
    
    if (!email) {
      setError("Enter email");
      return;
    }
    
    if (!role) {
      setError("Select role");
      return;
    }
    
    if (!employeecode) {
      setError("Enter employee code");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          employeeCode: employeecode.trim(),
          role: role
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate based on role without storing tokens
        if (role === "ADMIN") navigate("/admin");
        else if (role === "HR_MANAGER") navigate("/hr");
        else if (role === "FINANCE") navigate("/finance");
        else navigate("/employee");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError("Backend server not running. Please start the Spring Boot application on port 8080.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label>Select Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="ADMIN">Admin</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="FINANCE">Finance</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Employee Code</label>
          <input 
            type="password" 
            value={employeecode} 
            onChange={(e) => setEmployeecode(e.target.value)} 
            placeholder="Enter your employee code"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button 
          className="login-btn"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Login'}
        </button>
      </div>
    </div>
  );
}