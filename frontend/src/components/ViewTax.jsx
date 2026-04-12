import { useState } from "react";
import { getTax } from "../services/api";

export default function ViewTax() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await getTax(id);
    setData(res.data);
  };

  return (
    <div>
      <h3>View Tax</h3>

      <input placeholder="Employee ID" onChange={(e)=>setId(e.target.value)}/>
      <button onClick={fetchData}>Load</button>

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}