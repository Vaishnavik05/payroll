import React, { useState } from "react";
import { createUser } from "../services/api";

export default function CreateUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeCode: "",
    role: "EMPLOYEE",
    department: "",
    joiningDate: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.placeholder]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      alert("User Created");
    } catch (err) {
      alert("Error creating user");
    }
  };

  return (
    <div>
      <h2>Create User</h2>

      <form onSubmit={handleSubmit}>
        <input placeholder="name" onChange={handleChange} />
        <input placeholder="email" onChange={handleChange} />
        <input placeholder="employeeCode" onChange={handleChange} />
        <input placeholder="department" onChange={handleChange} />
        <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option>EMPLOYEE</option>
          <option>HR_MANAGER</option>
          <option>FINANCE</option>
        </select>
        <input type="date" onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}