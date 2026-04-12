import React, { useState } from "react";
import { createPayrollCycle } from "../services/api";

export default function CreatePayroll() {
  const [form, setForm] = useState({});

  return (
    <div>
      <h2>Payroll Cycle</h2>

      <input placeholder="month" onChange={e => setForm({...form, month: e.target.value})} />
      <input placeholder="year" onChange={e => setForm({...form, year: e.target.value})} />

      <input type="date" onChange={e => setForm({...form, startDate: e.target.value})} />
      <input type="date" onChange={e => setForm({...form, endDate: e.target.value})} />
      <input type="date" onChange={e => setForm({...form, paymentDate: e.target.value})} />

      <button onClick={() => createPayrollCycle(form)}>Create</button>
    </div>
  );
}