package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.PayrollCycle;
import com.corporate.payroll.entity.EmployeePayroll;
import java.util.List;
public interface EmployeePayrollRepository extends JpaRepository<EmployeePayroll, Long> {
    List<EmployeePayroll> findByPayrollCycle(PayrollCycle payrollCycle);
    List<EmployeePayroll> findByEmployee_Id(Long employeeId);
}
