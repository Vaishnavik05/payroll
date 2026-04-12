import { useState, useEffect } from "react";
import { getEmployeePayroll, getUsers, getUserByEmployeeCode } from "../services/api";

export default function ViewPayroll() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    window.location.href = '/employee';
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

  const fetchData = async () => {
    if (!id.trim()) {
      setError("Please enter an employee code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Direct API call to find employee by code
      const employeeRes = await getUserByEmployeeCode(id.trim());
      const employeeId = employeeRes.data.id;
      
      // Use employee ID for payroll API call
      const res = await getEmployeePayroll(employeeId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || `Employee with code "${id}" not found`);
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

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
          <h4>Payroll Information</h4>
          
          {data.map((payroll, index) => (
            <div key={index} className="payroll-card">
              <div className="payroll-header">
                <h5>Payroll Cycle - {payroll.payrollCycle?.month || 'N/A'}/{payroll.payrollCycle?.year || 'N/A'}</h5>
                <span className={`status-badge ${payroll.payrollCycle?.status?.toLowerCase() || 'draft'}`}>
                  {payroll.payrollCycle?.status || 'DRAFT'}
                </span>
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
                    <div className="detail-item">
                      <span className="label">Created:</span>
                      <span className="value">{payroll.payrollCycle?.createdAt ? new Date(payroll.payrollCycle.createdAt).toLocaleDateString() : "N/A"}</span>
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