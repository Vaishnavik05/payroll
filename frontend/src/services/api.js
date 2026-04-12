import axios from "axios";

const BASE = "http://localhost:8080/api";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// ─── Users ───────────────────────────────────────────────
export const createUser = (data) => api.post("/users", data);
export const getUsersByRole = (role) => api.get(`/users?role=${role}`);
export const getUsersByDept = (dept) => api.get(`/users?department=${dept}`);

// ─── Salary Structure ─────────────────────────────────────
export const createSalaryStructure = (data) => api.post("/salary-structures", data);
export const getSalaryByEmployee = (empId) => api.get(`/salary-structures/employee/${empId}`);
export const updateSalaryStructure = (id, data) => api.put(`/salary-structures/${id}`, data);

// ─── Payroll Cycle ────────────────────────────────────────
export const createPayrollCycle = (data) => api.post("/payroll-cycles", data);
export const processPayrollCycle = (id) => api.put(`/payroll-cycles/${id}/process`);
export const completePayrollCycle = (id) => api.put(`/payroll-cycles/${id}/complete`);
export const cancelPayrollCycle = (id) => api.put(`/payroll-cycles/${id}/cancel`);
export const getPayrollCycles = () => api.get("/payroll-cycles");

// ─── Employee Payroll ─────────────────────────────────────
export const getEmployeePayroll = (empId) => api.get(`/employee-payrolls/employee/${empId}`);
export const getPayrollByCycle = (cycleId) => api.get(`/employee-payrolls/cycle/${cycleId}`);
export const markPayoutProcessed = (payrollId) => api.put(`/employee-payrolls/${payrollId}/payout`);

// ─── Tax Computation ──────────────────────────────────────
export const getTaxComputation = (empId, year) => api.get(`/tax-computations/employee/${empId}?year=${year}`);
export const computeTax = (empId, year) => api.post(`/tax-computations/compute`, { employeeId: empId, financialYear: year });

// ─── Deduction Rules ──────────────────────────────────────
export const getDeductionRules = () => api.get("/deduction-rules");
export const createDeductionRule = (data) => api.post("/deduction-rules", data);