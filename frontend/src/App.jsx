import React, { useState } from "react";
import CreateUser from "./components/CreateUser";
import CreateSalary from "./components/CreateSalary";
import CreatePayroll from "./components/CreatePayroll";
import ProcessPayroll from "./components/ProcessPayroll";
import ViewPayroll from "./components/ViewPayroll";
import ViewTax from "./components/ViewTax";
import "./App.css";

const NAV = [
  { id: "users",    label: "Create User",         icon: "👤", role: "HR_MANAGER" },
  { id: "salary",   label: "Salary Structure",    icon: "💰", role: "HR_MANAGER" },
  { id: "cycle",    label: "Payroll Cycle",       icon: "📅", role: "FINANCE" },
  { id: "process",  label: "Process Payroll",     icon: "⚙️",  role: "FINANCE" },
  { id: "payslip",  label: "View Payslip",        icon: "📄", role: "EMPLOYEE" },
  { id: "tax",      label: "Tax Statement",       icon: "🧾", role: "EMPLOYEE" },
];

export default function App() {
  const [active, setActive] = useState("users");
  const [userRole, setUserRole] = useState("HR_MANAGER");

  const renderMain = () => {
    switch (active) {
      case "users":   return <CreateUser />;
      case "salary":  return <CreateSalary />;
      case "cycle":   return <CreatePayroll />;
      case "process": return <ProcessPayroll />;
      case "payslip": return <ViewPayroll />;
      case "tax":     return <ViewTax />;
      default:        return <CreateUser />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚡</span>
          <div>
            <div className="brand-title">PayrollOS</div>
            <div className="brand-sub">Corporate Suite</div>
          </div>
        </div>

        <div className="role-switcher">
          <label>Viewing as</label>
          <select value={userRole} onChange={e => setUserRole(e.target.value)}>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="FINANCE">Finance</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item ${active === n.id ? "active" : ""}`}
              onClick={() => setActive(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
              <span className="nav-role">{n.role}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>System Online</span>
        </div>
      </aside>

      <main className="main">
        <div className="main-header">
          <div>
            <h1 className="page-title">{NAV.find(n => n.id === active)?.label}</h1>
            <p className="page-sub">Corporate Payroll & Tax Deduction Workflow</p>
          </div>
          <div className="header-badge">{NAV.find(n => n.id === active)?.role}</div>
        </div>

        <div className="main-body">
          {renderMain()}
        </div>
      </main>
    </div>
  );
}