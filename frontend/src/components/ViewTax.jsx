import { useState } from "react";
import { getTax } from "../services/api";

export default function ViewTax() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await getTax(1);
    setData(res.data);
  };

  return (
    <div>
      <h3>View Tax</h3>
      <button onClick={fetchData}>Load</button>

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}