import { useState } from "react";
import { getEmployeePayroll } from "../services/api";

export default function ViewPayroll() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await getEmployeePayroll(id);
    setData(res.data);
  };

  return (
    <div>
      <h3>View Payroll</h3>

      <input placeholder="Employee ID" onChange={(e)=>setId(e.target.value)}/>
      <button onClick={fetchData}>Load</button>

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}