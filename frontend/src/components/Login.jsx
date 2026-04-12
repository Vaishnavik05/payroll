import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    
    if (!role) {
      setError("Select role");
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
          <label>Select Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="ADMIN">Admin</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="FINANCE">Finance</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
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