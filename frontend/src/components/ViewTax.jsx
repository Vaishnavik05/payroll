import { useState } from "react";
import { getTaxComputationsByEmployee, getLatestTaxComputationByEmployee } from "../services/api";
import "./ViewTax.css";

export default function ViewTax() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    if (!employeeCode) {
      setError("Enter employee code");
      return;
    }

    setLoading(true);
    setError("");
    setData([]);

    try {
      const res = financialYear
        ? await getTaxComputationsByEmployee(employeeCode, financialYear)
        : await getTaxComputationsByEmployee(employeeCode);

      setData(res.data || []);
    } catch {
      setError("No data found");
    } finally {
      setLoading(false);
    }
  };

  const fetchLatest = async () => {
    if (!employeeCode) {
      setError("Enter employee code");
      return;
    }

    setLoading(true);
    setError("");
    setData([]);

    try {
      const res = await getLatestTaxComputationByEmployee(employeeCode);
      setData(res.data ? [res.data] : []);
    } catch {
      setError("No latest record found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tax-container">
      <div className="header">
        <h2>Tax Details</h2>
      </div>

      <div className="controls">
        <input
          placeholder="Employee Code (EMP001)"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
        />

        <input
          placeholder="Financial Year (2024-2025)"
          value={financialYear}
          onChange={(e) => setFinancialYear(e.target.value)}
        />

        <div className="btns">
          <button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Fetch"}
          </button>
          <button onClick={fetchLatest} disabled={loading}>
            Latest
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {data.length > 0 && (
        <div className="cards">
          {data.map((item) => (
            <div className="card" key={item.id}>
              <h4>{item.financialYear}</h4>

              <div className="row">
                <span>Total Income</span>
                <span>₹{item.totalIncome}</span>
              </div>

              <div className="row">
                <span>Taxable Income</span>
                <span>₹{item.taxableIncome}</span>
              </div>

              <div className="row">
                <span>Tax Payable</span>
                <span>₹{item.taxPayable}</span>
              </div>

              <div className="row">
                <span>Total Tax</span>
                <span>₹{item.totalTax}</span>
              </div>

              <div className="row">
                <span>TDS Deducted</span>
                <span>₹{item.taxDeducted}</span>
              </div>

              <div className="row">
                <span>Status</span>
                <span className="status">{item.taxStatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="empty">No Tax Data</div>
      )}
    </div>
  );
}