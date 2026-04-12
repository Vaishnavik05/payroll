import { useState, useEffect } from 'react';
import { getPayrolls, getEmployees, createSalaryBreakups, processPayroll, completePayroll, getAllPayrolls } from '../services/api';
import './PayrollWorkflow.css';

export default function PayrollWorkflow() {
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [payrollData, setPayrollData] = useState([]);
  const [generatedEmployeePayrolls, setGeneratedEmployeePayrolls] = useState([]);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await getPayrolls();
      setPayrollData(response.data || []);
    } catch (err) {
      setError('Failed to fetch payrolls');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (payrollId) => {
    setLoading(true);
    try {
      const response = await getEmployees();
      setEmployees(response.data || []);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handlePayrollSelect = (payroll) => {
    setSelectedPayroll(payroll);
    setCurrentStep(2);
    fetchEmployees(payroll.id);
  };

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handleGenerateSalaryBreakup = async () => {
    if (selectedEmployees.length === 0) {
      setError('Please select at least one employee');
      return;
    }

    // Check payroll status before processing
    if (selectedPayroll.status === 'PROCESSING' || selectedPayroll.status === 'COMPLETED') {
      setError(`This payroll is already ${selectedPayroll.status.toLowerCase()}. Cannot process again.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Processing payroll cycle:', selectedPayroll);
      console.log('Current status:', selectedPayroll.status);
      console.log('This will create employee payroll records and salary breakups automatically');
      
      // Use the backend's processPayroll endpoint which handles everything
      const result = await processPayroll(selectedPayroll.id);
      console.log('Payroll processing result:', result);
      
      // Update the selected payroll status locally
      setSelectedPayroll(prev => ({ ...prev, status: 'PROCESSING' }));
      
      // Verify that employee payrolls were actually created
      setTimeout(async () => {
        try {
          const employeePayrollsResponse = await getAllPayrolls();
          const employeePayrolls = employeePayrollsResponse.data || [];
          console.log('Employee payrolls after processing:', employeePayrolls);
          
          // Filter employee payrolls for this payroll cycle
          const currentPayrollEmployeePayrolls = employeePayrolls.filter(
            ep => ep.payrollCycleId === selectedPayroll.id
          );
          
          setGeneratedEmployeePayrolls(currentPayrollEmployeePayrolls);
          console.log('Generated employee payrolls for current cycle:', currentPayrollEmployeePayrolls);
          
          if (currentPayrollEmployeePayrolls.length === 0) {
            setError('Payroll was processed but no employee records were created. Please check backend implementation.');
          } else {
            setSuccess(`Payroll processed successfully! Created ${currentPayrollEmployeePayrolls.length} employee payroll records with salary breakups.`);
          }
        } catch (verifyErr) {
          console.error('Error verifying employee payrolls:', verifyErr);
          setError('Payroll processing completed but could not verify employee records.');
        }
      }, 2000); // Wait 2 seconds for database to update
      
      setCurrentStep(3);
    } catch (err) {
      console.error('Error in payroll processing:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process payroll';
      
      // Enhanced error handling for different status codes
      if (err.response?.status === 409) {
        setError('This payroll is already being processed or has been processed. Please refresh the data and try again.');
        // Refresh payroll data to get current status
        fetchPayrolls();
      } else if (err.response?.status === 400) {
        setError('Invalid payroll data. Please check the payroll configuration and try again.');
      } else if (err.response?.status === 404) {
        setError('Payroll not found. Please select a valid payroll.');
      } else if (errorMessage.includes('already processed') || errorMessage.includes('already being processed')) {
        setError('This payroll is already processed or being processed. Please check the payroll status.');
        // Refresh payroll data to get current status
        fetchPayrolls();
      } else {
        setError(`Failed to process payroll: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the completePayroll endpoint to finalize the payroll
      const result = await completePayroll(selectedPayroll.id);
      console.log('Payroll completion result:', result);
      
      setSuccess('Payout processed successfully! Payroll has been completed.');
      setCurrentStep(4);
    } catch (err) {
      console.error('Error in payroll completion:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process payout';
      setError(`Failed to process payout: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetWorkflow = () => {
    setSelectedPayroll(null);
    setSelectedEmployees([]);
    setCurrentStep(1);
    setError('');
    setSuccess('');
  };

  const renderStep1 = () => (
    <div className="workflow-step">
      <h3>Step 1: Select Payroll to Process</h3>
      <div className="payroll-list">
        {payrollData.map(payroll => {
          const isDisabled = payroll.status === 'PROCESSING' || payroll.status === 'COMPLETED';
          const isSelected = selectedPayroll?.id === payroll.id;
          
          return (
            <div 
              key={payroll.id} 
              className={`payroll-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handlePayrollSelect(payroll)}
            >
              <div className="payroll-info">
                <h4>{payroll.month}/{payroll.year}</h4>
                <div className="payroll-status-row">
                  <span className={`status-badge ${payroll.status?.toLowerCase()}`}>
                    {payroll.status}
                  </span>
                  {isDisabled && (
                    <span className="disabled-text">Already processed</span>
                  )}
                </div>
                <p>Employees: {payroll.employeeCount || 0}</p>
              </div>
              <div className="payroll-amount">
                Rs. {payroll.totalAmount || 0}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedPayroll && (selectedPayroll.status === 'PROCESSING' || selectedPayroll.status === 'COMPLETED') && (
        <div className="warning-message">
          This payroll is already {selectedPayroll.status.toLowerCase()}. Please select a different payroll or create a new one.
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="workflow-step">
      <h3>Step 2: Select Employees</h3>
      <div className="employee-controls">
        <button onClick={handleSelectAll} className="select-all-btn">
          {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
        </button>
        <span className="selected-count">
          {selectedEmployees.length} of {employees.length} selected
        </span>
      </div>
      <div className="employee-list">
        {employees.map(employee => (
          <div 
            key={employee.id} 
            className={`employee-item ${selectedEmployees.includes(employee.id) ? 'selected' : ''}`}
            onClick={() => handleEmployeeToggle(employee.id)}
          >
            <input 
              type="checkbox" 
              checked={selectedEmployees.includes(employee.id)}
              onChange={() => handleEmployeeToggle(employee.id)}
            />
            <div className="employee-info">
              <h4>{employee.name}</h4>
              <p>{employee.employeeCode}</p>
              <p>{employee.department}</p>
            </div>
            <div className="employee-salary">
              Rs. {employee.salary || 0}
            </div>
          </div>
        ))}
      </div>
      <div className="step-actions">
        <button onClick={() => setCurrentStep(1)} className="back-btn">Back</button>
        <button 
          onClick={handleGenerateSalaryBreakup} 
          className="next-btn"
          disabled={selectedEmployees.length === 0 || loading}
        >
          {loading ? 'Generating...' : 'Generate Salary Breakup'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="workflow-step">
      <h3>Step 3: Salary Breakup Generated</h3>
      <div className="success-message">
        Salary breakup has been generated for {selectedEmployees.length} employees
      </div>
      
      {generatedEmployeePayrolls.length > 0 && (
        <div className="employee-payroll-summary">
          <h4>Generated Employee Payroll Records:</h4>
          <div className="employee-payroll-list">
            {generatedEmployeePayrolls.map(ep => (
              <div key={ep.id} className="employee-payroll-item">
                <span className="employee-name">{ep.employeeName}</span>
                <span className="employee-code">{ep.employeeCode}</span>
                <span className="gross-salary">Rs. {ep.gross}</span>
                <span className="net-salary">Rs. {ep.netSalary}</span>
                <span className={`status ${ep.status?.toLowerCase()}`}>{ep.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="breakup-summary">
        <h4>Generated Components:</h4>
        <ul>
          <li>Basic Salary</li>
          <li>HRA</li>
          <li>PF Deduction</li>
          <li>Professional Tax</li>
        </ul>
      </div>
      <div className="step-actions">
        <button onClick={() => setCurrentStep(2)} className="back-btn">Back</button>
        <button 
          onClick={handleProcessPayout} 
          className="process-btn"
          disabled={loading || generatedEmployeePayrolls.length === 0}
        >
          {loading ? 'Processing...' : 'Process Payout'}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="workflow-step">
      <h3>Step 4: Payout Processed Successfully</h3>
      <div className="success-message">
        <h4>Completed!</h4>
        <p>Payout has been processed for {selectedEmployees.length} employees</p>
        <p>Payroll ID: {selectedPayroll?.id}</p>
        <p>Processed at: {new Date().toLocaleString()}</p>
      </div>
      <div className="step-actions">
        <button onClick={resetWorkflow} className="new-payroll-btn">
          Process New Payroll
        </button>
      </div>
    </div>
  );

  return (
    <div className="payroll-workflow">
      <div className="workflow-header">
        <h2>Payroll Processing Workflow</h2>
        <button onClick={resetWorkflow} className="reset-btn">Reset</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="workflow-progress">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Payroll</span>
        </div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Select Employees</span>
        </div>
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Generate Breakup</span>
        </div>
        <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Process Payout</span>
        </div>
      </div>

      <div className="workflow-content">
        {loading && <div className="loading">Loading...</div>}
        
        {!loading && currentStep === 1 && renderStep1()}
        {!loading && currentStep === 2 && renderStep2()}
        {!loading && currentStep === 3 && renderStep3()}
        {!loading && currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
}
