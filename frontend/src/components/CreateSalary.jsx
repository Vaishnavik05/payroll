import React, { useState } from "react";
import { createSalary } from "../services/api";

export default function CreateSalary() {
  const [form, setForm] = useState({});

  return (
    <div>
      <h2>Create Salary</h2>

      <input placeholder="employeeId" onChange={e => setForm({...form, employeeId: e.target.value})} />
      <input placeholder="basic" onChange={e => setForm({...form, basic: e.target.value})} />
      <input placeholder="hra" onChange={e => setForm({...form, hra: e.target.value})} />
      <input placeholder="da" onChange={e => setForm({...form, da: e.target.value})} />
      <input placeholder="specialAllowance" onChange={e => setForm({...form, specialAllowance: e.target.value})} />
      <input placeholder="bonus" onChange={e => setForm({...form, bonus: e.target.value})} />
      <input placeholder="lta" onChange={e => setForm({...form, lta: e.target.value})} />

      <input type="date" onChange={e => setForm({...form, effectiveFrom: e.target.value})} />
      <input type="date" onChange={e => setForm({...form, effectiveTo: e.target.value})} />

      <button onClick={() => createSalary(form)}>Save</button>
    </div>
  );
}