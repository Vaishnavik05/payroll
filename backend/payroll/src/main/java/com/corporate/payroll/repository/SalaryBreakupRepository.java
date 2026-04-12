package com.corporate.payroll.repository;

import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.entity.SalaryBreakup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalaryBreakupRepository extends JpaRepository<SalaryBreakup, Long> {
    List<SalaryBreakup> findByEmployeePayroll(EmployeePayroll employeePayroll);
}
