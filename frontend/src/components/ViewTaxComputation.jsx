import React, { useState, useEffect } from 'react';
import { getTaxComputationsByEmployee, getLatestTaxComputationByEmployee, getTaxSummaryByFinancialYear, getTaxComputationsByEmployeeAndFinancialYear } from '../services/api';

export default function ViewTaxComputation() {
  const [employeeId, setEmployeeId] = useState('');
  const [financialYear, setFinancialYear] = useState('');
  const [taxData, setTaxData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('employee'); // employee, summary

  const handleBack = () => {
    window.location.href = '/employee';
  };

  const fetchTaxData = async () => {
    setLoading(true);
    setError('');

    try {
      let response;
      if (viewMode === 'employee') {
        if (!employeeId.trim()) {
          setError('Please enter an employee ID');
          setLoading(false);
          return;
        }
        const empId = parseInt(employeeId);
        if (financialYear) {
          response = await getTaxComputationsByEmployeeAndFinancialYear(empId, financialYear);
          setTaxData(response.data || []);
          setSummaryData(null);
          return;
        } else {
          response = await getTaxComputationsByEmployee(empId);
        }
      } else {
        if (!financialYear.trim()) {
          setError('Please enter a financial year');
          setLoading(false);
          return;
        }
        response = await getTaxSummaryByFinancialYear(financialYear);
      }
      
      if (viewMode === 'summary') {
        console.log('Summary API Response:', response);
        console.log('Summary Data:', response.data || response);
        setSummaryData(response.data || response);
        setTaxData([]);
      } else {
        const taxData = Array.isArray(response.data) ? response.data : (response ? [response] : []);
        setTaxData(taxData);
        setSummaryData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tax computation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestTax = async () => {
    if (!employeeId.trim()) {
      setError('Please enter an employee ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const empId = parseInt(employeeId);
      const response = await getLatestTaxComputationByEmployee(empId);
      const taxData = response.data ? [response.data] : [];
      setTaxData(taxData);
      setSummaryData(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch latest tax computation');
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
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h3>Tax Computation Details</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="controls-section">
        <div className="view-mode-toggle">
          <button 
            className={`mode-btn ${viewMode === 'employee' ? 'active' : ''}`}
            onClick={() => setViewMode('employee')}
          >
            Employee View
          </button>
          <button 
            className={`mode-btn ${viewMode === 'summary' ? 'active' : ''}`}
            onClick={() => setViewMode('summary')}
          >
            Summary View
          </button>
        </div>

        <div className="input-controls">
          {viewMode === 'employee' && (
            <>
              <div className="input-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter Employee ID"
                />
              </div>
              <div className="input-group">
                <label>Financial Year (Optional)</label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  placeholder="e.g., 2024-2025"
                />
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
                <label>Financial Year *</label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  placeholder="e.g., 2024-2025"
                  required
                />
              </div>
              <div className="button-group">
                <button 
                  className="fetch-btn"
                  onClick={fetchTaxData}
                  disabled={loading || !financialYear.trim()}
                >
                  {loading ? 'Loading...' : 'Get Summary'}
                </button>
              </div>
            </>
          )}
        </div>
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
                  <span className={`status-badge ${tax.status?.toLowerCase() || 'computed'}`}>
                    {tax.status || 'COMPUTED'}
                  </span>
                </div>
                
                <div className="tax-details">
                  <div className="detail-row">
                    <span className="detail-label">Annual Income:</span>
                    <span className="detail-value">{formatCurrency(tax.annualIncome)}</span>
                  </div>
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
                    <span className="detail-value">{formatCurrency(tax.tdsDeducted)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">TDS Per Month:</span>
                    <span className="detail-value">{formatCurrency(tax.tdsPerMonth)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Other Deductions:</span>
                    <span className="detail-value">{formatCurrency(tax.otherDeductions)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Deductions:</span>
                    <span className="detail-value">{formatCurrency(tax.deductions)}</span>
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
            <h4>No Tax Data Found</h4>
            <p>No tax computation records found for the specified criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
