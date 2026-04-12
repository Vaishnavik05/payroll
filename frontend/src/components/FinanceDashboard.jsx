import CreatePayroll from "./CreatePayroll";
import ProcessPayroll from "./ProcessPayroll";

export default function FinanceDashboard() {
  return (
    <div>
      <h1>Finance Dashboard</h1>
      <CreatePayroll />
      <ProcessPayroll />
    </div>
  );
}