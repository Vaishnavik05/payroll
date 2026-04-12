import { useState } from "react";
import { createPayroll } from "../services/api";

export default function CreatePayroll() {
  const [data, setData] = useState({
    month: "",
    year: "",
  });

  const submit = async () => {
    await createPayroll(data);
    alert("Payroll Created");
  };

  return (
    <div>
      <h3>Create Payroll Cycle</h3>

      <input placeholder="Month" onChange={(e)=>setData({...data, month:e.target.value})}/>
      <input placeholder="Year" onChange={(e)=>setData({...data, year:e.target.value})}/>

      <button onClick={submit}>Create</button>
    </div>
  );
}