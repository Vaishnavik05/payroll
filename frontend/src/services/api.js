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

export const getEmployeePayroll = (id) =>
  API.get(`/payslips/employee/${id}`);

export const getTax = (id) => API.get(`/tax/employee/${id}`);

export const createDeductionRule = (data) => API.post("/deduction-rules", data);
export const getDeductionRules = () => API.get("/deduction-rules");
export const updateDeductionRule = (id, data) => API.put(`/deduction-rules/${id}`, data);
export const deleteDeductionRule = (id) => API.delete(`/deduction-rules/${id}`);

export const getTaxComputationsByEmployee = (employeeId) => API.get(`/tax-computations/employee/${employeeId}`);
export const getTaxComputationsByEmployeeAndFinancialYear = (employeeId, financialYear) => API.get(`/tax-computations/employee/${employeeId}/financial-year/${financialYear}`);
export const getLatestTaxComputationByEmployee = (employeeId) => API.get(`/tax-computations/employee/${employeeId}/latest`);
export const getTaxSummaryByFinancialYear = (financialYear) => API.get(`/tax-computations/summary/financial-year/${financialYear}`);

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

export default API;