import React, { useState } from "react";
import { processPayroll } from "../services/api";

export default function ProcessPayroll() {
  const [id, setId] = useState("");

  return (
    <div>
      <h2>Process Payroll</h2>

      <input placeholder="cycleId" onChange={e => setId(e.target.value)} />
      <button onClick={() => processPayroll(id)}>Process</button>
    </div>
  );
}