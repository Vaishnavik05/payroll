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
  API.get(`/employee-payrolls/employee/${id}`);

export const getTax = (id) => API.get(`/tax/employee/${id}`);

export default API;