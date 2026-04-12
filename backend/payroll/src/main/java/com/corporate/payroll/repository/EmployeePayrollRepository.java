package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.PayrollCycle;
import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.entity.User;
import java.util.List;
import java.util.Optional;
public interface EmployeePayrollRepository extends JpaRepository<EmployeePayroll, Long> {
    List<EmployeePayroll> findByPayrollCycle(PayrollCycle payrollCycle);
    List<EmployeePayroll> findByPayrollCycleId(Long payrollCycleId);
    List<EmployeePayroll> findByEmployee_Id(Long employeeId);
    Optional<EmployeePayroll> findByEmployeeAndPayrollCycle(User employee, PayrollCycle payrollCycle);
    boolean existsByEmployeeAndPayrollCycle(User employee, PayrollCycle payrollCycle);
}