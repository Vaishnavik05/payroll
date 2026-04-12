import { useState, useEffect } from "react";
import { 
  getSalaryBreakups, 
  getSalaryBreakupByEmployeePayroll,
  getSalaryBreakupByEmployee,
  getSalaryBreakupByPayrollCycle,
  createSalaryBreakup,
  createSalaryBreakups,
  updateSalaryBreakup,
  deleteSalaryBreakup 
} from "../services/api";
import "./SalaryBreakupManager.css";

export default function SalaryBreakupManager() {
  const [breakups, setBreakups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBreakup, setEditingBreakup] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");

  const [formData, setFormData] = useState({
    componentName: "",
    componentType: "EARNING",
    amount: "",
    calculationFormula: ""
  });

  useEffect(() => {
    fetchBreakups();
  }, [filterType, filterValue]);

  const fetchBreakups = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      switch(filterType) {
        case "employeePayroll":
          if (filterValue) {
            response = await getSalaryBreakupByEmployeePayroll(filterValue);
          } else {
            response = await getSalaryBreakups();
          }
          break;
        case "employee":
          if (filterValue) {
            response = await getSalaryBreakupByEmployee(filterValue);
          } else {
            response = await getSalaryBreakups();
          }
          break;
        case "payrollCycle":
          if (filterValue) {
            response = await getSalaryBreakupByPayrollCycle(filterValue);
          } else {
            response = await getSalaryBreakups();
          }
          break;
        default:
          response = await getSalaryBreakups();
      }
      setBreakups(response.data || []);
    } catch (err) {
      setError("Failed to fetch salary breakups: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingBreakup) {
        await updateSalaryBreakup(editingBreakup.id, data);
        setSuccess("Salary breakup updated successfully!");
        setEditingBreakup(null);
      } else {
        await createSalaryBreakup(data);
        setSuccess("Salary breakup created successfully!");
      }

      resetForm();
      fetchBreakups();
    } catch (err) {
      setError("Failed to save salary breakup: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (breakup) => {
    setEditingBreakup(breakup);
    setFormData({
      componentName: breakup.componentName,
      componentType: breakup.componentType,
      amount: breakup.amount.toString(),
      calculationFormula: breakup.calculationFormula || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salary breakup?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteSalaryBreakup(id);
      setSuccess("Salary breakup deleted successfully!");
      fetchBreakups();
    } catch (err) {
      setError("Failed to delete salary breakup: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      componentName: "",
      componentType: "EARNING",
      amount: "",
      calculationFormula: ""
    });
    setShowForm(false);
    setEditingBreakup(null);
  };

  const getComponentTypeColor = (type) => {
    return type === "EARNING" ? "#10b981" : "#ef4444";
  };

  const calculateTotal = (type) => {
    return breakups
      .filter(b => type === "all" || b.componentType === type)
      .reduce((sum, b) => sum + (b.amount || 0), 0);
  };

  return (
    <div className="salary-breakup-manager">
      <div className="manager-header">
        <h2>Salary Breakup Management</h2>
        <button 
          className="add-btn" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Component"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="filters-section">
        <div className="filter-controls">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Breakups</option>
            <option value="employeePayroll">By Employee Payroll ID</option>
            <option value="employee">By Employee ID</option>
            <option value="payrollCycle">By Payroll Cycle ID</option>
          </select>
          
          {filterType !== "all" && (
            <input
              type="text"
              placeholder={`Enter ${filterType} ID`}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="filter-input"
            />
          )}
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Earnings</h3>
            <p className="amount earnings">Rs. {calculateTotal("EARNING").toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <h3>Total Deductions</h3>
            <p className="amount deductions">Rs. {calculateTotal("DEDUCTION").toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <h3>Net Amount</h3>
            <p className="amount net">Rs. {(calculateTotal("EARNING") - calculateTotal("DEDUCTION")).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingBreakup ? "Edit Salary Component" : "Add New Salary Component"}</h3>
          <form onSubmit={handleSubmit} className="breakup-form">
            <div className="form-row">
              <div className="form-group">
                <label>Component Name*</label>
                <input
                  type="text"
                  value={formData.componentName}
                  onChange={(e) => setFormData({...formData, componentName: e.target.value})}
                  placeholder="e.g., Basic Salary, HRA, PF"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Component Type*</label>
                <select
                  value={formData.componentType}
                  onChange={(e) => setFormData({...formData, componentType: e.target.value})}
                  required
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount*</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              
            </div>

            <div className="form-group">
              <label>Calculation Formula</label>
              <input
                type="text"
                value={formData.calculationFormula}
                onChange={(e) => setFormData({...formData, calculationFormula: e.target.value})}
                placeholder="e.g., basic * 0.4, fixed amount"
              />
            </div>


            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Saving..." : (editingBreakup ? "Update" : "Create")}
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="breakups-list">
        <h3>Salary Components ({breakups.length})</h3>
        
        {loading && <div className="loading">Loading salary breakups...</div>}
        
        {!loading && breakups.length === 0 && (
          <div className="empty-state">
            <p>No salary breakups found. Add your first component above.</p>
          </div>
        )}
        
        {!loading && breakups.length > 0 && (
          <div className="breakups-grid">
            {breakups.map(breakup => (
              <div key={breakup.id} className="breakup-card">
                <div className="card-header">
                  <h4>{breakup.componentName}</h4>
                  <span 
                    className="component-type-badge"
                    style={{ backgroundColor: getComponentTypeColor(breakup.componentType) }}
                  >
                    {breakup.componentType}
                  </span>
                </div>
                
                <div className="card-content">
                  <div className="amount-display">
                    <span className="amount">Rs. {breakup.amount?.toLocaleString()}</span>
                  </div>
                  
                  {breakup.calculationFormula && (
                    <div className="formula">
                      <strong>Formula:</strong> {breakup.calculationFormula}
                    </div>
                  )}
                  
                </div>
                
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(breakup)} 
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(breakup.id)} 
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
