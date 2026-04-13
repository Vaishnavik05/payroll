import { useState, useEffect } from "react";
import { getEmployeePayroll, getUsers, getUserByEmployeeCode, getSalaryBreakupByEmployeePayroll, downloadPayslipPdf } from "../services/api";

export default function ViewPayroll({ employeeCode: propEmployeeCode = '', employeeId: propEmployeeId = '' }) {
  const [id, setId] = useState(propEmployeeCode);
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [salaryBreakups, setSalaryBreakups] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    window.location.href = '/employee';
  };

  const handleDownloadPdf = async (payrollId, employeeCode, month, year) => {
    try {
      const response = await downloadPayslipPdf(payrollId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payslip_${employeeCode}_${month}_${year}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download payslip PDF');
    }
  };

  // Fetch all employees to map employee codes to IDs
  const fetchEmployees = async () => {
    try {
      const response = await getUsers();
      setEmployees(response.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  // Find employee by code and get their ID
  const findEmployeeIdByCode = (employeeCode) => {
    const employee = employees.find(emp => emp.employeeCode === employeeCode);
    return employee ? employee.id : null;
  };

  // Fetch salary breakups for a specific payroll record
  const fetchSalaryBreakups = async (employeePayrollId) => {
    try {
      const response = await getSalaryBreakupByEmployeePayroll(employeePayrollId);
      return response.data || [];
    } catch (err) {
      console.error("Error fetching salary breakups:", err);
      return [];
    }
  };

  const fetchData = async () => {
    if (!id.trim()) {
      setError("Please enter an employee code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const empCode = id.trim().toUpperCase();
      const response = await getEmployeePayroll(empCode);
      const payrollData = response.data || [];
      setData(payrollData);
      
      // Fetch salary breakups for each payroll record
      const breakupsPromises = payrollData.map(async (payroll) => {
        const breakups = await fetchSalaryBreakups(payroll.id);
        return { payrollId: payroll.id, breakups };
      });
      
      const breakupsResults = await Promise.all(breakupsPromises);
      const breakupsMap = breakupsResults.reduce((acc, result) => {
        acc[result.payrollId] = result.breakups;
        return acc;
      }, {});
      
      setSalaryBreakups(breakupsMap);
    } catch (err) {
      console.error("Error fetching payroll data:", err);
      setError(err.response?.data?.message || "Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (propEmployeeCode || propEmployeeId) {
      const autoLoadPayrollData = async () => {
        setLoading(true);
        setError("");
        
        try {
          const empCode = propEmployeeCode.trim().toUpperCase();
          const response = await getEmployeePayroll(empCode);
          
          const payrollData = response.data || [];
          setData(payrollData);
          
          // Fetch salary breakups for each payroll record
          const breakupsPromises = payrollData.map(async (payroll) => {
            const breakups = await fetchSalaryBreakups(payroll.id);
            return { payrollId: payroll.id, breakups };
          });
          
          const breakupsResults = await Promise.all(breakupsPromises);
          const breakupsMap = breakupsResults.reduce((acc, result) => {
            acc[result.payrollId] = result.breakups;
            return acc;
          }, {});
          
          setSalaryBreakups(breakupsMap);
        } catch (err) {
          console.error('Auto-load Payroll API Error:', err);
          setData(null);
          setSalaryBreakups({});
        } finally {
          setLoading(false);
        }
      };
      
      autoLoadPayrollData();
    }
  }, [propEmployeeCode, propEmployeeId]);

  return (
    <div className="view-payroll-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h3>View Payroll</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <input 
          placeholder="Employee Code (e.g., EMP001)" 
          value={id}
          onChange={(e)=>setId(e.target.value)}
          className="form-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              fetchData();
            }
          }}
        />
        <button 
          onClick={fetchData} 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {data && data.length > 0 && (
        <div className="payroll-display">
          {data.map((payroll) => (
            <div key={payroll.id} className="payslip-card">
              <div className="payslip-header">
                <h5>Payslip #{payroll.id}</h5>
                <div className="header-actions">
                  <span className={`status-badge ${payroll.status?.toLowerCase() || 'processed'}`}>
                    {payroll.status || 'PROCESSED'}
                  </span>
                  <button 
                    className="download-pdf-btn"
                    onClick={() => handleDownloadPdf(
                      payroll.id, 
                      payroll.employee?.employeeCode || 'EMP', 
                      payroll.payrollCycle?.month || 1, 
                      payroll.payrollCycle?.year || 2024
                    )}
                    title="Download Payslip PDF"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    PDF
                  </button>
                </div>
              </div>
              
              <div className="payroll-details">
                <div className="detail-section">
                  <h6>Employee Information</h6>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Name:</span>
                      <span className="value">{payroll.employee?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Employee Code:</span>
                      <span className="value">{payroll.employee?.employeeCode || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{payroll.employee?.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Department:</span>
                      <span className="value">{payroll.employee?.department || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Role:</span>
                      <span className="value">{payroll.employee?.role?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Joining Date:</span>
                      <span className="value">{payroll.employee?.joiningDate ? new Date(payroll.employee.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className={`status-badge ${payroll.employee?.isActive ? 'active' : 'inactive'}`}>
                        {payroll.employee?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h6>Payroll Cycle Details</h6>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Period:</span>
                      <span className="value">{payroll.payrollCycle?.startDate || "N/A"} to {payroll.payrollCycle?.endDate || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Payment Date:</span>
                      <span className="value">{payroll.payrollCycle?.paymentDate ? new Date(payroll.payrollCycle.paymentDate).toLocaleDateString() : "Not Paid"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h6>Financial Details</h6>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Gross Salary:</span>
                      <span className="value amount">Rs. {payroll.gross?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Net Salary:</span>
                      <span className="value amount">Rs. {payroll.netSalary?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Deductions:</span>
                      <span className="value deduction">Rs. {(payroll.gross - payroll.netSalary)?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h6>Salary Breakup</h6>
                  {salaryBreakups[payroll.id] && salaryBreakups[payroll.id].length > 0 ? (
                    <div className="salary-breakup-grid">
                      {salaryBreakups[payroll.id].map((breakup, idx) => (
                        <div key={idx} className={`breakup-item ${breakup.componentType?.toLowerCase()}`}>
                          <span className="component-name">{breakup.componentName}</span>
                          <span className={`component-amount ${breakup.componentType?.toLowerCase()}`}>
                            {breakup.componentType === 'EARNING' ? '+' : '-'} Rs. {breakup.amount?.toLocaleString() || '0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-breakup-data">
                      <p>No salary breakup details available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {data && data.length === 0 && (
        <div className="no-data">
          <h4>No Payroll Data Found</h4>
          <p>No payroll records found for this employee.</p>
        </div>
      )}
    </div>
  );
}
