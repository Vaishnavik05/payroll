import React, { useState } from "react";
import "./App.css";
import CreateUser from "./components/CreateUser";
import CreateSalary from "./components/CreateSalary";
import CreatePayroll from "./components/CreatePayroll";
import ProcessPayroll from "./components/ProcessPayroll";
import ViewPayroll from "./components/ViewPayroll";

const sections = [
  { name: "Create User", component: <CreateUser /> },
  { name: "Create Salary", component: <CreateSalary /> },
  { name: "Create Payroll Cycle", component: <CreatePayroll /> },
  { name: "Process Payroll", component: <ProcessPayroll /> },
  { name: "View Payroll", component: <ViewPayroll /> }
];

function App() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Payroll Dashboard</h2>
        <nav>
          {sections.map((section, idx) => (
            <button
              key={section.name}
              className={activeSection === idx ? "active" : ""}
              onClick={() => setActiveSection(idx)}
            >
              {section.name}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <h1>{sections[activeSection].name}</h1>
        <div className="card">{sections[activeSection].component}</div>
      </main>
    </div>
  );
}

export default App;