import { useState, useEffect } from "react";
import CreateSalary from "./CreateSalary";
import UpdateSalary from "./UpdateSalary";
import ViewSalaryStructures from "./ViewSalaryStructures";
import DeductionRuleForm from "./DeductionRuleForm";
import { getUsers, getSalaryByEmployee } from "../services/api";
import "./HRDashboard.css";

export default function HRDashboard() {
  const [activeForm, setActiveForm] = useState("");
  const [viewMode, setViewMode] = useState(""); // employees, departments, salaries, pending
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    averageSalary: 0,
    pendingSalaries: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await getUsers();
      const employees = response.data;
      
      const totalEmployees = employees.length;
      const totalDepartments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].length;
      
      // Calculate actual average salary from salary structures
      let totalSalary = 0;
      let employeesWithSalary = 0;
      
      for (const employee of employees) {
        try {
          const salaryResponse = await getSalaryByEmployee(employee.id);
          const salaryStructures = salaryResponse.data;
          
          if (salaryStructures && salaryStructures.length > 0) {
            // Get the latest salary structure (first one in array)
            const latestSalary = salaryStructures[0];
            const totalMonthlySalary = 
              (latestSalary.basic || 0) + 
              (latestSalary.hra || 0) + 
              (latestSalary.da || 0) + 
              (latestSalary.specialAllowance || 0) + 
              (latestSalary.bonus || 0) + 
              (latestSalary.lta || 0);
            
            totalSalary += totalMonthlySalary;
            employeesWithSalary++;
          }
        } catch (salaryErr) {
          console.log(`No salary structure found for employee ${employee.id}`);
        }
      }
      
      const averageSalary = employeesWithSalary > 0 ? Math.round(totalSalary / employeesWithSalary) : 0;
      
      setStats({
        totalEmployees: totalEmployees,
        totalDepartments: totalDepartments,
        averageSalary: averageSalary,
        pendingSalaries: Math.floor(totalEmployees * 0.1)
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleStatClick = async (type) => {
    setViewMode(type);
    setActiveForm("");
    setLoading(true);
    
    try {
      switch(type) {
        case "employees":
          await fetchEmployees();
          break;
        case "departments":
          await fetchDepartments();
          break;
        case "salaries":
          await fetchSalaryStructures();
          break;
        case "pending":
          await fetchPendingSalaries();
          break;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getUsers();
      setEmployees(response.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await getUsers();
      const employees = response.data || [];
      const deptMap = new Map();
      
      employees.forEach(emp => {
        if (emp.department) {
          if (!deptMap.has(emp.department)) {
            deptMap.set(emp.department, {
              name: emp.department,
              employeeCount: 0,
              employees: []
            });
          }
          const dept = deptMap.get(emp.department);
          dept.employeeCount++;
          dept.employees.push(emp);
        }
      });
      
      setDepartments(Array.from(deptMap.values()));
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchSalaryStructures = async () => {
    try {
      const response = await getUsers();
      const employees = response.data || [];
      const allSalaryStructures = [];
      
      for (const employee of employees) {
        try {
          const salaryResponse = await getSalaryByEmployee(employee.id);
          const structures = salaryResponse.data || [];
          
          structures.forEach(structure => {
            allSalaryStructures.push({
              ...structure,
              employeeName: employee.name,
              employeeCode: employee.employeeCode,
              department: employee.department
            });
          });
        } catch (err) {
          console.log(`No salary structure for employee ${employee.id}`);
        }
      }
      
      setSalaryStructures(allSalaryStructures);
    } catch (err) {
      console.error("Error fetching salary structures:", err);
    }
  };

  const fetchPendingSalaries = async () => {
    try {
      const response = await getUsers();
      const employees = response.data || [];
      const pendingEmployees = [];
      
      for (const employee of employees) {
        try {
          await getSalaryByEmployee(employee.id);
        } catch (err) {
          pendingEmployees.push(employee);
        }
      }
      
      setEmployees(pendingEmployees);
    } catch (err) {
      console.error("Error fetching pending salaries:", err);
    }
  };

  const goBack = () => {
    setViewMode("");
  };

  const renderForm = () => {
    switch(activeForm) {
      case "create":
        return <CreateSalary />;
      case "update":
        return <UpdateSalary />;
      case "view":
        return <ViewSalaryStructures />;
      case "deduction":
        return <DeductionRuleForm />;
      default:
        return null;
    }
  };

  const renderEmployeesList = () => {
    return (
      <div className="data-view">
        <div className="data-header">
          <button className="back-btn" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <h3>All Employees ({employees.length})</h3>
        </div>
        
        {loading ? (
          <div className="loading">Loading employees...</div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee Code</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.employeeCode}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department || 'N/A'}</td>
                    <td>{employee.role}</td>
                    <td>
                      <span className="status-badge active">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentsList = () => {
    return (
      <div className="data-view">
        <div className="data-header">
          <button className="back-btn" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <h3>Departments ({departments.length})</h3>
        </div>
        
        {loading ? (
          <div className="loading">Loading departments...</div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Employee Count</th>
                  <th>Employees</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => (
                  <tr key={index}>
                    <td>{dept.name}</td>
                    <td>{dept.employeeCount}</td>
                    <td>
                      <div className="employee-list">
                        {dept.employees.slice(0, 3).map(emp => emp.name).join(', ')}
                        {dept.employees.length > 3 && ` +${dept.employees.length - 3} more`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSalaryStructuresList = () => {
    return (
      <div className="data-view">
        <div className="data-header">
          <button className="back-btn" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <h3>Salary Structures ({salaryStructures.length})</h3>
        </div>
        
        {loading ? (
          <div className="loading">Loading salary structures...</div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>DA</th>
                  <th>Special Allowance</th>
                  <th>Total Gross</th>
                  <th>Effective From</th>
                </tr>
              </thead>
              <tbody>
                {salaryStructures.map((structure, index) => {
                  const totalGross = (structure.basic || 0) + (structure.hra || 0) + 
                                   (structure.da || 0) + (structure.specialAllowance || 0) + 
                                   (structure.bonus || 0) + (structure.lta || 0);
                  return (
                    <tr key={index}>
                      <td>{structure.employeeName}</td>
                      <td>{structure.employeeCode}</td>
                      <td>{structure.department || 'N/A'}</td>
                      <td>Rs. {(structure.basic || 0).toLocaleString()}</td>
                      <td>Rs. {(structure.hra || 0).toLocaleString()}</td>
                      <td>Rs. {(structure.da || 0).toLocaleString()}</td>
                      <td>Rs. {(structure.specialAllowance || 0).toLocaleString()}</td>
                      <td>Rs. {totalGross.toLocaleString()}</td>
                      <td>{structure.effectiveFrom ? new Date(structure.effectiveFrom).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderPendingSalariesList = () => {
    return (
      <div className="data-view">
        <div className="data-header">
          <button className="back-btn" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <h3>Employees Without Salary Structure ({employees.length})</h3>
        </div>
        
        {loading ? (
          <div className="loading">Loading pending salaries...</div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee Code</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.employeeCode}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department || 'N/A'}</td>
                    <td>{employee.role}</td>
                    <td>
                      <button 
                        className="action-btn"
                        onClick={() => {
                          setActiveForm("create");
                          setViewMode("");
                        }}
                      >
                        Create Salary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderDataView = () => {
    switch(viewMode) {
      case "employees":
        return renderEmployeesList();
      case "departments":
        return renderDepartmentsList();
      case "salaries":
        return renderSalaryStructuresList();
      case "pending":
        return renderPendingSalariesList();
      default:
        return renderStats();
    }
  };

  const renderStats = () => {
    return (
      <div className="dashboard-stats">
        <h2>Dashboard Overview</h2>
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => handleStatClick("employees")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalEmployees}</h3>
              <p>Total Employees</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatClick("departments")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalDepartments}</h3>
              <p>Total Departments</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatClick("salaries")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Rs. {stats.averageSalary.toLocaleString()}</h3>
              <p>Average Salary</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatClick("pending")}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.pendingSalaries}</h3>
              <p>Pending Salaries</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hr-dashboard">
      <h1>HR Manager Dashboard</h1>
      
      <div className="nav-buttons">
        <button 
          className={`nav-btn ${activeForm === "create" ? "active" : ""}`}
          onClick={() => {
            setActiveForm(activeForm === "create" ? "" : "create");
            setViewMode("");
          }}
        >
          Create Salary Structure
        </button>
        <button 
          className={`nav-btn ${activeForm === "update" ? "active" : ""}`}
          onClick={() => {
            setActiveForm(activeForm === "update" ? "" : "update");
            setViewMode("");
          }}
        >
          Update Salary Structure
        </button>
        <button 
          className={`nav-btn ${activeForm === "view" ? "active" : ""}`}
          onClick={() => {
            setActiveForm(activeForm === "view" ? "" : "view");
            setViewMode("");
          }}
        >
          View Salary Structures
        </button>
        <button 
          className={`nav-btn ${activeForm === "deduction" ? "active" : ""}`}
          onClick={() => {
            setActiveForm(activeForm === "deduction" ? "" : "deduction");
            setViewMode("");
          }}
        >
          Manage Deduction Rules
        </button>
      </div>

      <div className="form-container">
        {viewMode ? renderDataView() : (activeForm ? renderForm() : renderStats())}
      </div>
    </div>
  );
}