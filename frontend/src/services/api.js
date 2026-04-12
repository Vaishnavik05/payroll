import axios from "axios";

const API_BASE = "http://localhost:8080/api"; // Change port if your backend runs on a different port

export async function createUser(data) {
  return axios.post(`${API_BASE}/users`, data);
}

export async function createSalary(data) {
  return axios.post(`${API_BASE}/salary-structures`, data);
}

export async function createPayrollCycle(data) {
  return axios.post(`${API_BASE}/payroll-cycle`, data);
}

export async function processPayroll(id) {
  return axios.put(`${API_BASE}/payroll-cycle/${id}/process`);
}

export async function getPayroll(employeeId) {
  // Adjust endpoint if needed
  return axios.get(`${API_BASE}/employee-payrolls/${employeeId}`);
}