import React, { useState } from "react";
import { getTaxComputation, computeTax } from "../services/api";

const fmt = (v) => v != null ? `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "₹0";

const TDS_SLABS = [
  { range: "Up to ₹2,50,000", rate: "Nil" },
  { range: "₹2,50,001 – ₹5,00,000", rate: "5%" },
  { range: "₹5,00,001 – ₹10,00,000", rate: "20%" },
  { range: "Above ₹10,00,000", rate: "30%" },
  { range: "Cess", rate: "4% of tax" },
];

export default function ViewTax() {
  const [empId, setEmpId] = useState("");
  const [year, setYear] = useState("2024-25");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [computing, setComputing] = useState(false);

  const fetchTax = async () => {
    if (!empId.trim()) { setError("Enter an Employee ID."); return; }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getTaxComputation(empId.trim(), year);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "No tax data found. Try computing first.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompute = async () => {
    if (!empId.trim()) { setError("Enter an Employee ID."); return; }
    setComputing(true);
    setError(null);
    try {
      const res = await computeTax(empId.trim(), year);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to compute tax.");
    } finally {
      setComputing(false);
    }
  };

  const STATUS_COLORS = { PENDING: "badge-yellow", COMPUTED: "badge-blue", FILED: "badge-green" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div className="search-bar" style={{ maxWidth: "100%", flexWrap: "wrap" }}>
        <input
          value={empId}
          placeholder="Employee ID"
          onChange={e => setEmpId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchTax()}
          style={{ flex: "1 1 160px" }}
        />
        <input
          value={year}
          placeholder="Financial Year e.g. 2024-25"
          onChange={e => setYear(e.target.value)}
          style={{ flex: "1 1 160px", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontFamily: "Sora, sans-serif", outline: "none" }}
        />
        <button className="btn btn-primary" onClick={fetchTax} disabled={loading}>
          {loading ? <span className="spinner" /> : "View Statement"}
        </button>
        <button className="btn btn-secondary" onClick={handleCompute} disabled={computing}>
          {computing ? <span className="spinner" /> : "⚙ Compute"}
        </button>
      </div>

      {error && <div className="alert alert-error">✗ {error}</div>}

      {data && (
        <>
          <div className="data-card">
            <div className="data-card-header">
              <div>
                <h3>Tax Statement — FY {data.financialYear}</h3>
                <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "DM Mono, monospace", marginTop: 4 }}>
                  Form 16 Equivalent
                </div>
              </div>
              <span className={`badge ${STATUS_COLORS[data.taxStatus] || "badge-yellow"}`}>{data.taxStatus}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border)" }}>
              {[
                { label: "Total Income", val: fmt(data.totalIncome), color: "var(--text)" },
                { label: "Taxable Income", val: fmt(data.taxableIncome), color: "var(--warn)" },
                { label: "Total Tax", val: fmt(data.totalTax), color: "var(--danger)" },
              ].map(item => (
                <div key={item.label} style={{ background: "var(--surface)", padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "DM Mono, monospace" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color, marginTop: 6, fontFamily: "DM Mono, monospace" }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="data-section-title">Deductions & Tax Breakdown</div>
            <div className="data-rows">
              {[
                ["Sec 80C Deductions", fmt(data.totalDeductionsUnder80C)],
                ["Tax Payable", fmt(data.taxPayable)],
                ["Cess (4%)", fmt(data.cess)],
                ["Total Tax", fmt(data.totalTax)],
                ["TDS Deducted", fmt(data.tdsDeducted)],
              ].map(([k, v]) => (
                <div className="data-row" key={k}>
                  <span className="data-key">{k}</span>
                  <span className="data-val" style={{ fontFamily: "DM Mono, monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header"><h3>TDS Slabs (Old Regime)</h3></div>
            <table className="breakup-table">
              <thead>
                <tr><th>Income Range</th><th>Tax Rate</th></tr>
              </thead>
              <tbody>
                {TDS_SLABS.map(s => (
                  <tr key={s.range}>
                    <td>{s.range}</td>
                    <td style={{ fontFamily: "DM Mono, monospace", color: "var(--accent2)" }}>{s.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Static TDS reference if no data */}
      {!data && !error && (
        <div className="data-card">
          <div className="data-card-header"><h3>TDS Slabs Reference (Old Regime)</h3></div>
          <table className="breakup-table">
            <thead>
              <tr><th>Income Range</th><th>Tax Rate</th></tr>
            </thead>
            <tbody>
              {TDS_SLABS.map(s => (
                <tr key={s.range}>
                  <td>{s.range}</td>
                  <td style={{ fontFamily: "DM Mono, monospace", color: "var(--accent2)" }}>{s.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 24px", fontSize: 12, color: "var(--muted)" }}>
            Section 80C deductions up to ₹1,50,000 · Professional Tax ₹200/month · Cess 4% of tax
          </div>
        </div>
      )}
    </div>
  );
}