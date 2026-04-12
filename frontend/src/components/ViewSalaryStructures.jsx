import { useState, useEffect } from "react";
import { getUsers } from "../services/api";
import "./CreateSalary.css";

export default function ViewSalaryStructures() {
  const [employees, setEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const fetchSalaryStructures = async () => {
    setLoading(true);
    setError("");

    try {
      const promises = employees
        .filter(emp => !selectedDepartment || emp.department === selectedDepartment)
        .map(async (emp) => {
          try {
            const response = await fetch(`http://localhost:8080/api/salary-structures/employee/${emp.id}`);
            const salaryData = await response.json();
            return {
              employee: emp,
              salaryStructures: salaryData
            };
          } catch (err) {
            return {
              employee: emp,
              salaryStructures: []
            };
          }
        });

      const results = await Promise.all(promises);
      setSalaryStructures(results.filter(result => result.salaryStructures.length > 0));
    } catch (err) {
      setError("Failed to fetch salary structures");
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  const calculateGross = (salary) => {
    return (salary.basic || 0) + (salary.hra || 0) + (salary.da || 0) + 
           (salary.specialAllowance || 0) + (salary.bonus || 0) + (salary.lta || 0);
  };

  return (
    <div className="create-salary-container">
      <h2>View Salary Structures by Department</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="department">Department</label>
        <select
          id="department"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <button 
        type="button" 
        className="submit-btn" 
        onClick={fetchSalaryStructures}
        disabled={loading}
      >
        {loading ? "Loading..." : "View Salary Structures"}
      </button>

      {salaryStructures.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Salary Structures</h3>
          {salaryStructures.map((item, index) => (
            <div key={index} className="salary-structure-card">
              <div className="employee-info">
                <h4>{item.employee.name}</h4>
                <p>Employee Code: {item.employee.employeeCode}</p>
                <p>Department: {item.employee.department}</p>
              </div>
              
              {item.salaryStructures.map((salary, salaryIndex) => (
                <div key={salaryIndex} className="salary-details">
                  <div className="salary-period">
                    <strong>Effective:</strong> {salary.effectiveFrom} 
                    {salary.effectiveTo && ` to ${salary.effectiveTo}`}
                  </div>
                  
                  <div className="salary-breakdown">
                    <div className="salary-row">
                      <span>Basic Salary:</span>
                      <span>Rs. {salary.basic?.toFixed(2) || 0}</span>
                    </div>
                    <div className="salary-row">
                      <span>HRA:</span>
                      <span>Rs. {salary.hra?.toFixed(2) || 0}</span>
                    </div>
                    <div className="salary-row">
                      <span>Dearness Allowance:</span>
                      <span>Rs. {salary.da?.toFixed(2) || 0}</span>
                    </div>
                    <div className="salary-row">
                      <span>Special Allowance:</span>
                      <span>Rs. {salary.specialAllowance?.toFixed(2) || 0}</span>
                    </div>
                    <div className="salary-row">
                      <span>Bonus:</span>
                      <span>Rs. {salary.bonus?.toFixed(2) || 0}</span>
                    </div>
                    <div className="salary-row">
                      <span>Leave Travel Allowance:</span>
                      <span>Rs. {salary.lta?.toFixed(2) || 0}</span>
                    </div>
                    <div className="salary-row gross">
                      <strong>Gross Salary:</strong>
                      <strong>Rs. {calculateGross(salary).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {salaryStructures.length === 0 && !loading && selectedDepartment && (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          No salary structures found for this department
        </div>
      )}
    </div>
  );
}
