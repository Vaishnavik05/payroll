import { useState } from "react";
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
    
    setTimeout(() => {
      if (role === "ADMIN") navigate("/admin");
      else if (role === "HR_MANAGER") navigate("/hr");
      else if (role === "FINANCE") navigate("/finance");
      else navigate("/employee");
      setIsLoading(false);
    }, 500);
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
          <label>Employee Code (Password)</label>
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