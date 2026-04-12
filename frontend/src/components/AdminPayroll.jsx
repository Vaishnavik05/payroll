import { useState, useEffect } from "react";
import { getAllPayrolls, getUsers, getSalaryBreakupByEmployeePayroll } from "../services/api";
import "./AdminPayroll.css";

export default function AdminPayroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("payslips"); // payslips, summary
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [salaryBreakups, setSalaryBreakups] = useState({});

  const handleBack = () => {
    window.location.href = '/admin';
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all payroll records directly
      const payrollResponse = await getAllPayrolls();
      const allPayrolls = payrollResponse.data || [];
      setPayrolls(allPayrolls);
      
      // Also fetch users for additional information
      const usersResponse = await getUsers();
      setUsers(usersResponse.data || []);
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      setError("Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchPayrollSummary = async () => {
    setLoading(true);
    setError("");
    try {
      // Generate summary from existing payroll data
      if (payrolls.length === 0) {
        await fetchPayrolls();
      }
      
      const totalEmployees = users.length;
      const totalGrossSalary = payrolls.reduce((sum, payroll) => sum + (payroll.gross || 0), 0);
      const totalNetSalary = payrolls.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0);
      const totalDeductions = payrolls.reduce((sum, payroll) => sum + (payroll.totalDeductions || 0), 0);
      
      // Group by department
      const departmentBreakdown = users.reduce((acc, user) => {
        const department = user.department || 'Unassigned';
        const userPayrolls = payrolls.filter(p => p.employeeCode === user.employeeCode);
        const totalGross = userPayrolls.reduce((sum, p) => sum + (p.gross || 0), 0);
        const totalNet = userPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
        const avgSalary = userPayrolls.length > 0 ? totalGross / userPayrolls.length : 0;
        
        if (!acc[department]) {
          acc[department] = {
            department,
            employeeCount: 0,
            totalGross: 0,
            totalNet: 0,
            averageSalary: 0
          };
        }
        
        acc[department].employeeCount += 1;
        acc[department].totalGross += totalGross;
        acc[department].totalNet += totalNet;
        acc[department].averageSalary = acc[department].totalGross / acc[department].employeeCount;
        
        return acc;
      }, {});
      
      setSummaryData({
        totalEmployees,
        totalGrossSalary,
        totalNetSalary,
        totalDeductions,
        departmentBreakdown: Object.values(departmentBreakdown)
      });
    } catch (err) {
      console.error("Error generating payroll summary:", err);
      setError("Failed to generate payroll summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryBreakups = async (employeePayrollId) => {
    try {
      const response = await getSalaryBreakupByEmployeePayroll(employeePayrollId);
      return response.data || [];
    } catch (err) {
      console.error("Error fetching salary breakups:", err);
      return [];
    }
  };

  const handleViewPayslip = async (payroll) => {
    setSelectedPayslip(payroll);
    setShowDetails(true);
    
    // Fetch salary breakups for this payroll
    const breakups = await fetchSalaryBreakups(payroll.id);
    setSalaryBreakups(prev => ({
      ...prev,
      [payroll.id]: breakups
    }));
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPayslip(null);
  };

  const handleGenerateSummary = () => {
    setViewMode("summary");
    fetchPayrollSummary();
  };

  const handleViewPayslips = () => {
    setViewMode("payslips");
  };

  const getFilteredPayrolls = () => {
    let filtered = payrolls;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payroll => 
        payroll.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply month filter
    if (filterMonth) {
      filtered = filtered.filter(payroll => 
        payroll.paidAt && (new Date(payroll.paidAt).getMonth() + 1).toString() === filterMonth
      );
    }

    // Apply year filter
    if (filterYear) {
      filtered = filtered.filter(payroll => 
        payroll.paidAt && new Date(payroll.paidAt).getFullYear().toString() === filterYear
      );
    }

    return filtered;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPayslipsView = () => {
    const filteredPayrolls = getFilteredPayrolls();

    return (
      <div className="payslips-view">
        <div className="view-controls">
          <button className="control-btn summary-btn" onClick={handleGenerateSummary}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11H3v10h6V11zm8-8H11v18h6V3zm8 12h-6v6h6v-6z"/>
            </svg>
            Generate Payroll Summary
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by name, email, or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="filter-select"
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="filter-select"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading payroll data...</div>
        ) : (
          <div className="payslips-table">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Pay Period</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => {
                  const user = users.find(u => u.employeeCode === payroll.employeeCode);
                  return (
                    <tr key={payroll.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-name">{payroll.employeeName || 'N/A'}</div>
                          <div className="employee-email">{user?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td>{payroll.employeeCode || 'N/A'}</td>
                      <td>
                        {payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td>{formatCurrency(payroll.gross)}</td>
                      <td>{formatCurrency(payroll.netSalary)}</td>
                      <td>
                        <span className={`status-badge ${payroll.status?.toLowerCase() || 'draft'}`}>
                          {payroll.status || 'DRAFT'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => handleViewPayslip(payroll)}
                        >
                          View Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredPayrolls.length === 0 && (
              <div className="no-data">
                <p>No payroll records found matching the criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSummaryView = () => {
    return (
      <div className="summary-view">
        <div className="view-controls">
          <button className="control-btn payslips-btn" onClick={handleViewPayslips}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            View Payslips
          </button>
        </div>

        {loading ? (
          <div className="loading">Generating payroll summary...</div>
        ) : summaryData ? (
          <div className="summary-content">
            <div className="summary-header">
              <h3>Payroll Summary Report</h3>
              <p>Generated on {formatDate(new Date())}</p>
            </div>

            <div className="summary-stats">
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
                  <h4>{summaryData.totalEmployees || 0}</h4>
                  <p>Total Employees</p>
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
                  <h4>{formatCurrency(summaryData.totalGrossSalary)}</h4>
                  <p>Total Gross Salary</p>
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
                  <h4>{formatCurrency(summaryData.totalNetSalary)}</h4>
                  <p>Total Net Salary</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18 17V9"/>
                    <path d="M13 17V5"/>
                    <path d="M8 17v-3"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>{formatCurrency(summaryData.totalDeductions)}</h4>
                  <p>Total Deductions</p>
                </div>
              </div>
            </div>

            <div className="summary-details">
              <h4>Department-wise Breakdown</h4>
              {summaryData.departmentBreakdown && (
                <div className="department-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Employees</th>
                        <th>Total Gross</th>
                        <th>Total Net</th>
                        <th>Avg Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.departmentBreakdown.map((dept, index) => (
                        <tr key={index}>
                          <td>{dept.department || 'N/A'}</td>
                          <td>{dept.employeeCount || 0}</td>
                          <td>{formatCurrency(dept.totalGross)}</td>
                          <td>{formatCurrency(dept.totalNet)}</td>
                          <td>{formatCurrency(dept.averageSalary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>No summary data available.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-payroll-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h3>Payroll Management</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      {viewMode === "payslips" ? renderPayslipsView() : renderSummaryView()}

      {showDetails && selectedPayslip && (
        <div className="payslip-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Payslip Details</h4>
              <button className="close-btn" onClick={handleCloseDetails}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="payslip-content">
              <div className="employee-section">
                <h5>Employee Information</h5>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedPayslip.employeeName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Employee Code:</span>
                    <span className="value">{selectedPayslip.employeeCode || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{users.find(u => u.employeeCode === selectedPayslip.employeeCode)?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Department:</span>
                    <span className="value">{users.find(u => u.employeeCode === selectedPayslip.employeeCode)?.department || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="payroll-section">
                <h5>Payroll Information</h5>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Pay Period:</span>
                    <span className="value">{selectedPayslip.paidAt ? new Date(selectedPayslip.paidAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Gross Salary:</span>
                    <span className="value amount">{formatCurrency(selectedPayslip.gross)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Net Salary:</span>
                    <span className="value amount">{formatCurrency(selectedPayslip.netSalary)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Deductions:</span>
                    <span className="value deduction">{formatCurrency(selectedPayslip.totalDeductions || (selectedPayslip.gross - selectedPayslip.netSalary))}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className="value">{selectedPayslip.status || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Bank Reference:</span>
                    <span className="value">{selectedPayslip.bankReference || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="breakup-section">
                <h5>Salary Breakup</h5>
                {salaryBreakups[selectedPayslip.id] && salaryBreakups[selectedPayslip.id].length > 0 ? (
                  <div className="breakup-list">
                    {salaryBreakups[selectedPayslip.id].map((breakup, index) => (
                      <div key={index} className={`breakup-item ${breakup.componentType?.toLowerCase()}`}>
                        <span className="component-name">{breakup.componentName}</span>
                        <span className={`component-amount ${breakup.componentType?.toLowerCase()}`}>
                          {breakup.componentType === 'EARNING' ? '+' : '-'} {formatCurrency(breakup.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No salary breakup details available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
