import { processPayroll, completePayroll } from "../services/api";

export default function ProcessPayroll() {
  return (
    <div>
      <h3>Process Payroll</h3>

      <input id="pid" placeholder="Payroll ID" />

      <button onClick={() => processPayroll(document.getElementById("pid").value)}>
        Process
      </button>

      <button onClick={() => completePayroll(document.getElementById("pid").value)}>
        Complete
      </button>
    </div>
  );
}