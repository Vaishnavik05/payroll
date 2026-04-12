import React, { useState } from "react";
import { createSalaryStructure } from "../services/api";

const INIT = {
  employeeId: "", basicSalary: "", hra: "", da: "",
  specialAllowance: "", bonus: "", lta: "",
  effectiveFrom: "", effectiveTo: ""
};

const fmt = (val) => val ? `₹${Number(val).toLocaleString("en-IN")}` : "₹0";

export default function CreateSalary() {
  const [form, setForm] = useState(INIT);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const gross = ["basicSalary","hra","da","specialAllowance","lta"].reduce(
    (s, k) => s + (parseFloat(form[k]) || 0), 0
  );
  const bonusMonthly = (parseFloat(form.bonus) || 0) / 12;
  const grossWithBonus = gross + bonusMonthly;

  const pf = (parseFloat(form.basicSalary) + (parseFloat(form.da) || 0)) * 0.12;
  const esi = grossWithBonus <= 21000 ? grossWithBonus * 0.0075 : 0;
  const pt = 200;

  const handleSubmit = async () => {
    if (!form.employeeId || !form.basicSalary || !form.effectiveFrom) {
      setStatus({ type: "error", msg: "Employee ID, Basic Salary, and Effective From are required." });
      return;
    }
    if (parseFloat(form.basicSalary) < 15000) {
      setStatus({ type: "error", msg: "Basic salary must be ≥ ₹15,000 per month." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await createSalaryStructure({
        ...form,
        basicSalary: parseFloat(form.basicSalary),
        hra: parseFloat(form.hra) || 0,
        da: parseFloat(form.da) || 0,
        specialAllowance: parseFloat(form.specialAllowance) || 0,
        bonus: parseFloat(form.bonus) || 0,
        lta: parseFloat(form.lta) || 0,
      });
      setStatus({ type: "success", msg: "Salary structure saved successfully." });
      setForm(INIT);
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to save salary structure." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div className="form-card" style={{ flex: "1 1 380px" }}>
        <h2>Define Salary Structure</h2>
        <p className="form-desc">HR_MANAGER · Set salary components for an employee</p>

        {status && (
          <div className={`alert alert-${status.type}`}>
            {status.type === "success" ? "✓" : "✗"} {status.msg}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group full">
            <label>Employee ID</label>
            <input value={form.employeeId} placeholder="Employee UUID or Code" onChange={set("employeeId")} />
          </div>

          <div className="form-section-label">Earnings</div>

          <div className="form-group">
            <label>Basic Salary (₹/month)</label>
            <input type="number" value={form.basicSalary} placeholder="Min ₹15,000" onChange={set("basicSalary")} />
          </div>

          <div className="form-group">
            <label>HRA (₹)</label>
            <input type="number" value={form.hra} placeholder="House Rent Allowance" onChange={set("hra")} />
          </div>

          <div className="form-group">
            <label>DA (₹)</label>
            <input type="number" value={form.da} placeholder="Dearness Allowance" onChange={set("da")} />
          </div>

          <div className="form-group">
            <label>Special Allowance (₹)</label>
            <input type="number" value={form.specialAllowance} placeholder="0" onChange={set("specialAllowance")} />
          </div>

          <div className="form-group">
            <label>LTA (₹/year)</label>
            <input type="number" value={form.lta} placeholder="Leave Travel Allowance" onChange={set("lta")} />
          </div>

          <div className="form-group">
            <label>Bonus (₹/year)</label>
            <input type="number" value={form.bonus} placeholder="Annual Bonus" onChange={set("bonus")} />
          </div>

          <hr className="form-divider" />
          <div className="form-section-label">Effective Period</div>

          <div className="form-group">
            <label>Effective From</label>
            <input type="date" value={form.effectiveFrom} onChange={set("effectiveFrom")} />
          </div>

          <div className="form-group">
            <label>Effective To (optional)</label>
            <input type="date" value={form.effectiveTo} onChange={set("effectiveTo")} />
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Saving..." : "Save Structure"}
            </button>
            <button className="btn btn-secondary" onClick={() => { setForm(INIT); setStatus(null); }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="data-card" style={{ flex: "0 0 280px", minWidth: 260 }}>
        <div className="data-card-header">
          <h3>Live Preview</h3>
          <span className="badge badge-blue">Monthly</span>
        </div>
        <div className="data-section-title">Earnings</div>
        <div className="data-rows">
          {[
            ["Basic", form.basicSalary],
            ["HRA", form.hra],
            ["DA", form.da],
            ["Special Allow.", form.specialAllowance],
            ["LTA", form.lta],
            ["Bonus (monthly)", bonusMonthly.toFixed(0)],
          ].map(([k, v]) => (
            <div className="data-row" key={k}>
              <span className="data-key">{k}</span>
              <span className="data-val positive">{fmt(v)}</span>
            </div>
          ))}
        </div>
        <div className="data-section-title">Est. Deductions</div>
        <div className="data-rows">
          {[
            ["PF (12%)", pf.toFixed(0)],
            ["ESI (0.75%)", esi.toFixed(0)],
            ["Prof. Tax", pt],
          ].map(([k, v]) => (
            <div className="data-row" key={k}>
              <span className="data-key">{k}</span>
              <span className="data-val negative">-{fmt(v)}</span>
            </div>
          ))}
        </div>
        <div className="data-row" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="data-key" style={{ fontWeight: 600 }}>Gross Earnings</span>
          <span className="data-val highlight">{fmt(grossWithBonus.toFixed(0))}</span>
        </div>
        <div className="data-row">
          <span className="data-key" style={{ fontWeight: 600 }}>Est. Net Salary</span>
          <span className="data-val highlight" style={{ color: "var(--accent)" }}>
            {fmt((grossWithBonus - pf - esi - pt).toFixed(0))}
          </span>
        </div>
      </div>
    </div>
  );
}