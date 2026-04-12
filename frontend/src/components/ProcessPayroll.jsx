import React, { useState, useEffect } from "react";
import { getPayrollCycles, processPayrollCycle, completePayrollCycle, getPayrollByCycle } from "../services/api";

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

const PAYOUT_BADGE = {
  PENDING:   "badge-yellow",
  PROCESSED: "badge-green",
  FAILED:    "badge-red",
};

const fmt = (v) => v != null ? `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—";

export default function ProcessPayroll() {
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getPayrollCycles().then(r => setCycles(r.data || [])).catch(() => {});
  }, []);

  const loadPayrolls = async (cycle) => {
    setSelectedCycle(cycle);
    setPayrolls([]);
    setLoading(true);
    try {
      const res = await getPayrollByCycle(cycle.id);
      setPayrolls(res.data || []);
    } catch {
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (action, cycleId) => {
    setActionLoading(action);
    setStatus(null);
    try {
      if (action === "process") await processPayrollCycle(cycleId);
      if (action === "complete") await completePayrollCycle(cycleId);
      setStatus({ type: "success", msg: `Payroll ${action === "process" ? "moved to PROCESSING" : "COMPLETED"} successfully.` });
      const res = await getPayrollCycles();
      setCycles(res.data || []);
      const updated = res.data?.find(c => c.id === cycleId);
      if (updated) loadPayrolls(updated);
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || `Failed to ${action} payroll.` });
    } finally {
      setActionLoading(null);
    }
  };

  const actionable = selectedCycle;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Cycle Selector */}
      <div className="data-card" style={{ maxWidth: "100%" }}>
        <div className="data-card-header">
          <h3>Select Payroll Cycle</h3>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Click a cycle to view & process</span>
        </div>
        <table className="breakup-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>No cycles found.</td></tr>
            ) : cycles.map(c => (
              <tr key={c.id}
                style={{ cursor: "pointer", background: selectedCycle?.id === c.id ? "rgba(74,222,128,0.05)" : undefined }}
                onClick={() => loadPayrolls(c)}
              >
                <td style={{ fontWeight: 500 }}>{MONTHS[(c.month || 1) - 1]} {c.year}</td>
                <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{c.paymentDate}</td>
                <td><span className={`badge ${STATUS_BADGE[c.status] || "badge-yellow"}`}>{c.status}</span></td>
                <td style={{ display: "flex", gap: 8 }}>
                  {c.status === "DRAFT" && (
                    <button className="btn btn-primary" style={{ padding: "5px 12px", fontSize: 12 }}
                      onClick={e => { e.stopPropagation(); doAction("process", c.id); }}
                      disabled={actionLoading === "process"}>
                      {actionLoading === "process" ? <span className="spinner" /> : "→ Process"}
                    </button>
                  )}
                  {c.status === "PROCESSING" && (
                    <button className="btn btn-primary" style={{ padding: "5px 12px", fontSize: 12, background: "var(--accent2)", color: "#0a0c10" }}
                      onClick={e => { e.stopPropagation(); doAction("complete", c.id); }}
                      disabled={actionLoading === "complete"}>
                      {actionLoading === "complete" ? <span className="spinner" /> : "✓ Complete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Alert */}
      {status && (
        <div className={`alert alert-${status.type}`} style={{ maxWidth: 680 }}>
          {status.type === "success" ? "✓" : "✗"} {status.msg}
        </div>
      )}

      {/* Employee Payrolls */}
      {selectedCycle && (
        <div className="data-card" style={{ maxWidth: "100%" }}>
          <div className="data-card-header">
            <h3>Employee Payrolls — {MONTHS[(selectedCycle.month||1)-1]} {selectedCycle.year}</h3>
            <span className={`badge ${STATUS_BADGE[selectedCycle.status]}`}>{selectedCycle.status}</span>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}><span className="spinner" /></div>
          ) : payrolls.length === 0 ? (
            <div style={{ padding: 24, color: "var(--muted)", textAlign: "center", fontSize: 13 }}>
              No employee payroll records for this cycle.
            </div>
          ) : (
            <table className="breakup-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Gross Earnings</th>
                  <th>Total Deductions</th>
                  <th>Net Salary</th>
                  <th>Payout Status</th>
                  <th>Bank Ref</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.employee?.name || p.employeeId}</td>
                    <td className="earning-row" style={{ color: "var(--accent)", fontFamily: "DM Mono, monospace" }}>{fmt(p.grossEarnings)}</td>
                    <td style={{ color: "var(--danger)", fontFamily: "DM Mono, monospace" }}>-{fmt(p.totalDeductions)}</td>
                    <td style={{ color: "var(--accent2)", fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{fmt(p.netSalary)}</td>
                    <td><span className={`badge ${PAYOUT_BADGE[p.payoutStatus] || "badge-yellow"}`}>{p.payoutStatus}</span></td>
                    <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--muted)" }}>{p.bankReference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}