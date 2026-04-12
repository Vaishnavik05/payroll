import React, { useState } from "react";
import { getEmployeePayroll } from "../services/api";

const fmt = (v) => v != null ? `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "₹0";

const COMPONENT_COLOR = {
  EARNING: "var(--accent)",
  DEDUCTION: "var(--danger)",
};

export default function ViewPayroll() {
  const [empId, setEmpId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayroll = async () => {
    if (!empId.trim()) { setError("Enter an Employee ID."); return; }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getEmployeePayroll(empId.trim());
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "No payroll data found for this employee.");
    } finally {
      setLoading(false);
    }
  };

  const latest = Array.isArray(data) ? data[0] : data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div className="search-bar">
        <input
          value={empId}
          placeholder="Enter Employee ID or Code"
          onChange={e => setEmpId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchPayroll()}
        />
        <button className="btn btn-primary" onClick={fetchPayroll} disabled={loading}>
          {loading ? <span className="spinner" /> : "View Payslip"}
        </button>
      </div>

      {error && <div className="alert alert-error">✗ {error}</div>}

      {latest && (
        <>
          {/* Header Card */}
          <div className="data-card">
            <div className="data-card-header">
              <div>
                <h3>{latest.employee?.name || "Employee"}</h3>
                <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace", marginTop: 4 }}>
                  {latest.employee?.department} · {latest.employee?.employeeCode}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Pay Period</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, marginTop: 2 }}>
                  {latest.payrollCycle?.month}/{latest.payrollCycle?.year}
                </div>
              </div>
            </div>

            {/* Summary Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border)" }}>
              {[
                { label: "Gross Earnings", val: fmt(latest.grossEarnings), color: "var(--accent)" },
                { label: "Total Deductions", val: fmt(latest.totalDeductions), color: "var(--danger)" },
                { label: "Net Salary", val: fmt(latest.netSalary), color: "var(--accent2)" },
              ].map(item => (
                <div key={item.label} style={{ background: "var(--surface)", padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "DM Mono, monospace" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: item.color, marginTop: 6, fontFamily: "DM Mono, monospace" }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Breakup */}
          {latest.salaryBreakups && latest.salaryBreakups.length > 0 && (
            <div className="data-card">
              <div className="data-card-header"><h3>Salary Breakup</h3></div>
              <table className="breakup-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Type</th>
                    <th>Formula</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.salaryBreakups
                    .sort((a, b) => a.componentType === "EARNING" ? -1 : 1)
                    .map(row => (
                    <tr key={row.id}
                      className={row.componentType === "EARNING" ? "earning-row" : "deduction-row"}>
                      <td style={{ fontWeight: 500 }}>{row.componentName}</td>
                      <td>
                        <span className={`badge ${row.componentType === "EARNING" ? "badge-green" : "badge-red"}`}>
                          {row.componentType}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
                        {row.calculationFormula || "—"}
                      </td>
                      <td style={{ color: COMPONENT_COLOR[row.componentType], fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
                        {row.componentType === "DEDUCTION" ? "-" : ""}{fmt(row.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={3} style={{ fontWeight: 700 }}>Net Salary</td>
                    <td style={{ color: "var(--accent2)", fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 16 }}>
                      {fmt(latest.netSalary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Payout Info */}
          <div className="data-card">
            <div className="data-card-header"><h3>Payout Details</h3></div>
            <div className="data-rows">
              {[
                ["Payout Status", latest.payoutStatus],
                ["Bank Reference", latest.bankReference || "—"],
                ["Paid At", latest.paidAt || "—"],
              ].map(([k, v]) => (
                <div className="data-row" key={k}>
                  <span className="data-key">{k}</span>
                  <span className="data-val" style={{ fontFamily: "DM Mono, monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}