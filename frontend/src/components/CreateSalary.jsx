import { useState, useEffect } from "react";
import { createSalary, getUsers } from "../services/api";
import "./CreateSalary.css";

export default function CreateSalary() {
  const [data, setData] = useState({
    employeeId: "",
    basic: "",
    hra: "",
    da: "",
    specialAllowance: "",
    bonus: "",
    lta: "",
    effectiveFrom: "",
    effectiveTo: ""
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBack = () => {
    window.location.href = '/hr';
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await getUsers();
      setEmployees(response.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const calculateHRA = (basic, isMetro = true) => {
    return basic * (isMetro ? 0.5 : 0.4);
  };

  const calculateGross = () => {
    const basic = parseFloat(data.basic) || 0;
    const hra = parseFloat(data.hra) || 0;
    const da = parseFloat(data.da) || 0;
    const special = parseFloat(data.specialAllowance) || 0;
    const bonus = parseFloat(data.bonus) || 0;
    const lta = parseFloat(data.lta) || 0;
    return basic + hra + da + special + bonus + lta;
  };

  const validateBasicSalary = (basic) => {
    return basic >= 15000;
  };

  const handleBasicChange = (value) => {
    setData(prev => ({
      ...prev,
      basic: value
    }));
    
    const basic = parseFloat(value) || 0;
    if (value && !validateBasicSalary(basic)) {
      setError("Basic salary must be at least Rs. 15,000 per month");
    } else {
      setError("");
      if (basic >= 15000) {
        const hra = calculateHRA(basic);
        setData(prev => ({
          ...prev,
          hra: hra.toString()
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const basic = parseFloat(data.basic);
      if (!validateBasicSalary(basic)) {
        setError("Basic salary must be at least Rs. 15,000 per month");
        return;
      }

      // Find the selected employee to get employee code
      const selectedEmployee = employees.find(emp => emp.id.toString() === data.employeeId);
      if (!selectedEmployee) {
        setError("Please select a valid employee");
        return;
      }

      // Include employee_code in the data being sent
      const salaryData = {
        ...data,
        employeeCode: selectedEmployee.employeeCode
      };

      await createSalary(salaryData);
      setSuccess("Salary structure created successfully!");
      setData({
        employeeId: "",
        basic: "",
        hra: "",
        da: "",
        specialAllowance: "",
        bonus: "",
        lta: "",
        effectiveFrom: "",
        effectiveTo: ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create salary structure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-salary-container">
      <div className="form-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <h2>Create Salary Structure</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="employeeId">Employee</label>
          <select
            id="employeeId"
            value={data.employeeId}
            onChange={(e) => setData({...data, employeeId: e.target.value})}
            required
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} - {emp.employeeCode} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="basic">Basic Salary (Rs.)*</label>
          <input
            type="number"
            id="basic"
            value={data.basic}
            onChange={(e) => handleBasicChange(e.target.value)}
            placeholder="Minimum 15000"
            required
          />
          <small>Minimum: Rs. 15,000 per month</small>
        </div>

        <div className="form-group">
          <label htmlFor="hra">HRA (Rs.)</label>
          <input
            type="number"
            id="hra"
            value={data.hra}
            onChange={(e) => setData({...data, hra: e.target.value})}
            placeholder="Auto-calculated as 50% of basic"
          />
          <small>Auto-calculated: 50% of basic (metro)</small>
        </div>

        <div className="form-group">
          <label htmlFor="da">Dearness Allowance (Rs.)</label>
          <input
            type="number"
            id="da"
            value={data.da}
            onChange={(e) => setData({...data, da: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialAllowance">Special Allowance (Rs.)</label>
          <input
            type="number"
            id="specialAllowance"
            value={data.specialAllowance}
            onChange={(e) => setData({...data, specialAllowance: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bonus">Bonus (Rs.)</label>
          <input
            type="number"
            id="bonus"
            value={data.bonus}
            onChange={(e) => setData({...data, bonus: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lta">Leave Travel Allowance (Rs.)</label>
          <input
            type="number"
            id="lta"
            value={data.lta}
            onChange={(e) => setData({...data, lta: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label htmlFor="effectiveFrom">Effective From*</label>
          <input
            type="date"
            id="effectiveFrom"
            value={data.effectiveFrom}
            onChange={(e) => setData({...data, effectiveFrom: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="effectiveTo">Effective To</label>
          <input
            type="date"
            id="effectiveTo"
            value={data.effectiveTo}
            onChange={(e) => setData({...data, effectiveTo: e.target.value})}
          />
        </div>

        <div className="gross-display">
          <h4>Gross Salary: Rs. {calculateGross().toFixed(2)}</h4>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating..." : "Create Salary Structure"}
        </button>
      </form>
    </div>
  );
}