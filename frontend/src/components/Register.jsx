import React, { useState } from "react";
import axios from "axios";

const ROLES = ["ADMIN", "HR_MANAGER", "FINANCE", "EMPLOYEE"];

export default function Register({ onRegister, onSwitch }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeCode: "",
    role: "EMPLOYEE",
    department: "",
    joiningDate: ""
  });
  const [error, setError] = useState("");

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/api/auth/register", form);
      onRegister(form.role);
    } catch (err) {
      setError("Registration failed. Try a different email or employee code.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div className="auth-form-group">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="auth-form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="auth-form-group">
          <label>Employee Code</label>
          <input name="employeeCode" value={form.employeeCode} onChange={handleChange} required />
        </div>
        <div className="auth-form-group">
          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="auth-form-group">
          <label>Department</label>
          <input name="department" value={form.department} onChange={handleChange} />
        </div>
        <div className="auth-form-group">
          <label>Joining Date</label>
          <input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
        </div>
        <button className="auth-btn" type="submit">Register</button>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-switch">
          Already have an account? <span onClick={onSwitch}>Login</span>
        </div>
      </form>
    </div>
  );
}