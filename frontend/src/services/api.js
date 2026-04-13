import axios from "axios";
import { handleApiError, showErrorNotification } from './errorHandler';
import './errorHandler.css';

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Add response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorInfo = handleApiError(error);
    showErrorNotification(errorInfo);
    return Promise.reject(error);
  }
);

export const createUser = (data) => API.post("/users", data);
export const getUsers = () => API.get("/users");
export const getUserByEmployeeCode = (employeeCode) => API.get(`/users/employee-code/${employeeCode}`);

export const createSalary = (data) => API.post("/salary-structures", data);
export const getSalaryByEmployee = (id) =>
  API.get(`/salary-structures/employee/${id}`);

export const createPayroll = (data) => API.post("/payroll-cycles", data);
export const processPayroll = (id) =>
  API.put(`/payroll-cycles/${id}/process`);
export const completePayroll = (id) =>
  API.put(`/payroll-cycles/${id}/complete`);

export const getPayrolls = () => API.get("/payroll-cycles");
export const getAllPayrolls = () => API.get("/employee-payrolls/all");
export const getPayrollSummary = () => API.get("/employee-payrolls/summary");

export const getEmployeePayroll = (id) =>
  API.get(`/payslips/employee/${id}`);

export const getTax = (id) => API.get(`/tax/employee/${id}`);

export const createDeductionRule = (data) => API.post("/deduction-rules", data);
export const getDeductionRules = () => API.get("/deduction-rules");
export const updateDeductionRule = (id, data) => API.put(`/deduction-rules/${id}`, data);
export const deleteDeductionRule = (id) => API.delete(`/deduction-rules/${id}`);

export const getTaxComputationsByEmployee = (code, year) =>
  year
    ? API.get(`/tax-computations/employee/${code}/financial-year/${year}`)
    : API.get(`/tax-computations/employee/${code}`);

export const getEmployees = () => API.get("/users");
export const getEmployeePayrollByEmployeeAndPayroll = (employeeId, payrollCycleId) => API.get(`/employee-payrolls/employee/${employeeId}/payroll-cycle/${payrollCycleId}`);
export const createEmployeePayroll = (data) => API.post("/employee-payrolls", data);
export const processPayrollPayout = (payrollId, data) => API.post(`/payroll-cycles/${payrollId}/payout`, data);

export const getTaxComputationsByEmployeeAndFinancialYear = (employeeCode, financialYear) => 
  API.get(`/tax-computations/employee/${employeeCode}/financial-year/${financialYear}`);

export const getLatestTaxComputationByEmployee = (code) =>
  API.get(`/tax-computations/employee/${code}/latest`);

export const getTaxSummaryByFinancialYear = (financialYear) => API.get(`/tax-computations/summary/financial-year/${financialYear}`);

export const createTaxComputation = (data) => API.post("/tax-computations", data);
export const createTaxComputationForEmployee = (employeeCode, data) => API.post(`/tax-computations/employee/${employeeCode}`, data);

export const getSalaryBreakups = () => API.get("/salary-breakup");
export const getSalaryBreakupById = (id) => API.get(`/salary-breakup/${id}`);
export const getSalaryBreakupByEmployeePayroll = (employeePayrollId) => API.get(`/salary-breakup/employee-payroll/${employeePayrollId}`);
export const getSalaryBreakupByEmployee = (employeeId) => API.get(`/salary-breakup/employee/${employeeId}`);
export const getSalaryBreakupByPayrollCycle = (payrollCycleId) => API.get(`/salary-breakup/payroll-cycle/${payrollCycleId}`);
export const createSalaryBreakup = (data) => API.post("/salary-breakup", data);
export const createSalaryBreakups = (data) => API.post("/salary-breakup/batch", data);
export const updateSalaryBreakup = (id, data) => API.put(`/salary-breakup/${id}`, data);
export const deleteSalaryBreakup = (id) => API.delete(`/salary-breakup/${id}`);
export const deleteSalaryBreakupByEmployeePayroll = (employeePayrollId) => API.delete(`/salary-breakup/employee-payroll/${employeePayrollId}`);

export const getDashboardStats = () => API.get("/dashboard/stats");
export const getRecentActivity = () => API.get("/dashboard/recent-activity");

export const updatePayrollTotals = () => API.post("/payroll/update-totals");
export const getEmployeePayrollsByPayrollCycle = (payrollCycleId) => API.get(`/employee-payrolls/payroll-cycle/${payrollCycleId}`);
export const cancelPayroll = (cycleId) => API.post(`/payroll/cancel/${cycleId}`);
export const markEmployeeLeftOut = (data) => API.post(`/payroll/mark-left-out`, data);
export const cleanupDuplicatePayslips = () => API.post('/payroll/cleanup-duplicates');
export const downloadPayslipPdf = (payrollId) => API.get(`/employee-payrolls/${payrollId}/download-pdf`, {
  responseType: 'blob'
});

// Tax Processing APIs
export const processTaxComputations = (financialYear) => API.post(`/tax-processing/process/${financialYear}`);
export const processCurrentYearTaxComputations = () => API.post('/tax-processing/process-current-year');
export const getTaxSummary = (financialYear) => API.get(`/tax-processing/summary/${financialYear}`);
export const getCurrentYearTaxSummary = () => API.get('/tax-processing/summary/current-year');
export const testTaxService = () => API.get('/tax-processing/test');

export default API;