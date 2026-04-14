import { useState, useEffect } from "react";
import CreatePayroll from "./CreatePayroll";
import ProcessPayroll from "./ProcessPayroll";
import PayrollWorkflow from "./PayrollWorkflow";
import { getPayrolls, getDashboardStats, updatePayrollTotals, getEmployeePayrollsByPayrollCycle, processCurrentYearTaxComputations, getCurrentYearTaxSummary, cleanupDuplicatePayslips, testTaxService } from "../services/api";
import "./FinanceDashboard.css";

export default function FinanceDashboard() {
  const [activeForm, setActiveForm] = useState("");
  const [stats, setStats] = useState({
    totalPayrolls: 0,
    processedPayrolls: 0,
    draftPayrolls: 0,
    processingPayrolls: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [showFilteredView, setShowFilteredView] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [selectedPayrollCycle, setSelectedPayrollCycle] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState([]);

  useEffect(() => {
    fetchFinanceStats();
  }, []);

  const fetchFinanceStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching finance stats...");
      
      // First try to get payroll cycles data
      const response = await getPayrolls();
      console.log("Payroll cycles API response:", response);
      const payrolls = response.data || [];
      
      // Fetch actual payroll amounts from database
      const payrollsWithAmounts = await fetchPayrollAmounts(payrolls);
      
      // Calculate statistics from payroll cycles
      const totalPayrolls = Math.round(payrollsWithAmounts.length || 0);
      const processedPayrolls = Math.round(payrollsWithAmounts.filter(p => p.status === 'COMPLETED').length || 0);
      const draftPayrolls = Math.round(payrollsWithAmounts.filter(p => p.status === 'DRAFT').length || 0);
      const processingPayrolls = Math.round(payrollsWithAmounts.filter(p => p.status === 'PROCESSING').length || 0);
      const cancelledPayrolls = Math.round(payrollsWithAmounts.filter(p => p.status === 'CANCELLED').length || 0);
      
      // Calculate total amount from payroll cycles with actual amounts
      const totalAmount = payrollsWithAmounts.reduce((sum, p) => {
        const amount = p.totalAmount || 0;
        const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return sum + Math.round(parsedAmount * 100) / 100; // Round to 2 decimal places
      }, 0);
      
      const newStats = {
        totalPayrolls: totalPayrolls,
        processedPayrolls: processedPayrolls,
        draftPayrolls: draftPayrolls,
        processingPayrolls: processingPayrolls,
        cancelledPayrolls: cancelledPayrolls,
        totalAmount: Math.round(totalAmount)
      };
      
      setStats(newStats);
      console.log("Finance stats updated:", newStats);
      
      // Update filtered payrolls with amounts if they exist
      if (filteredPayrolls.length > 0) {
        const updatedFilteredPayrolls = await fetchPayrollAmounts(filteredPayrolls);
        setFilteredPayrolls(updatedFilteredPayrolls);
      }
      
      // If no payroll cycles data, try dashboard API as fallback
      if (totalPayrolls === 0) {
        console.log("No payroll cycles found, trying dashboard API...");
        try {
          const dashboardResponse = await getDashboardStats();
          const dashboardData = dashboardResponse.data;
          
          setStats({
            totalPayrolls: Math.round(dashboardData.totalPayrollCycles || dashboardData.totalPayrollsProcessed || 0),
            processedPayrolls: Math.round(dashboardData.completedPayrollCycles || 0),
            draftPayrolls: Math.round((dashboardData.totalPayrollCycles || 0) - (dashboardData.completedPayrollCycles || 0)),
            processingPayrolls: Math.round(dashboardData.currentMonthPayrolls || 0),
            totalAmount: Math.round(dashboardData.totalGrossSalary || dashboardData.totalNetSalary || 0)
          });
          console.log("Dashboard stats used as fallback:", dashboardData);
        } catch (dashboardErr) {
          console.log("Dashboard API also failed, using default values");
        }
      }
      
    } catch (err) {
      console.error("Error fetching finance stats:", err);
      setError(err.message || "Failed to fetch finance data");
      setStats({
        totalPayrolls: 0,
        processedPayrolls: 0,
        draftPayrolls: 0,
        processingPayrolls: 0,
        totalAmount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatCardClick = async (type) => {
    setLoading(true);
    try {
      const response = await getPayrolls();
      const allPayrolls = response.data || [];
      let filtered = [];
      
      switch(type) {
        case 'total':
          filtered = allPayrolls;
          break;
        case 'completed':
          filtered = allPayrolls.filter(p => p.status === 'COMPLETED');
          break;
        case 'draft':
          filtered = allPayrolls.filter(p => p.status === 'DRAFT');
          break;
        case 'processing':
          filtered = allPayrolls.filter(p => p.status === 'PROCESSING');
          break;
        case 'cancelled':
          filtered = allPayrolls.filter(p => p.status === 'CANCELLED');
          break;
        default:
          filtered = allPayrolls;
      }
      
      // Fetch actual payroll amounts for filtered payrolls
      const filteredWithAmounts = await fetchPayrollAmounts(filtered);
      
      setFilteredPayrolls(filteredWithAmounts);
      setFilterType(type);
      setShowFilteredView(true);
      setActiveForm("");
    } catch (err) {
      setError("Failed to fetch payroll cycles: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowFilteredView(false);
    setFilteredPayrolls([]);
    setFilterType("");
  };

  const fetchPayrollAmounts = async (payrollCycles) => {
    try {
      const payrollCyclesWithAmounts = await Promise.all(
        payrollCycles.map(async (cycle) => {
          try {
            // Fetch employee payrolls for this cycle
            const response = await getEmployeePayrollsByPayrollCycle(cycle.id);
            const employeePayrolls = response.data || [];
            
            // Calculate total amount from employee payrolls
            const totalAmount = employeePayrolls.reduce((sum, emp) => {
              return sum + (emp.netSalary || emp.gross || 0);
            }, 0);
            
            // Update the cycle with actual amounts
            return {
              ...cycle,
              totalAmount: totalAmount,
              totalEmployees: employeePayrolls.length
            };
          } catch (err) {
            console.error(`Error fetching amounts for cycle ${cycle.id}:`, err);
            return {
              ...cycle,
              totalAmount: cycle.totalAmount || 0,
              totalEmployees: cycle.totalEmployees || 0
            };
          }
        })
      );
      
      return payrollCyclesWithAmounts;
    } catch (err) {
      console.error("Error fetching payroll amounts:", err);
      return payrollCycles;
    }
  };

  const handleProcessTaxComputations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting tax computation processing...");
      
      // Test tax service first
      console.log("Testing tax service...");
      const testResponse = await testTaxService();
      console.log("Tax service test response:", testResponse);
      
      if (!testResponse.data.success) {
        throw new Error("Tax service test failed: " + testResponse.data.message);
      }
      
      console.log("Tax service is working, proceeding with tax computation...");
      
      // Process tax computations for current financial year
      const processResponse = await processCurrentYearTaxComputations();
      console.log("Tax processing response:", processResponse);
      
      if (!processResponse || !processResponse.data) {
        throw new Error("No response from tax processing API");
      }
      
      if (processResponse.data.success) {
        // Get updated tax summary
        const summaryResponse = await getCurrentYearTaxSummary();
        console.log("Tax summary response:", summaryResponse);
        
        // Show success message
        const totalTax = summaryResponse.data?.totalTaxCollected || 0;
        const totalEmployees = summaryResponse.data?.totalEmployees || 0;
        
        alert(`Tax computations processed successfully!\nTotal Tax Collected: Rs. ${totalTax.toLocaleString()}\nTotal Employees: ${totalEmployees}`);
        
        // Refresh stats to update dashboard
        await fetchFinanceStats();
      } else {
        const errorMsg = processResponse.data.message || "Tax processing failed";
        setError("Tax processing failed: " + errorMsg);
        alert("Tax processing failed: " + errorMsg);
      }
    } catch (err) {
      console.error("Error processing tax computations:", err);
      let errorMessage = "Failed to process tax computations";
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        errorMessage = "Backend server not running. Please start the Spring Boot application on port 8080.";
      } else if (err.response) {
        errorMessage = "Server error: " + (err.response.data?.message || err.message);
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = "Error: " + err.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Starting cleanup of duplicate payslips...");
      
      const response = await cleanupDuplicatePayslips();
      console.log("Cleanup response:", response.data);
      
      alert("Duplicate payslips cleaned up successfully!");
      
      // Refresh stats to update dashboard
      fetchFinanceStats();
      
    } catch (err) {
      console.error("Error cleaning up duplicate payslips:", err);
      setError("Failed to cleanup duplicate payslips: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTotals = async () => {
    setLoading(true);
    try {
      const response = await updatePayrollTotals();
      console.log("Payroll totals updated:", response.data);
      
      // Refresh the data after updating totals
      if (showFilteredView) {
        await handleStatCardClick(filterType);
      } else {
        await fetchFinanceStats();
      }
      
      // Show success message
      alert("Payroll totals updated successfully! The amounts should now be visible.");
    } catch (err) {
      console.error("Error updating payroll totals:", err);
      alert("Failed to update payroll totals: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePayrollCycleClick = async (payrollCycle) => {
    setSelectedPayrollCycle(payrollCycle);
  };

  const handleClosePayrollDetails = () => {
    setSelectedPayrollCycle(null);
    setShowEmployeeDetails(false);
    setEmployeeDetails([]);
  };

  const handleCloseEmployeeDetails = () => {
    setShowEmployeeDetails(false);
    setEmployeeDetails([]);
  };

  const handleViewEmployeeDetails = async () => {
    if (!selectedPayrollCycle) return;
    
    try {
      const payrollCycleId = selectedPayrollCycle.id;
      console.log(`Fetching employee details for payroll cycle ${payrollCycleId}`);
      
      setLoading(true);
      
      // Fetch actual employee payroll data from database
      const response = await getEmployeePayrollsByPayrollCycle(payrollCycleId);
      const employees = response.data || [];
      
      console.log(`Found ${employees.length} employees for payroll cycle ${payrollCycleId}`);
      
      // Set the actual employee data from database
      setEmployeeDetails(employees);
      setShowEmployeeDetails(true);
      
    } catch (error) {
      console.error('Error fetching employee details:', error);
      alert('Failed to load employee details from database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedPayrollCycle) return;
    
    try {
      const payrollCycleId = selectedPayrollCycle.id;
      console.log(`Downloading report for payroll cycle ${payrollCycleId}`);
      
      // Show loading state
      setLoading(true);
      
      // Generate a simple report (in a real app, this would call an API endpoint)
      const reportData = {
        payrollCycleId: selectedPayrollCycle.id,
        period: `${selectedPayrollCycle.month}/${selectedPayrollCycle.year}`,
        status: selectedPayrollCycle.status,
        totalAmount: selectedPayrollCycle.totalAmount || 0,
        totalEmployees: selectedPayrollCycle.totalEmployees || 0,
        startDate: new Date(selectedPayrollCycle.startDate).toLocaleDateString(),
        endDate: new Date(selectedPayrollCycle.endDate).toLocaleDateString(),
        paymentDate: new Date(selectedPayrollCycle.paymentDate).toLocaleDateString(),
        generatedAt: new Date().toLocaleString()
      };
      
      // Create a simple text report
      const reportContent = `
PAYROLL CYCLE REPORT
=====================

Payroll Cycle ID: ${reportData.payrollCycleId}
Period: ${reportData.period}
Status: ${reportData.status}
Generated: ${reportData.generatedAt}

PERIOD INFORMATION
-----------------
Start Date: ${reportData.startDate}
End Date: ${reportData.endDate}
Payment Date: ${reportData.paymentDate}

FINANCIAL SUMMARY
-----------------
Total Amount: Rs. ${reportData.totalAmount.toLocaleString()}
Total Employees: ${reportData.totalEmployees}
Average per Employee: Rs. ${reportData.totalEmployees > 0 ? (reportData.totalAmount / reportData.totalEmployees).toLocaleString() : 0}

This is a sample report. In production, this would include detailed employee breakdowns,
tax calculations, deductions, and other payroll information.
      `.trim();
      
      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payroll_Cycle_${reportData.payrollCycleId}_Report_${reportData.period.replace('/', '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Payroll report downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!selectedPayrollCycle) return;
    
    try {
      const payrollCycleId = selectedPayrollCycle.id;
      console.log(`Exporting to Excel for payroll cycle ${payrollCycleId}`);
      
      // Show loading state
      setLoading(true);
      
      // Generate CSV data (simple Excel-compatible format)
      const csvData = [
        ['Payroll Cycle Report', ''],
        ['Cycle ID', payrollCycleId],
        ['Period', `${selectedPayrollCycle.month}/${selectedPayrollCycle.year}`],
        ['Status', selectedPayrollCycle.status],
        ['Start Date', new Date(selectedPayrollCycle.startDate).toLocaleDateString()],
        ['End Date', new Date(selectedPayrollCycle.endDate).toLocaleDateString()],
        ['Payment Date', new Date(selectedPayrollCycle.paymentDate).toLocaleDateString()],
        ['Total Amount', selectedPayrollCycle.totalAmount || 0],
        ['Total Employees', selectedPayrollCycle.totalEmployees || 0],
        ['Average per Employee', selectedPayrollCycle.totalEmployees > 0 ? (selectedPayrollCycle.totalAmount / selectedPayrollCycle.totalEmployees).toFixed(2) : 0],
        ['Generated On', new Date().toLocaleString()],
        ['', ''],
        ['Note', 'This is a sample export. Production version would include detailed employee data.']
      ];
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payroll_Cycle_${payrollCycleId}_Export_${selectedPayrollCycle.month}_${selectedPayrollCycle.year}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Payroll data exported to Excel successfully!');
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFilteredView = () => {
    const getFilterTitle = () => {
      switch(filterType) {
        case 'total':
          return 'All Payroll Cycles';
        case 'completed':
          return 'Completed Payroll Cycles';
        case 'draft':
          return 'Draft Payroll Cycles';
        case 'processing':
          return 'Processing Payroll Cycles';
        default:
          return 'Payroll Cycles';
      }
    };

    const getStatusColor = (status) => {
      switch(status) {
        case 'COMPLETED':
          return '#10b981';
        case 'DRAFT':
          return '#6b7280';
        case 'PROCESSING':
          return '#f59e0b';
        default:
          return '#6b7280';
      }
    };

    return (
      <div className="filtered-payroll-view">
        {selectedPayrollCycle ? (
          <div className="payroll-detail-view">
            <div className="detail-header">
              <button className="back-btn" onClick={handleClosePayrollDetails}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Payroll Cycles
              </button>
              <h2>Payroll Cycle #{selectedPayrollCycle.id} Details</h2>
              <div className={`status-badge ${selectedPayrollCycle.status.toLowerCase()}`}>
                {selectedPayrollCycle.status}
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-overview">
                <div className="overview-card">
                  <h3>Period Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Period:</label>
                      <span>{selectedPayrollCycle.month}/{selectedPayrollCycle.year}</span>
                    </div>
                    <div className="info-item">
                      <label>Start Date:</label>
                      <span>{new Date(selectedPayrollCycle.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <label>End Date:</label>
                      <span>{new Date(selectedPayrollCycle.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <label>Payment Date:</label>
                      <span>{new Date(selectedPayrollCycle.paymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card financial-summary">
                  <h3>Financial Summary</h3>
                  <div className="financial-stats">
                    <div className="financial-stat">
                      <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <div className="stat-content">
                        <h4>Rs. {(selectedPayrollCycle.totalAmount || 0).toLocaleString()}</h4>
                        <p>Total Amount</p>
                      </div>
                    </div>
                    <div className="financial-stat">
                      <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="stat-content">
                        <h4>{selectedPayrollCycle.totalEmployees || 0}</h4>
                        <p>Employees</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="action-btn primary" onClick={handleViewEmployeeDetails} disabled={loading}>
                  {loading ? 'Loading...' : 'View Employee Details'}
                </button>
                <button className="action-btn secondary" onClick={handleDownloadReport} disabled={loading}>
                  {loading ? 'Downloading...' : 'Download Report'}
                </button>
                <button className="action-btn tertiary" onClick={handleExportToExcel} disabled={loading}>
                  {loading ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>

              {showEmployeeDetails && (
                <div className="employee-details-section">
                  <div className="employee-details-header">
                    <h3>Employee Payroll Details</h3>
                    <button className="close-employee-details" onClick={handleCloseEmployeeDetails}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="employee-details-table">
                    <div className="table-header">
                      <div className="header-cell">Employee</div>
                      <div className="header-cell">Gross</div>
                      <div className="header-cell">Deductions</div>
                      <div className="header-cell">Net Salary</div>
                      <div className="header-cell">Status</div>
                    </div>
                    
                    {employeeDetails.map((emp) => (
                      <div key={emp.id} className="table-row">
                        <div className="table-cell employee-info">
                          <div className="employee-name">{emp.employeeName || 'Unknown'}</div>
                          <div className="employee-code">{emp.employeeCode || 'N/A'}</div>
                        </div>
                        <div className="table-cell amount">Rs. {(emp.gross || 0).toLocaleString()}</div>
                        <div className="table-cell deductions">Rs. {(emp.totalDeductions || 0).toLocaleString()}</div>
                        <div className="table-cell net-salary">Rs. {(emp.netSalary || 0).toLocaleString()}</div>
                        <div className="table-cell">
                          <span className={`status-badge ${(emp.status || 'PROCESSED').toLowerCase()}`}>
                            {emp.status || 'PROCESSED'}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {employeeDetails.length === 0 && (
                      <div className="no-employees">
                        <p>No employee data found for this payroll cycle.</p>
                      </div>
                    )}
                    
                    <div className="employee-summary">
                      <div className="summary-item">
                        <span className="label">Total Employees:</span>
                        <span className="value">{employeeDetails.length}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Total Gross:</span>
                        <span className="value">Rs. {employeeDetails.reduce((sum, emp) => sum + (emp.gross || 0), 0).toLocaleString()}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Total Net:</span>
                        <span className="value">Rs. {employeeDetails.reduce((sum, emp) => sum + (emp.netSalary || 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="filtered-header">
              <button className="back-btn" onClick={handleBackToDashboard}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Dashboard
              </button>
              <h2>{getFilterTitle()}</h2>
              <div className="header-actions">
                <button className="update-totals-btn" onClick={handleUpdateTotals} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Totals'}
                </button>
                <div className="result-count">{filteredPayrolls.length} result{filteredPayrolls.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
        
        {loading && (
          <div className="loading-message">Loading payroll cycles...</div>
        )}
        
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={() => handleStatCardClick(filterType)} className="retry-btn">Retry</button>
          </div>
        )}
        
        {!loading && !error && filteredPayrolls.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 9l-3-3"/>
                <path d="M21 12v-1a2 2 0 0 0-2-2h-3"/>
                <path d="M8 21H4"/>
              </svg>
            </div>
            <h3>No payroll cycles found</h3>
            <p>No payroll cycles match the selected filter.</p>
          </div>
        )}
        
        {!loading && !error && filteredPayrolls.length > 0 && (
          <div className="payroll-cycles-grid">
            {filteredPayrolls.map(payroll => (
              <div key={payroll.id} className="payroll-cycle-card clickable" onClick={() => handlePayrollCycleClick(payroll)}>
                <div className="card-header">
                  <div className="cycle-info">
                    <h3>Payroll Cycle #{payroll.id}</h3>
                    <span className="period">{payroll.month}/{payroll.year}</span>
                  </div>
                  <div className={`status-badge ${payroll.status.toLowerCase()}`}>
                    {payroll.status}
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="dates-section">
                    <div className="date-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>Start: {new Date(payroll.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="date-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>End: {new Date(payroll.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="date-item payment">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      <span>Payment: {new Date(payroll.paymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="stats-section">
                    <div className="stat-item amount">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <span>Rs. {(payroll.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="stat-item employees">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span>{payroll.totalEmployees || 0} Employees</span>
                    </div>
                  </div>
                  
                  {payroll.processedAt && (
                    <div className="processed-info">
                      <div className="processed-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Processed: {new Date(payroll.processedAt).toLocaleDateString()}</span>
                      </div>
                      {payroll.processedBy && (
                        <div className="processed-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span>By: {payroll.processedBy}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    );
  };

  const renderStats = () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);
    };

    const formatNumber = (num) => {
      return Math.round(num || 0).toString();
    };

    if (loading) {
      return (
        <>
          <h2>Finance Overview</h2>
          <div className="loading-message">Loading finance data...</div>
        </>
      );
    }

    if (error) {
      return (
        <>
          <h2>Finance Overview</h2>
          <div className="error-message">
            <p>Error: {error}</p>
            <button className="retry-btn" onClick={fetchFinanceStats}>
              Retry
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <h2>Finance Overview</h2>
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => handleStatCardClick('total')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatNumber(stats.totalPayrolls)}</h3>
              <p>Total Cycles</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('completed')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 9l-3-3"/>
                <path d="M21 12v-1a2 2 0 0 0-2-2h-3"/>
                <path d="M8 21H4"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatNumber(stats.processedPayrolls)}</h3>
              <p>Completed</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('draft')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatNumber(stats.draftPayrolls)}</h3>
              <p>Draft</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('processing')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatNumber(stats.processingPayrolls)}</h3>
              <p>Processing</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('cancelled')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatNumber(stats.cancelledPayrolls)}</h3>
              <p>Cancelled</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('total')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalAmount)}</h3>
              <p>Total Amount</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderForm = () => {
    switch(activeForm) {
      case "create":
        return <CreatePayroll />;
      case "process":
        return <ProcessPayroll />;
      case "workflow":
        return <PayrollWorkflow />;
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    if (showFilteredView) {
      return renderFilteredView();
    }
    
    if (activeForm) {
      return renderForm();
    }
    
    return renderStats();
  };

  return (
    <div className="finance-dashboard">
      <h1>Finance Dashboard</h1>
      
      <div className="nav-buttons">
        <button 
          className={`nav-btn ${activeForm === "create" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "create" ? "" : "create")}
        >
          Create Payroll
        </button>
        <button 
          className={`nav-btn ${activeForm === "process" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "process" ? "" : "process")}
        >
          Process Payroll
        </button>
        <button 
          className={`nav-btn ${activeForm === "workflow" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "workflow" ? "" : "workflow")}
        >
          Payroll Workflow
        </button>
        <button 
          className="nav-btn tax-btn"
          onClick={handleProcessTaxComputations}
          disabled={loading}
          title={loading ? "Processing tax computations..." : "Process tax computations for current financial year"}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              Processing Tax...
            </span>
          ) : 'Process Tax'}
        </button>
      </div>

      <div className="form-container">
        {renderMainContent()}
      </div>
    </div>
  );
}