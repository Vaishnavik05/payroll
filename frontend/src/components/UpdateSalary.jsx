import { useState, useEffect } from "react";
import { getSalaryByEmployee, getUsers } from "../services/api";
import "./CreateSalary.css";

export default function UpdateSalary() {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [salaryData, setSalaryData] = useState(null);
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

  const fetchSalaryData = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await getSalaryByEmployee(selectedEmployee);
      if (response.data && response.data.length > 0) {
        const latestSalary = response.data[0];
        setSalaryData({
          id: latestSalary.id,
          basic: latestSalary.basic.toString(),
          hra: latestSalary.hra.toString(),
          da: latestSalary.da.toString(),
          specialAllowance: latestSalary.specialAllowance.toString(),
          bonus: latestSalary.bonus.toString(),
          lta: latestSalary.lta.toString(),
          effectiveFrom: latestSalary.effectiveFrom,
          effectiveTo: latestSalary.effectiveTo
        });
      } else {
        setError("No salary structure found for this employee");
        setSalaryData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch salary data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Find the selected employee to get employee code
      const selectedEmployeeObj = employees.find(emp => emp.id.toString() === selectedEmployee);
      if (!selectedEmployeeObj) {
        setError("Please select a valid employee");
        return;
      }

      const response = await fetch(`http://localhost:8080/api/salary-structures/${salaryData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...salaryData,
          employeeId: selectedEmployee,
          employeeCode: selectedEmployeeObj.employeeCode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update salary structure');
      }

      setSuccess("Salary structure updated successfully!");
      await fetchSalaryData();
    } catch (err) {
      setError(err.message || "Failed to update salary structure");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSalaryData(prev => ({
      ...prev,
      [field]: value
    }));
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
        <h2>Update Salary Structure</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-group">
        <label htmlFor="employeeSelect">Select Employee</label>
        <select
          id="employeeSelect"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name} - {emp.employeeCode} ({emp.role})
            </option>
          ))}
        </select>
        <button 
          type="button" 
          className="submit-btn" 
          onClick={fetchSalaryData}
          disabled={!selectedEmployee || loading}
          style={{ marginTop: '10px' }}
        >
          {loading ? "Loading..." : "Fetch Salary Data"}
        </button>
      </div>

      {salaryData && (
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="basic">Basic Salary (Rs.)*</label>
            <input
              type="number"
              id="basic"
              value={salaryData.basic}
              onChange={(e) => handleInputChange('basic', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hra">HRA (Rs.)</label>
            <input
              type="number"
              id="hra"
              value={salaryData.hra}
              onChange={(e) => handleInputChange('hra', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="da">Dearness Allowance (Rs.)</label>
            <input
              type="number"
              id="da"
              value={salaryData.da}
              onChange={(e) => handleInputChange('da', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialAllowance">Special Allowance (Rs.)</label>
            <input
              type="number"
              id="specialAllowance"
              value={salaryData.specialAllowance}
              onChange={(e) => handleInputChange('specialAllowance', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bonus">Bonus (Rs.)</label>
            <input
              type="number"
              id="bonus"
              value={salaryData.bonus}
              onChange={(e) => handleInputChange('bonus', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lta">Leave Travel Allowance (Rs.)</label>
            <input
              type="number"
              id="lta"
              value={salaryData.lta}
              onChange={(e) => handleInputChange('lta', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="effectiveFrom">Effective From*</label>
            <input
              type="date"
              id="effectiveFrom"
              value={salaryData.effectiveFrom}
              onChange={(e) => handleInputChange('effectiveFrom', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="effectiveTo">Effective To</label>
            <input
              type="date"
              id="effectiveTo"
              value={salaryData.effectiveTo}
              onChange={(e) => handleInputChange('effectiveTo', e.target.value)}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Salary Structure"}
          </button>
        </form>
      )}
    </div>
  );
}
