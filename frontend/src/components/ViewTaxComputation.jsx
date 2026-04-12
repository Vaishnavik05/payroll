import React, { useState, useEffect } from 'react';
import { getTaxComputationsByEmployee, getLatestTaxComputationByEmployee, getTaxSummaryByFinancialYear, getTaxComputationsByEmployeeAndFinancialYear } from '../services/api';

export default function ViewTaxComputation({ employeeCode: propEmployeeCode = '' }) {
  const [employeeCode, setEmployeeCode] = useState(propEmployeeCode);
  const [financialYear, setFinancialYear] = useState('');
  const [taxData, setTaxData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('employee'); // employee, summary
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (propEmployeeCode) {
      setEmployeeCode(propEmployeeCode);
      // Auto-load latest tax computation for the provided employee
      const autoLoadTaxData = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
          const empCode = propEmployeeCode.trim().toUpperCase();
          const response = await getLatestTaxComputationByEmployee(empCode);
          const taxData = response.data ? [response.data] : [];
          setTaxData(taxData);
          setSummaryData(null);
          if (taxData.length > 0) {
            setSuccess(`Latest tax computation loaded for employee ${empCode}`);
          } else {
            setSuccess(`No tax computation found for employee ${empCode}`);
          }
        } catch (err) {
          console.error('Auto-load Tax API Error:', err);
          // Clear data on auto-load error and don't show error message
          setTaxData([]);
          setSummaryData(null);
          setSuccess(`No tax computation found for employee ${propEmployeeCode.trim().toUpperCase()}`);
        } finally {
          setLoading(false);
        }
      };
      
      autoLoadTaxData();
    }
  }, [propEmployeeCode]);

  const handleBack = () => {
    window.location.href = '/employee';
  };

  const validateInputs = () => {
    const errors = {};
    
    if (viewMode === 'employee') {
      if (!employeeCode.trim()) {
        errors.employeeCode = 'Employee Code is required';
      } else if (!/^EMP\d+$/.test(employeeCode.trim().toUpperCase())) {
        errors.employeeCode = 'Employee Code must be in format EMP001, EMP100, etc.';
      }
      
      if (financialYear && !/^\d{4}-\d{4}$/.test(financialYear.trim())) {
        errors.financialYear = 'Financial year must be in format YYYY-YYYY';
      }
    } else {
      if (!financialYear.trim()) {
        errors.financialYear = 'Financial year is required';
      } else if (!/^\d{4}-\d{4}$/.test(financialYear.trim())) {
        errors.financialYear = 'Financial year must be in format YYYY-YYYY';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchTaxData = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    // Clear previous data
    setTaxData([]);
    setSummaryData(null);

    try {
      let response;
      if (viewMode === 'employee') {
        const empCode = employeeCode.trim().toUpperCase();
        if (financialYear.trim()) {
          response = await getTaxComputationsByEmployeeAndFinancialYear(empCode, financialYear.trim());
          setTaxData(response.data || []);
          setSummaryData(null);
          setSuccess(`Found ${response.data?.length || 0} tax records for employee ${empCode}`);
        } else {
          response = await getTaxComputationsByEmployee(empCode);
          const taxData = Array.isArray(response.data) ? response.data : [];
          setTaxData(taxData);
          setSummaryData(null);
          setSuccess(`Found ${taxData.length} tax records for employee ${empCode}`);
        }
      } else {
        response = await getTaxSummaryByFinancialYear(financialYear.trim());
        setSummaryData(response.data || response);
        setTaxData([]);
        setSuccess(`Tax summary loaded for ${financialYear}`);
      }
    } catch (err) {
      console.error('Tax API Error:', err);
      // Clear data on error
      setTaxData([]);
      setSummaryData(null);
      
      let errorMessage = 'Failed to fetch tax computation data';
      
      if (err.response?.status === 404) {
        if (viewMode === 'employee') {
          errorMessage = `No tax data found for employee code "${employeeCode.trim().toUpperCase()}"`;
        } else {
          errorMessage = `No tax data found for financial year "${financialYear.trim()}"`;
        }
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid request parameters';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestTax = async () => {
    if (!employeeCode.trim()) {
      setError('Please enter an employee code');
      return;
    }
    
    if (!/^EMP\d+$/.test(employeeCode.trim().toUpperCase())) {
      setError('Employee Code must be in format EMP001, EMP100, etc.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    // Clear previous data
    setTaxData([]);
    setSummaryData(null);

    try {
      const empCode = employeeCode.trim().toUpperCase();
      const response = await getLatestTaxComputationByEmployee(empCode);
      const taxData = response.data ? [response.data] : [];
      setTaxData(taxData);
      setSummaryData(null);
      setSuccess(`Latest tax computation loaded for employee ${empCode}`);
    } catch (err) {
      console.error('Latest Tax API Error:', err);
      // Clear data on error
      setTaxData([]);
      setSummaryData(null);
      
      let errorMessage = 'Failed to fetch latest tax computation';
      
      if (err.response?.status === 404) {
        errorMessage = `No tax computation found for employee code "${employeeCode.trim().toUpperCase()}"`;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid employee code';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

return (
  <div className="tax-computation-container">
    {/* Quick Action Buttons */}
    <div className="quick-actions">
      <button className="action-btn payroll-btn" onClick={() => window.location.href = '/payroll'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4 4m0 0a4 4 0 0 0 4 4v2m-1 1a1 1 0 0 0 1 1v2m0 0a1 1 0 0 1 1"/>
        </svg>
        View Payroll
      </button>
      <button className="action-btn tax-btn" onClick={() => window.location.href = '/tax'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 14H4m0 0a2 2 0 0 0 2v10a2 2 0 0 0 2h16a2 2 0 0 0 2M9 14l7 7m0 0a2 2 0 0 0 2v10a2 2 0 0 0 2"/>
        </svg>
        Tax Information
      </button>
    </div>

    {/* Header */}
    <div className="form-header">
      <h3>Tax Computation Details</h3>
    </div>
    
    {error && (
      <div className="error-message">
        <div className="error-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>Error</span>
        </div>
        <div className="error-content">{error}</div>
      </div>
    )}
    
    {success && (
      <div className="success-message">
        <div className="success-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>Success</span>
        </div>
        <div className="success-content">{success}</div>
      </div>
    )}

    <div className="input-controls">
      {viewMode === 'employee' && (
        <>
          <div className="input-group">
            <label>Employee Code</label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => {
                setEmployeeCode(e.target.value);
                if (validationErrors.employeeCode) {
                  setValidationErrors({...validationErrors, employeeCode: ''});
                }
              }}
              placeholder="EMP001"
              className={validationErrors.employeeCode ? 'error' : ''}
            />
            {validationErrors.employeeCode && (
              <span className="error-text">{validationErrors.employeeCode}</span>
            )}
          </div>
          <div className="input-group">
            <label>Financial Year</label>
            <input
              type="text"
              value={financialYear}
              onChange={(e) => {
                setFinancialYear(e.target.value);
                if (validationErrors.financialYear) {
                  setValidationErrors({...validationErrors, financialYear: ''});
                }
              }}
              placeholder="2024-2025"
              className={validationErrors.financialYear ? 'error' : ''}
            />
            {validationErrors.financialYear && (
              <span className="error-text">{validationErrors.financialYear}</span>
            )}
          </div>
          <div className="button-group">
            <button 
              className="fetch-btn"
              onClick={fetchTaxData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Fetch Tax Data'}
            </button>
            <button 
              className="fetch-btn secondary"
              onClick={fetchLatestTax}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Latest Tax'}
            </button>
          </div>
        </>
      )}
      
      {viewMode === 'summary' && (
        <>
          <div className="input-group">
            <label>Financial Year</label>
            <input
              type="text"
              value={financialYear}
              onChange={(e) => {
                setFinancialYear(e.target.value);
                if (validationErrors.financialYear) {
                  setValidationErrors({...validationErrors, financialYear: ''});
                }
              }}
              placeholder="2024-2025"
              required
              className={validationErrors.financialYear ? 'error' : ''}
            />
            {validationErrors.financialYear && (
              <span className="error-text">{validationErrors.financialYear}</span>
            )}
          </div>
          <div className="button-group">
            <button 
              className="fetch-btn"
              onClick={fetchTaxData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Get Summary'}
            </button>
          </div>
        </>
      )}
    </div>

    <div className="results-section">
      {summaryData && (
        <div className="summary-card">
          <h4>Tax Summary - {summaryData.financialYear}</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Employees</span>
              <span className="value">{summaryData.totalEmployees}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Annual Income</span>
              <span className="value">{formatCurrency(summaryData.totalAnnualIncome)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Tax Collected</span>
              <span className="value">{formatCurrency(summaryData.totalTaxCollected)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total TDS Deducted</span>
              <span className="value">{formatCurrency(summaryData.totalTDSDeducted)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Average Tax Per Employee</span>
              <span className="value">{formatCurrency(summaryData.averageTaxPerEmployee)}</span>
            </div>
          </div>
        </div>
      )}

      {taxData.length > 0 && (
        <div className="tax-data-grid">
          <h4>Tax Computation Records</h4>
          {taxData.map((tax) => (
            <div key={tax.id} className="tax-card">
              <div className="tax-header">
                <h5>Financial Year: {tax.financialYear}</h5>
                <span className={`status-badge ${tax.taxStatus?.toLowerCase() || 'computed'}`}>
                  {tax.taxStatus || 'COMPUTED'}
                </span>
              </div>
              
              <div className="tax-details">
                <div className="detail-row">
                  <span className="detail-label">Total Income:</span>
                  <span className="detail-value">{formatCurrency(tax.totalIncome)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Taxable Income:</span>
                  <span className="detail-value">{formatCurrency(tax.taxableIncome)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tax Payable:</span>
                  <span className="detail-value">{formatCurrency(tax.taxPayable)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Tax:</span>
                  <span className="detail-value">{formatCurrency(tax.totalTax)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">TDS Deducted:</span>
                  <span className="detail-value">{formatCurrency(tax.taxDeducted)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Deductions:</span>
                  <span className="detail-value">{formatCurrency(tax.totalDeductions)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cess:</span>
                  <span className="detail-value">{formatCurrency(tax.cess || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Computed On:</span>
                  <span className="detail-value">{formatDate(tax.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {taxData.length === 0 && !summaryData && !loading && (
        <div className="no-data">
          <div className="no-data-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 9l-3-3"/>
              <path d="M21 12v-1a2 2 0 0 0-2-2h-3"/>
              <path d="M8 21H4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <h4>No Tax Data Found</h4>
          <p>No tax computation records found for the specified criteria.</p>
          <div className="no-data-actions">
            <button onClick={() => {
              setEmployeeCode('');
              setFinancialYear('');
              setValidationErrors({});
            }} className="clear-btn">
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
