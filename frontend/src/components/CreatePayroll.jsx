import React, { useState, useEffect } from "react";
import { createPayrollCycle, getPayrollCycles, cancelPayrollCycle } from "../services/api";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const STATUS_BADGE = {
  DRAFT:      "badge-yellow",
  PROCESSING: "badge-blue",
  COMPLETED:  "badge-green",
  CANCELLED:  "badge-red",
};

const INIT = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  startDate: "", endDate: "", paymentDate: ""
};

export default function CreatePayroll() {
  const [form, setForm] = useState(INIT);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Fetch all payroll cycles from backend
  const loadCycles = async () => {
    setCyclesLoading(true);
    try {
      const res = await getPayrollCycles();
      setCycles(res.data);
    } catch (err) {
      setStatus({ type: "error", msg: "Failed to load payroll cycles" });
    }
    setCyclesLoading(false);
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
      };
      await createPayrollCycle(payload);
      setStatus({ type: "success", msg: "Payroll cycle created" });
      setForm(INIT);
      loadCycles(); // Refresh the list after creation
    } catch (err) {
      setStatus({ type: "error", msg: "Failed to create payroll cycle" });
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    setLoading(true);
    setStatus(null);
    try {
      await cancelPayrollCycle(id);
      setStatus({ type: "success", msg: "Payroll cycle cancelled" });
      loadCycles(); // Refresh the list after cancellation
    } catch (err) {
      setStatus({ type: "error", msg: "Failed to cancel payroll cycle" });
    }
    setLoading(false);
  };

  return (
    <div className="form-card">
      <h2>Create Payroll Cycle</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Month</label>
          <select value={form.month} onChange={set("month")}>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year</label>
          <input type="number" value={form.year} onChange={set("year")} min="2000" max="2100" />
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" value={form.startDate} onChange={set("startDate")} />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" value={form.endDate} onChange={set("endDate")} />
        </div>
        <div className="form-group">
          <label>Payment Date</label>
          <input type="date" value={form.paymentDate} onChange={set("paymentDate")} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Payroll Cycle"}
      </button>
      {status && (
        <div className={`status-msg ${status.type}`}>{status.msg}</div>
      )}

      <hr className="form-divider" />

      <h3>Existing Payroll Cycles</h3>
      {cyclesLoading ? (
        <div>Loading cycles...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Year</th>
              <th>Start</th>
              <th>End</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>No payroll cycles found.</td>
              </tr>
            ) : (
              cycles.map(cycle => (
                <tr key={cycle.id}>
                  <td>{MONTHS[cycle.month - 1]}</td>
                  <td>{cycle.year}</td>
                  <td>{cycle.startDate}</td>
                  <td>{cycle.endDate}</td>
                  <td>{cycle.paymentDate}</td>
                  <td>
                    <span className={`header-badge ${STATUS_BADGE[cycle.status] || ""}`}>
                      {cycle.status}
                    </span>
                  </td>
                  <td>
                    {cycle.status === "DRAFT" && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancel(cycle.id)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}