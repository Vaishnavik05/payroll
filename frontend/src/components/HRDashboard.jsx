import { useState, useEffect } from "react";
import CreateSalary from "./CreateSalary";
import UpdateSalary from "./UpdateSalary";
import ViewSalaryStructures from "./ViewSalaryStructures";
import DeductionRuleForm from "./DeductionRuleForm";
import { getUsers, getSalaryByEmployee } from "../services/api";
import "./HRDashboard.css";

export default function HRDashboard() {
  const [activeForm, setActiveForm] = useState("");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    averageSalary: 0,
    pendingSalaries: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await getUsers();
      const employees = response.data;
      
      const totalEmployees = employees.length;
      const totalDepartments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].length;
      
      // Calculate actual average salary from salary structures
      let totalSalary = 0;
      let employeesWithSalary = 0;
      
      for (const employee of employees) {
        try {
          const salaryResponse = await getSalaryByEmployee(employee.id);
          const salaryStructures = salaryResponse.data;
          
          if (salaryStructures && salaryStructures.length > 0) {
            // Get the latest salary structure (first one in array)
            const latestSalary = salaryStructures[0];
            const totalMonthlySalary = 
              (latestSalary.basic || 0) + 
              (latestSalary.hra || 0) + 
              (latestSalary.da || 0) + 
              (latestSalary.specialAllowance || 0) + 
              (latestSalary.bonus || 0) + 
              (latestSalary.lta || 0);
            
            totalSalary += totalMonthlySalary;
            employeesWithSalary++;
          }
        } catch (salaryErr) {
          console.log(`No salary structure found for employee ${employee.id}`);
        }
      }
      
      const averageSalary = employeesWithSalary > 0 ? Math.round(totalSalary / employeesWithSalary) : 0;
      
      setStats({
        totalEmployees: totalEmployees,
        totalDepartments: totalDepartments,
        averageSalary: averageSalary,
        pendingSalaries: Math.floor(totalEmployees * 0.1)
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const renderForm = () => {
    switch(activeForm) {
      case "create":
        return <CreateSalary />;
      case "update":
        return <UpdateSalary />;
      case "view":
        return <ViewSalaryStructures />;
      case "deduction":
        return <DeductionRuleForm />;
      default:
        return null;
    }
  };

  const renderStats = () => {
    return (
      <div className="dashboard-stats">
        <h2>Dashboard Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalEmployees}</h3>
              <p>Total Employees</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalDepartments}</h3>
              <p>Total Departments</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Rs. {stats.averageSalary.toLocaleString()}</h3>
              <p>Average Salary</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.pendingSalaries}</h3>
              <p>Pending Salaries</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hr-dashboard">
      <h1>HR Manager Dashboard</h1>
      
      <div className="nav-buttons">
        <button 
          className={`nav-btn ${activeForm === "create" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "create" ? "" : "create")}
        >
          Create Salary Structure
        </button>
        <button 
          className={`nav-btn ${activeForm === "update" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "update" ? "" : "update")}
        >
          Update Salary Structure
        </button>
        <button 
          className={`nav-btn ${activeForm === "view" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "view" ? "" : "view")}
        >
          View Salary Structures
        </button>
        <button 
          className={`nav-btn ${activeForm === "deduction" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "deduction" ? "" : "deduction")}
        >
          Manage Deduction Rules
        </button>
      </div>

      <div className="form-container">
        {activeForm ? renderForm() : renderStats()}
      </div>
    </div>
  );
}