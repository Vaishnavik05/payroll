import React, { useState } from "react";
import { createUser } from "../services/api";

const INIT = {
  name: "", email: "", employeeCode: "",
  role: "EMPLOYEE", department: "", joiningDate: ""
};

export default function CreateUser() {
  const [form, setForm] = useState(INIT);
  const [status, setStatus] = useState(null); // { type, msg }
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.employeeCode || !form.department || !form.joiningDate) {
      setStatus({ type: "error", msg: "All fields are required." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await createUser(form);
      setStatus({ type: "success", msg: `User "${res.data?.name || form.name}" created successfully.` });
      setForm(INIT);
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to create user." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Register Employee</h2>
      <p className="form-desc">HR_MANAGER · Add new employee to the payroll system</p>

      {status && (
        <div className={`alert alert-${status.type}`}>
          {status.type === "success" ? "✓" : "✗"} {status.msg}
        </div>
      )}

      <div className="form-grid">
        <div className="form-section-label">Personal Details</div>

        <div className="form-group">
          <label>Full Name</label>
          <input value={form.name} placeholder="e.g. Ravi Kumar" onChange={set("name")} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} placeholder="ravi@corp.com" onChange={set("email")} />
        </div>

        <div className="form-group">
          <label>Employee Code</label>
          <input value={form.employeeCode} placeholder="e.g. EMP0042" onChange={set("employeeCode")} />
        </div>

        <div className="form-group">
          <label>Joining Date</label>
          <input type="date" value={form.joiningDate} onChange={set("joiningDate")} />
        </div>

        <hr className="form-divider" />
        <div className="form-section-label">Role & Department</div>

        <div className="form-group">
          <label>Role</label>
          <select value={form.role} onChange={set("role")}>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="HR_MANAGER">HR_MANAGER</option>
            <option value="FINANCE">FINANCE</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="form-group">
          <label>Department</label>
          <input value={form.department} placeholder="e.g. Engineering" onChange={set("department")} />
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? "Creating..." : "Create Employee"}
          </button>
          <button className="btn btn-secondary" onClick={() => { setForm(INIT); setStatus(null); }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}