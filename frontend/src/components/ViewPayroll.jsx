import { useState } from "react";
import { getEmployeePayroll } from "../services/api";

export default function ViewPayroll() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await getEmployeePayroll(1);
    setData(res.data);
  };

  return (
    <div>
      <h3>View Payroll</h3>
      <button onClick={fetchData}>Load</button>

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}