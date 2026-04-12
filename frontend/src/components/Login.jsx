import React, { useState } from "react";

export default function Login({ onLogin, onSwitch }) {
  const [form, setForm] = useState({ email: "", employeeCode: "" });
  const [error, setError] = useState("");

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        email: form.email.trim(),
        employeeCode: form.employeeCode.trim()
      };
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onLogin(res.data.role);
    } catch (err) {
      setError("Invalid email or employee code.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        <div className="auth-form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>
        <div className="auth-form-group">
          <label>Employee Code</label>
          <input
            name="employeeCode"
            placeholder="Enter your employee code"
            value={form.employeeCode}
            onChange={handleChange}
            required
          />
        </div>
        <button className="auth-btn" type="submit">Login</button>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-switch">
          Don't have an account? <span onClick={onSwitch}>Register</span>
        </div>
      </form>
    </div>
  );
}