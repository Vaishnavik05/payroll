import React, { useState } from "react";
import { getPayroll } from "../services/api";

export default function ViewPayroll() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await getPayroll(id);
    const json = await res.json();
    setData(json);
  };

  return (
    <div>
      <h2>View Payroll</h2>

      <input placeholder="employeeId" onChange={e => setId(e.target.value)} />
      <button onClick={fetchData}>Get</button>

      {data && (
        <div>
          <p>Gross: {data.gross}</p>
          <p>Deductions: {data.totalDeductions}</p>
          <p>Net: {data.netSalary}</p>
        </div>
      )}
    </div>
  );
}