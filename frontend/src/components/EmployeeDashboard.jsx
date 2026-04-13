import { useState, useEffect } from "react";
import ViewPayroll from "./ViewPayroll";
import ViewTaxComputation from "./ViewTaxComputation";
import { getEmployeePayroll, getUserByEmployeeCode, getTaxComputationsByEmployee } from "../services/api";
import "./EmployeeDashboard.css";

export default function EmployeeDashboard() {
  const [activeView, setActiveView] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [payrollData, setPayrollData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [employeeNotFound, setEmployeeNotFound] = useState(false);
  const [employeeStats, setEmployeeStats] = useState({
    totalPayrolls: 0,
    totalEarnings: 0,
    totalTaxDeducted: 0,
    currentMonthSalary: 0,
    currentMonthTax: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmployeeCodeSubmit = async (e) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      setError("Please enter an employee code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Fetching employee ID for code:", employeeCode);
      const response = await getUserByEmployeeCode(employeeCode.trim());
      
      if (response.data && response.data.id) {
        setEmployeeId(response.data.id.toString());
        // Store in localStorage for persistence
        localStorage.setItem('employeeCode', employeeCode.trim());
        console.log("Employee ID found:", response.data.id);
        
        // Fetch stats after getting employee ID
        await fetchEmployeeStats();
      } else {
        setEmployeeNotFound(true);
        setError("Employee not found with code: " + employeeCode);
        setEmployeeId("");
        // Reset stats to show overview
        setEmployeeStats({
          totalPayrolls: 0,
          totalEarnings: 0,
          totalTaxDeducted: 0,
          currentMonthSalary: 0,
          currentMonthTax: 0
        });
      }
    } catch (err) {
      console.error("Error fetching employee:", err);
      setEmployeeNotFound(true);
      setError("Employee not found. Please try a different employee code.");
      setEmployeeId("");
      // Reset stats to show overview
      setEmployeeStats({
        totalPayrolls: 0,
        totalEarnings: 0,
        totalTaxDeducted: 0,
        currentMonthSalary: 0,
        currentMonthTax: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeCodeChange = (e) => {
    const newCode = e.target.value.toUpperCase();
    setEmployeeCode(newCode);
    setEmployeeNotFound(false);
    if (!newCode.trim()) {
      setEmployeeId("");
      setEmployeeStats({
        totalPayrolls: 0,
        totalEarnings: 0,
        totalTaxDeducted: 0,
        currentMonthSalary: 0,
        currentMonthTax: 0
      });
    }
  };

  const handleTryAgain = () => {
    setEmployeeCode("");
    setEmployeeId("");
    setEmployeeNotFound(false);
    setError("");
    setEmployeeStats({
      totalPayrolls: 0,
      totalEarnings: 0,
      totalTaxDeducted: 0,
      currentMonthSalary: 0,
      currentMonthTax: 0
    });
  };

  // Fetch payroll data when employeeId is set
  useEffect(() => {
    if (employeeId) {
      fetchEmployeePayroll();
      fetchEmployeeStats();
    }
  }, [employeeId]);

  const fetchEmployeeStats = async () => {
    try {
      console.log("Fetching employee stats for:", employeeCode, "ID:", employeeId);
      
      // Fetch payroll data
      const payrollResponse = await getEmployeePayroll(employeeId);
      const payrollList = payrollResponse.data || [];
      
      // Fetch tax data using employee ID
      const taxResponse = await getTaxComputationsByEmployee(employeeId);
      const taxList = taxResponse.data || [];
      
      console.log("Payroll data:", payrollList);
      console.log("Tax data:", taxList);
      
      // Calculate statistics
      const totalPayrolls = payrollList.length;
      const totalEarnings = payrollList.reduce((sum, payroll) => sum + (payroll.netSalary || payroll.gross || 0), 0);
      const totalTaxDeducted = taxList.reduce((sum, tax) => sum + (tax.totalTax || tax.taxDeducted || 0), 0);
      
      // Get current month data (latest payroll and tax)
      const latestPayroll = payrollList.length > 0 ? payrollList[0] : null;
      const latestTax = taxList.length > 0 ? taxList[0] : null;
      
      const stats = {
        totalPayrolls,
        totalEarnings,
        totalTaxDeducted,
        currentMonthSalary: latestPayroll ? (latestPayroll.netSalary || latestPayroll.gross || 0) : 0,
        currentMonthTax: latestTax ? (latestTax.totalTax || latestTax.taxDeducted || 0) : 0
      };
      
      setEmployeeStats(stats);
      console.log("Employee stats calculated:", stats);
      
    } catch (err) {
      console.error("Error fetching employee stats:", err);
      // Set default stats on error
      setEmployeeStats({
        totalPayrolls: 0,
        totalEarnings: 0,
        totalTaxDeducted: 0,
        currentMonthSalary: 0,
        currentMonthTax: 0
      });
    }
  };

  const fetchEmployeePayroll = async () => {
    if (!employeeId) {
      setError("Employee ID not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Fetching payroll for employee ID:", employeeId);
      const response = await getEmployeePayroll(employeeId);
      console.log("Payroll response:", response.data);
      setPayrollData(response.data);
    } catch (err) {
      console.error("Error fetching payroll:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch payroll data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch(activeView) {
      case "payroll":
        return (
          <div className="payroll-view">
            <div className="view-header">
              <h2>My Payroll Details</h2>
              <p>View and download your payroll payslips</p>
            </div>
            {employeeCode ? (
              <ViewPayroll employeeCode={employeeCode} />
            ) : (
              <div className="no-data-message">
                <div className="no-data-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h3>No Employee Data</h3>
                <p>Please enter a valid employee code to view payroll details.</p>
                <button onClick={() => setActiveView("")} className="back-to-overview-btn">
                  Back to Overview
                </button>
              </div>
            )}
          </div>
        );
      case "tax-computation":
        return (
          <div className="tax-view">
            <div className="view-header">
              <h2>Tax Computation Details</h2>
              <p>View your tax calculations and deductions</p>
            </div>
            {employeeId ? (
              <ViewTaxComputation employeeCode={employeeCode} />
            ) : (
              <div className="no-data-message">
                <div className="no-data-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <h3>No Employee Data</h3>
                <p>Please enter a valid employee code to view tax computation details.</p>
                <button onClick={() => setActiveView("")} className="back-to-overview-btn">
                  Back to Overview
                </button>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="dashboard-overview">
            <div className="overview-header">
              <h2>Employee Portal</h2>
              <p>Enter your employee code to access your payroll and tax information</p>
            </div>
            
            {/* Employee Code Input Form */}
            <div className="employee-code-form">
              <form onSubmit={handleEmployeeCodeSubmit}>
                <div className="input-group">
                  <label htmlFor="employeeCode">Employee Code</label>
                  <input
                    type="text"
                    id="employeeCode"
                    value={employeeCode}
                    onChange={handleEmployeeCodeChange}
                    placeholder="Enter your employee code (e.g., EMP001)"
                    className="employee-code-input"
                    disabled={loading}
                  />
                  <button type="submit" className="submit-btn" disabled={loading || !employeeCode.trim()}>
                    {loading ? 'Loading...' : 'View My Data'}
                  </button>
                </div>
              </form>
            </div>

            {/* Show not found message with try again option */}
            {employeeNotFound && (
              <div className="not-found-message">
                <div className="not-found-content">
                  <div className="not-found-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <h3>Employee Not Found</h3>
                  <p>The employee code "{employeeCode}" was not found in our system.</p>
                  <p>Please check the code and try again, or contact HR if you believe this is an error.</p>
                  <div className="not-found-actions">
                    <button onClick={handleTryAgain} className="try-again-btn">
                      Try Different Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show other error messages */}
            {error && !employeeNotFound && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* Show stats and actions only when employee is found */}
            {employeeId && !loading && !error && !employeeNotFound && (
              <>
                <div className="employee-welcome">
                  <h3>Welcome, {employeeCode}</h3>
                  <p>Your payroll and tax information is ready</p>
                </div>
                
                <div className="quick-stats">
                  <div className="stat-card payroll-stat">
                    <div className="stat-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h3>Current Salary</h3>
                      <p className="stat-value">Rs. {employeeStats.currentMonthSalary.toLocaleString()}</p>
                      <p className="stat-subtitle">This month</p>
                    </div>
                  </div>
                  
                  <div className="stat-card tax-stat">
                    <div className="stat-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 14l2 2 4-4"/>
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h3>Tax Deducted</h3>
                      <p className="stat-value">Rs. {employeeStats.currentMonthTax.toLocaleString()}</p>
                      <p className="stat-subtitle">This month</p>
                    </div>
                  </div>
                </div>

                <div className="summary-stats">
                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <h4>Total Payslips</h4>
                      <p className="summary-value">{employeeStats.totalPayrolls}</p>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <h4>Total Earnings</h4>
                      <p className="summary-value">Rs. {employeeStats.totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <h4>Total Tax Paid</h4>
                      <p className="summary-value">Rs. {employeeStats.totalTaxDeducted.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="action-cards">
                  <div className="action-card payroll-card" onClick={() => setActiveView("payroll")}>
                    <div className="card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="card-content">
                      <h3>View Payroll</h3>
                      <p>Access your monthly payslips and salary breakdown</p>
                      <button className="card-btn">View Details</button>
                    </div>
                  </div>

                  <div className="action-card tax-card" onClick={() => setActiveView("tax-computation")}>
                    <div className="card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </div>
                    <div className="card-content">
                      <h3>Tax Computation</h3>
                      <p>Review your tax calculations and annual statements</p>
                      <button className="card-btn">View Details</button>
                    </div>
                  </div>
                </div>
              </>
            )}
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
          <div className="loading">
            <div>Loading employee data...</div>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            {employeeNotFound && (
              <button onClick={handleTryAgain} className="retry-btn">
                Try Different Code
              </button>
            )}
          </div>
        ) : (
          renderView()
        )}
      </div>
    </div>
  );
}