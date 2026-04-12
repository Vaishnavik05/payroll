import { useState } from "react";
import { createUser } from "../services/api";

export default function CreateUser() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
  });

  const handleSubmit = async () => {
    await createUser(user);
    alert("User Created");
  };

  return (
    <div>
      <h3>Create User</h3>
      <input
        placeholder="Name"
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />
      <input
        placeholder="Email"
        onChange={(e) => setUser({ ...user, email: e.target.value })}
      />
      <input
        placeholder="Role"
        onChange={(e) => setUser({ ...user, role: e.target.value })}
      />
      <button onClick={handleSubmit}>Create</button>
    </div>
  );
}