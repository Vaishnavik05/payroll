import { useState, useEffect } from "react";
import { processPayroll, completePayroll, getPayrolls, cancelPayroll } from "../services/api";
import API from "../services/api";
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
    testConnection();
    fetchPayrolls();
  }, []);

  const testConnection = async () => {
    try {
      console.log("Testing API connection...");
      const response = await API.get("/payroll-cycles");
      console.log("Connection test successful:", response.status);
    } catch (err) {
      console.error("Connection test failed:", err.message);
      if (err.code === 'ECONNREFUSED') {
        setError("Backend server is not running. Please start the backend application on port 8080.");
      } else if (err.response?.status === 404) {
        setError("API endpoint not found. Check backend routing.");
      } else {
        setError("API connection error: " + err.message);
      }
    }
  };

  const fetchPayrolls = async () => {
    try {
      console.log("Fetching payrolls from API...");
      const response = await getPayrolls();
      console.log("API response:", response);
      console.log("Response data:", response.data);
      console.log("Response status:", response.status);
      
      if (response.data && Array.isArray(response.data)) {
        console.log("Payrolls found:", response.data.length);
        setPayrolls(response.data);
      } else {
        console.log("No payrolls found or invalid response format");
        setPayrolls([]);
      }
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      console.error("Error response:", err.response);
      setError("Failed to fetch payroll cycles: " + (err.response?.data?.message || err.message));
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

  const handleCancel = async () => {
    if (!id) {
      setError("Please enter a payroll ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await cancelPayroll(id);
      setSuccess("Payroll cancelled successfully!");
      setId("");
      // Refresh payrolls to show updated status
      fetchPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel payroll");
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
                {payroll.processedAt && ` - Processed: ${new Date(payroll.processedAt).toLocaleDateString()}`}
                {payroll.processedBy && ` by ${payroll.processedBy}`}
              </option>
            ))}
          </select>
        </div>
        
        {payrolls.length === 0 && (
          <div className="info-message">
            No payroll cycles found. Please create a payroll cycle first.
            <button 
              type="button" 
              className="refresh-btn" 
              onClick={fetchPayrolls}
              style={{marginLeft: '10px', padding: '5px 10px'}}
            >
              Refresh
            </button>
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
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Cancel Payroll"}
          </button>
        </div>
      </div>
    </div>
  );
}