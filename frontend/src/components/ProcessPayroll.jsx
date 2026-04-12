import { useState, useEffect } from "react";
import { processPayroll, completePayroll, getPayrolls } from "../services/api";
import "./ProcessPayroll.css";

export default function ProcessPayroll() {
  const [id, setId] = useState("");
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleBack = () => {
    window.location.href = '/finance';
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await getPayrolls();
      console.log("Fetched payrolls:", response.data); // Debug log
      setPayrolls(response.data || []);
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      setPayrolls([]);
    }
  };

  const handleProcess = async () => {
    if (!id) {
      setError("Please enter a payroll ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await processPayroll(id);
      setSuccess("Payroll processing started successfully!");
      setId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) {
      setError("Please enter a payroll ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await completePayroll(id);
      setSuccess("Payroll completed successfully!");
      setId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete payroll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="process-payroll-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h2>Process Payroll</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="payroll-form">
        <div className="form-group">
          <label htmlFor="payrollId">Payroll ID*</label>
          <select
            id="payrollId"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          >
            <option value="">Select Payroll</option>
            {payrolls.map(payroll => (
              <option key={payroll.id} value={payroll.id}>
                ID: {payroll.id} - {payroll.month || 'Unknown'}/{payroll.year || 'Unknown'} - {payroll.status || 'Unknown Status'}
              </option>
            ))}
          </select>
        </div>
        
        {payrolls.length === 0 && (
          <div className="info-message">
            No payroll cycles found. Please create a payroll cycle first.
          </div>
        )}

        <div className="button-group">
          <button 
            type="button" 
            className="process-btn" 
            onClick={handleProcess}
            disabled={loading}
          >
            {loading ? "Processing..." : "Process Payroll"}
          </button>
          <button 
            type="button" 
            className="complete-btn" 
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? "Completing..." : "Complete Payroll"}
          </button>
        </div>
      </div>
    </div>
  );
}