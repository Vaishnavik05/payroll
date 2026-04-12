import { useState } from "react";
import { createSalary } from "../services/api";

export default function CreateSalary() {
  const [data, setData] = useState({
    employeeId: "",
    basicSalary: "",
    hra: "",
    da: "",
    specialAllowance: "",
  });

  const submit = async () => {
    await createSalary(data);
    alert("Salary Added");
  };

  return (
    <div>
      <h3>Create Salary Structure</h3>

      <input placeholder="Employee ID" onChange={(e)=>setData({...data, employeeId:e.target.value})}/>
      <input placeholder="Basic" onChange={(e)=>setData({...data, basicSalary:e.target.value})}/>
      <input placeholder="HRA" onChange={(e)=>setData({...data, hra:e.target.value})}/>
      <input placeholder="DA" onChange={(e)=>setData({...data, da:e.target.value})}/>
      <input placeholder="Special Allowance" onChange={(e)=>setData({...data, specialAllowance:e.target.value})}/>

      <button onClick={submit}>Save</button>
    </div>
  );
}