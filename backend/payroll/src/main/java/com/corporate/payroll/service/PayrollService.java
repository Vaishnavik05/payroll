package com.corporate.payroll.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import com.corporate.payroll.entity.*;
import com.corporate.payroll.enums.PayrollStatus;
import com.corporate.payroll.enums.PayoutStatus;
import com.corporate.payroll.repository.*;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private final UserRepository userRepo;
    private final SalaryStructureRepository salaryRepo;
    private final PayrollCycleRepository cycleRepo;
    private final EmployeePayrollRepository payrollRepo;

    public void processPayroll(Long cycleId) {
        PayrollCycle cycle = cycleRepo.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Payroll cycle not found"));
        if (cycle.getStatus() != PayrollStatus.DRAFT) {
            throw new RuntimeException("Payroll already processed");
        }
        cycle.setStatus(PayrollStatus.PROCESSING);
        cycleRepo.save(cycle);
        List<User> employees = userRepo.findAll();
        for (User emp : employees) {
            if (!emp.isActive()) continue;
            List<SalaryStructure> structures = salaryRepo.findByEmployee(emp);
            if (structures == null || structures.isEmpty()) continue;
            SalaryStructure s = structures.stream()
                    .max((a, b) -> a.getEffectiveFrom().compareTo(b.getEffectiveFrom()))
                    .orElse(null);
            if (s == null) continue;
            double gross = s.getBasic() + s.getHra() + s.getDa() + s.getSpecialAllowance() + s.getBonus();
            double pf = 0.12 * (s.getBasic() + s.getDa());
            double esi = (gross <= 21000) ? 0.0075 * gross : 0;
            double pt = 200;
            double annual = gross * 12;
            double tax = calculateTax(annual);
            double tds = tax / 12;
            double deductions = pf + esi + pt + tds;
            double net = gross - deductions;
            EmployeePayroll payroll = new EmployeePayroll();
            payroll.setEmployee(emp);
            payroll.setPayrollCycle(cycle);
            payroll.setGross(gross);
            payroll.setTotalDeductions(deductions);
            payroll.setNetSalary(net);
            payroll.setBasic(s.getBasic());
            payroll.setHra(s.getHra());
            payroll.setDa(s.getDa());
            payroll.setSpecialAllowance(s.getSpecialAllowance());
            payroll.setBonus(s.getBonus());
            payroll.setLta(s.getLta());
            payroll.setStatus(PayoutStatus.PROCESSED);
            payroll.setBankReference("BANKREF" + System.currentTimeMillis());
            payroll.setPaidAt(java.time.LocalDateTime.now());

            payrollRepo.save(payroll);
        }
        cycle.setStatus(PayrollStatus.COMPLETED);
        cycleRepo.save(cycle);
    }
    private double calculateTax(double income) {
        if (income <= 250000) return 0;
        else if (income <= 500000) return income * 0.05;
        else if (income <= 1000000) return income * 0.2;
        else return income * 0.3;
    }

    public double getEmployeeTax(Long employeeId) {
        User employee = userRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + employeeId));
        List<SalaryStructure> structures = salaryRepo.findByEmployee(employee);
        if (structures == null || structures.isEmpty()) {
            throw new RuntimeException("No salary structure found for employee " + employeeId);
        }
        SalaryStructure s = structures.stream()
                .max((a, b) -> a.getEffectiveFrom().compareTo(b.getEffectiveFrom()))
                .orElse(null);
        if (s == null) {
            throw new RuntimeException("No valid salary structure found for employee " + employeeId);
        }
        double gross = s.getBasic() + s.getHra() + s.getDa() + s.getSpecialAllowance() + s.getBonus();
        double annual = gross * 12;
        return calculateTax(annual); // Use your existing tax calculation logic
    }
}