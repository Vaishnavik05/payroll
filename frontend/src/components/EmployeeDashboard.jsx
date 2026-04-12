import { useState, useEffect } from "react";
import ViewPayroll from "./ViewPayroll";
import ViewTaxComputation from "./ViewTaxComputation";
import { getEmployeePayroll, getUserByEmployeeCode } from "../services/api";
import "./EmployeeDashboard.css";

export default function EmployeeDashboard() {
  const [activeView, setActiveView] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get employee code from localStorage or session
    const storedEmployeeCode = localStorage.getItem('employeeCode') || "EMP001"; // Default to EMP001 for demo
    setEmployeeCode(storedEmployeeCode);
    
    // Get employee ID from employee code
    const fetchEmployeeId = async () => {
      try {
        const response = await getUserByEmployeeCode(storedEmployeeCode);
        setEmployeeId(response.data.id);
      } catch (err) {
        console.error("Error fetching employee:", err);
        // Fallback to default ID
        setEmployeeId("1");
      }
    };
    
    fetchEmployeeId();
  }, []);

  const fetchEmployeePayroll = async () => {
    if (!employeeId) {
      setError("Employee ID not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getEmployeePayroll(employeeId);
      setPayrollData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch(activeView) {
      case "payroll":
        return <ViewPayroll employeeCode={employeeCode} employeeId={employeeId} />;
      case "tax-computation":
        return <ViewTaxComputation employeeCode={employeeCode} />;
      default:
        return (
          <div className="dashboard-overview">
            <h2>My Payroll Overview</h2>
            <div className="quick-actions">
              <button 
                className="action-btn payroll-btn"
                onClick={() => setActiveView("payroll")}
              >
                View Payroll Details
              </button>
              <button 
                className="action-btn tax-btn"
                onClick={() => setActiveView("tax")}
              >
                View Tax Information
              </button>
            </div>
            
            <div className="info-cards">
              <div className="info-card">
                <h3>Current Payroll</h3>
                <p>View your current month's payroll details</p>
              </div>
              <div className="info-card">
                <h3>Tax Information</h3>
                <p>Check your tax deductions and filings</p>
              </div>
              <div className="info-card">
                <h3>Payment History</h3>
                <p>Review your past payment records</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="employee-dashboard">
      <h1>Employee Dashboard</h1>
      
      <div className="nav-tabs">
        <button 
          className={`tab-btn ${activeView === "" ? "active" : ""}`}
          onClick={() => setActiveView("")}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeView === "payroll" ? "active" : ""}`}
          onClick={() => setActiveView("payroll")}
        >
          Payroll
        </button>
                <button 
          className={`tab-btn ${activeView === "tax-computation" ? "active" : ""}`}
          onClick={() => setActiveView("tax-computation")}
        >
          Tax Details & Computation
        </button>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          renderView()
        )}
      </div>
    </div>
  );
}