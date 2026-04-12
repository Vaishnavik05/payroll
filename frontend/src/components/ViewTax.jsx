import { useState, useEffect } from "react";
import { getTax, getUsers } from "../services/api";

export default function ViewTax() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    window.location.href = '/employee';
  };

  // Fetch all employees to map employee codes to IDs
  const fetchEmployees = async () => {
    try {
      const response = await getUsers();
      setEmployees(response.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  // Find employee by code and get their ID
  const findEmployeeIdByCode = (employeeCode) => {
    const employee = employees.find(emp => emp.employeeCode === employeeCode);
    return employee ? employee.id : null;
  };

  const fetchData = async () => {
    if (!id.trim()) {
      setError("Please enter an employee code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First fetch employees if not already loaded
      if (employees.length === 0) {
        await fetchEmployees();
      }

      // Find employee ID by code
      const employeeId = findEmployeeIdByCode(id.trim());
      
      if (!employeeId) {
        setError(`Employee with code "${id}" not found`);
        return;
      }

      // Use employee ID for API call
      const res = await getTax(employeeId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tax data");
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="view-payroll-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h3>View Tax</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <input 
          placeholder="Employee Code (e.g., EMP001)" 
          value={id}
          onChange={(e)=>setId(e.target.value)}
          className="form-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              fetchData();
            }
          }}
        />
        <button 
          onClick={fetchData} 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {data && (
        <div className="data-section">
          <h4>Tax Data</h4>
          <pre className="data-display">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}