import { useState } from "react";
import { createPayroll } from "../services/api";
import "./CreatePayroll.css";

export default function CreatePayroll() {
  const [data, setData] = useState({
    month: "",
    year: "",
    startDate: "",
    endDate: "",
    paymentDate: "",
    status: "DRAFT"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBack = () => {
    window.location.href = '/finance';
  };

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!data.month || !data.year || !data.startDate || !data.endDate) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      await createPayroll({
        month: parseInt(data.month),
        year: parseInt(data.year),
        startDate: data.startDate,
        endDate: data.endDate,
        paymentDate: data.paymentDate,
        status: data.status
      });
      setSuccess("Payroll cycle created successfully!");
      setData({
        month: "",
        year: "",
        startDate: "",
        endDate: "",
        paymentDate: "",
        status: "DRAFT"
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create payroll cycle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-payroll-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h2>Create Payroll Cycle</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="month">Month*</label>
            <select
              id="month"
              value={data.month}
              onChange={(e) => setData({ ...data, month: e.target.value })}
              required
            >
              <option value="">Select Month</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="year">Year*</label>
            <select
              id="year"
              value={data.year}
              onChange={(e) => setData({ ...data, year: e.target.value })}
              required
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date*</label>
            <input
              type="date"
              id="startDate"
              value={data.startDate}
              onChange={(e) => setData({ ...data, startDate: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date*</label>
            <input
              type="date"
              id="endDate"
              value={data.endDate}
              onChange={(e) => setData({ ...data, endDate: e.target.value })}
              min={data.startDate}
              required
            />
          </div>
        </div>


        <div className="form-row">
          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date*</label>
            <input
              type="date"
              id="paymentDate"
              value={data.paymentDate}
              onChange={(e) => setData({ ...data, paymentDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value })}
            >
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating..." : "Create Payroll Cycle"}
        </button>
      </form>
    </div>
  );
}