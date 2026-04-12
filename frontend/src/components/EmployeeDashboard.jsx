import ViewPayroll from "./ViewPayroll";
import ViewTax from "./ViewTax";

export default function EmployeeDashboard() {
  return (
    <div>
      <h1>Employee Dashboard</h1>
      <ViewPayroll />
      <ViewTax />
    </div>
  );
}