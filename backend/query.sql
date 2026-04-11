CREATE DATABASE payroll;
USE payroll;

CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('ADMIN','HR_MANAGER','FINANCE','EMPLOYEE') NOT NULL,
    department VARCHAR(100),
    joining_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE salary_structure (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT,
    basic DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2),
    da DECIMAL(10,2),
    special_allowance DECIMAL(10,2),
    bonus DECIMAL(10,2),
    effective_from DATE,
    effective_to DATE,
    FOREIGN KEY (employee_id) REFERENCES user(id)
);


CREATE TABLE deduction_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    percentage DECIMAL(5,2),
    fixed_amount DECIMAL(10,2),
    max_limit DECIMAL(10,2),
    applicable_from DATE
);


CREATE TABLE payroll_cycle (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    month INT NOT NULL,
    year INT NOT NULL,
    start_date DATE,
    end_date DATE,
    payment_date DATE,
    status ENUM('DRAFT','PROCESSING','COMPLETED','CANCELLED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE employee_payroll (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT,
    payroll_cycle_id BIGINT,
    gross DECIMAL(10,2),
    total_deductions DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    status ENUM('PENDING','PROCESSED','FAILED') DEFAULT 'PENDING',
    bank_reference VARCHAR(100),
    paid_at TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES user(id),
    FOREIGN KEY (payroll_cycle_id) REFERENCES payroll_cycle(id)
);


CREATE TABLE salary_breakup (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_payroll_id BIGINT,
    component_name VARCHAR(50),
    component_type ENUM('EARNING','DEDUCTION'),
    amount DECIMAL(10,2),
    calculation_formula VARCHAR(255),
    FOREIGN KEY (employee_payroll_id) REFERENCES employee_payroll(id)
);


CREATE TABLE tax_computation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT,
    financial_year VARCHAR(10),
    total_income DECIMAL(12,2),
    deductions DECIMAL(12,2),
    taxable_income DECIMAL(12,2),
    tax_payable DECIMAL(12,2),
    cess DECIMAL(10,2),
    total_tax DECIMAL(12,2),
    tds_deducted DECIMAL(12,2),
    status ENUM('PENDING','COMPUTED','FILED'),
    FOREIGN KEY (employee_id) REFERENCES user(id)
);