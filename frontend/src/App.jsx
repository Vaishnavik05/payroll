import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import HRDashboard from "./components/HRDashboard";
import FinanceDashboard from "./components/FinanceDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="*" element={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              background: '#f8f9fa',
              fontFamily: 'Arial, sans-serif'
            }}>
              <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>404 - Page Not Found</h1>
              <p style={{ color: '#6c757d', textAlign: 'center', marginBottom: '30px' }}>
                The page you're looking for doesn't exist.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Go to Login
              </button>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;