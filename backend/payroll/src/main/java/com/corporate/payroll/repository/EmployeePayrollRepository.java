package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.EmployeePayroll;

public interface EmployeePayrollRepository extends JpaRepository<EmployeePayroll, Long> {
    
}
