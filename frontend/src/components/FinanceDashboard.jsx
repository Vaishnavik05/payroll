import { useState, useEffect } from "react";
import CreatePayroll from "./CreatePayroll";
import ProcessPayroll from "./ProcessPayroll";
import { getPayrolls } from "../services/api";
import "./FinanceDashboard.css";

export default function FinanceDashboard() {
  const [activeForm, setActiveForm] = useState("");
  const [stats, setStats] = useState({
    totalPayrolls: 0,
    processedPayrolls: 0,
    draftPayrolls: 0,
    processingPayrolls: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [showFilteredView, setShowFilteredView] = useState(false);
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    fetchFinanceStats();
  }, []);

  const fetchFinanceStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching finance stats...");
      const response = await getPayrolls();
      console.log("API response:", response);
      const payrolls = response.data || [];
      
      const totalPayrolls = payrolls.length;
      const processedPayrolls = payrolls.filter(p => p.status === 'COMPLETED').length;
      const draftPayrolls = payrolls.filter(p => p.status === 'DRAFT').length;
      const processingPayrolls = payrolls.filter(p => p.status === 'PROCESSING').length;
      const totalAmount = payrolls.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      
      setStats({
        totalPayrolls: totalPayrolls,
        processedPayrolls: processedPayrolls,
        draftPayrolls: draftPayrolls,
        processingPayrolls: processingPayrolls,
        totalAmount: totalAmount
      });
      console.log("Stats updated:", {
        totalPayrolls, processedPayrolls, draftPayrolls, processingPayrolls, totalAmount
      });
    } catch (err) {
      console.error("Error fetching finance stats:", err);
      setError(err.message || "Failed to fetch finance data");
      setStats({
        totalPayrolls: 0,
        processedPayrolls: 0,
        draftPayrolls: 0,
        processingPayrolls: 0,
        totalAmount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatCardClick = async (type) => {
    setLoading(true);
    try {
      const response = await getPayrolls();
      const allPayrolls = response.data || [];
      let filtered = [];
      
      switch(type) {
        case 'total':
          filtered = allPayrolls;
          break;
        case 'completed':
          filtered = allPayrolls.filter(p => p.status === 'COMPLETED');
          break;
        case 'draft':
          filtered = allPayrolls.filter(p => p.status === 'DRAFT');
          break;
        case 'processing':
          filtered = allPayrolls.filter(p => p.status === 'PROCESSING');
          break;
        default:
          filtered = allPayrolls;
      }
      
      setFilteredPayrolls(filtered);
      setFilterType(type);
      setShowFilteredView(true);
      setActiveForm("");
    } catch (err) {
      setError("Failed to fetch payroll cycles: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowFilteredView(false);
    setFilteredPayrolls([]);
    setFilterType("");
  };

  const renderFilteredView = () => {
    const getFilterTitle = () => {
      switch(filterType) {
        case 'total':
          return 'All Payroll Cycles';
        case 'completed':
          return 'Completed Payroll Cycles';
        case 'draft':
          return 'Draft Payroll Cycles';
        case 'processing':
          return 'Processing Payroll Cycles';
        default:
          return 'Payroll Cycles';
      }
    };

    const getStatusColor = (status) => {
      switch(status) {
        case 'COMPLETED':
          return '#10b981';
        case 'DRAFT':
          return '#6b7280';
        case 'PROCESSING':
          return '#f59e0b';
        default:
          return '#6b7280';
      }
    };

    return (
      <div className="filtered-payroll-view">
        <div className="filtered-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <h2>{getFilterTitle()}</h2>
          <div className="result-count">{filteredPayrolls.length} result{filteredPayrolls.length !== 1 ? 's' : ''}</div>
        </div>
        
        {loading && (
          <div className="loading-message">Loading payroll cycles...</div>
        )}
        
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={() => handleStatCardClick(filterType)} className="retry-btn">Retry</button>
          </div>
        )}
        
        {!loading && !error && filteredPayrolls.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 9l-3-3"/>
                <path d="M21 12v-1a2 2 0 0 0-2-2h-3"/>
                <path d="M8 21H4"/>
              </svg>
            </div>
            <h3>No payroll cycles found</h3>
            <p>No payroll cycles match the selected filter.</p>
          </div>
        )}
        
        {!loading && !error && filteredPayrolls.length > 0 && (
          <div className="payroll-list">
            {filteredPayrolls.map(payroll => (
              <div key={payroll.id} className="payroll-item">
                <div className="payroll-header">
                  <div className="payroll-id">ID: {payroll.id}</div>
                  <div 
                    className="payroll-status" 
                    style={{ backgroundColor: getStatusColor(payroll.status) }}
                  >
                    {payroll.status}
                  </div>
                </div>
                <div className="payroll-details">
                  <div className="payroll-period">
                    <strong>Period:</strong> {payroll.month}/{payroll.year}
                  </div>
                  <div className="payroll-dates">
                    <div><strong>Start:</strong> {new Date(payroll.startDate).toLocaleDateString()}</div>
                    <div><strong>End:</strong> {new Date(payroll.endDate).toLocaleDateString()}</div>
                    <div><strong>Payment:</strong> {new Date(payroll.paymentDate).toLocaleDateString()}</div>
                  </div>
                  {payroll.totalAmount > 0 && (
                    <div className="payroll-amount">
                      <strong>Total Amount:</strong> Rs. {payroll.totalAmount.toLocaleString()}
                    </div>
                  )}
                  {payroll.totalEmployees > 0 && (
                    <div className="payroll-employees">
                      <strong>Employees:</strong> {payroll.totalEmployees}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (loading) {
      return (
        <div className="dashboard-stats">
          <h2>Finance Overview - All Users</h2>
          <div className="loading-message">Loading finance data...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-stats">
          <h2>Finance Overview - All Users</h2>
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={fetchFinanceStats} className="retry-btn">Retry</button>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-stats">
        <h2>Finance Overview - All Users</h2>
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => handleStatCardClick('total')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalPayrolls}</h3>
              <p>Total Cycles</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('completed')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 9l-3-3"/>
                <path d="M21 12v-1a2 2 0 0 0-2-2h-3"/>
                <path d="M8 21H4"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.processedPayrolls}</h3>
              <p>Completed</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('draft')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.draftPayrolls}</h3>
              <p>Draft</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('processing')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.processingPayrolls}</h3>
              <p>Processing</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => handleStatCardClick('total')}>
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Rs. {stats.totalAmount.toLocaleString()}</h3>
              <p>Total Amount</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="finance-dashboard">
      <h1>Finance Dashboard</h1>
      
      <div className="nav-buttons">
        <button 
          className={`nav-btn ${activeForm === "create" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "create" ? "" : "create")}
        >
          Create Payroll
        </button>
        <button 
          className={`nav-btn ${activeForm === "process" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "process" ? "" : "process")}
        >
          Process Payroll
        </button>
      </div>
    </div>
  );

  const renderForm = () => {
    switch(activeForm) {
      case "create":
        return <CreatePayroll />;
      case "process":
        return <ProcessPayroll />;
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    if (showFilteredView) {
      return renderFilteredView();
    }
    
    if (activeForm) {
      return renderForm();
    }
    
    return renderStats();
  };

  return (
    <div className="finance-dashboard">
      <h1>Finance Dashboard</h1>
      
      <div className="nav-buttons">
        <button 
          className={`nav-btn ${activeForm === "create" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "create" ? "" : "create")}
        >
          Create Payroll
        </button>
        <button 
          className={`nav-btn ${activeForm === "process" ? "active" : ""}`}
          onClick={() => setActiveForm(activeForm === "process" ? "" : "process")}
        >
          Process Payroll
        </button>
      </div>

      <div className="form-container">
        {renderMainContent()}
      </div>
    </div>
  );
}