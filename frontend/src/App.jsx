import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import HRDashboard from "./components/HRDashboard";
import FinanceDashboard from "./components/FinanceDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;