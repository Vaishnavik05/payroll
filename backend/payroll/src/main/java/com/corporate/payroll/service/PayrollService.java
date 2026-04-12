package com.corporate.payroll.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import com.corporate.payroll.entity.*;
import com.corporate.payroll.enums.PayrollStatus;
import com.corporate.payroll.enums.PayoutStatus;
import com.corporate.payroll.enums.ComponentType;
import com.corporate.payroll.enums.State;
import com.corporate.payroll.repository.*;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private final UserRepository userRepo;
    private final SalaryStructureRepository salaryRepo;
    private final PayrollCycleRepository cycleRepo;
    private final EmployeePayrollRepository payrollRepo;
    private final SalaryBreakupRepository salaryBreakupRepo;
    private final DeductionRuleRepository deductionRuleRepo;
    private final TaxComputationRepository taxComputationRepo;
    private final MinimumWageRepository minimumWageRepo;

    public void processPayroll(Long cycleId) {
        PayrollCycle cycle = cycleRepo.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Payroll cycle not found"));
        if (cycle.getStatus() != PayrollStatus.DRAFT) {
            throw new RuntimeException("Payroll already processed");
        }
        cycle.setStatus(PayrollStatus.PROCESSING);
        cycleRepo.save(cycle);
        
        // Cache deduction rules to avoid repeated database calls
        List<DeductionRule> deductionRules = deductionRuleRepo.findAll();
        
        List<User> employees = userRepo.findAll();
        for (User emp : employees) {
            if (!emp.isActive()) continue;
            List<SalaryStructure> structures = salaryRepo.findByEmployee(emp);
            if (structures == null || structures.isEmpty()) continue;
            SalaryStructure s = structures.stream()
                    .max((a, b) -> a.getEffectiveFrom().compareTo(b.getEffectiveFrom()))
                    .orElse(null);
            if (s == null) continue;
            double gross = (s.getBasic() != null ? s.getBasic() : 0) + 
                           (s.getHra() != null ? s.getHra() : 0) + 
                           (s.getDa() != null ? s.getDa() : 0) + 
                           (s.getSpecialAllowance() != null ? s.getSpecialAllowance() : 0) + 
                           (s.getBonus() != null ? s.getBonus() : 0);
            
            // Validate salary components
            if (gross <= 0) {
                System.out.println("WARNING: Invalid gross salary for employee " + emp.getEmployeeCode() + ": " + gross);
                continue;
            }
            
            // Validate minimum wage compliance
            validateMinimumWage(emp, gross);
            
            // Calculate deductions using cached rules
            double pf = calculateDeduction("Provident Fund", s.getBasic() + s.getDa(), deductionRules);
            double esi = calculateDeduction("Employee State Insurance", gross, deductionRules);
            double pt = calculateDeduction("Professional Tax", gross, deductionRules);
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
            
            createSalaryBreakup(salaryBreakupRepo, payroll, ComponentType.EARNING, "Basic Salary", s.getBasic());
            createSalaryBreakup(salaryBreakupRepo, payroll, ComponentType.EARNING, "HRA", s.getHra());
            createSalaryBreakup(salaryBreakupRepo, payroll, ComponentType.EARNING, "Dearness Allowance", s.getDa());
            createSalaryBreakup(salaryBreakupRepo, payroll, ComponentType.EARNING, "Special Allowance", s.getSpecialAllowance());
            createSalaryBreakup(salaryBreakupRepo, payroll, ComponentType.EARNING, "Bonus", s.getBonus());
            createSalaryBreakup(salaryBreakupRepo, payroll, ComponentType.EARNING, "Leave Travel Allowance", s.getLta());
            
            createDeductionRecord(deductionRuleRepo, payroll, "Provident Fund (PF)", pf);
            createDeductionRecord(deductionRuleRepo, payroll, "Employee State Insurance (ESI)", esi);
            createDeductionRecord(deductionRuleRepo, payroll, "Professional Tax", pt);
            createDeductionRecord(deductionRuleRepo, payroll, "Tax Deduction at Source (TDS)", tds);
            
            TaxComputation taxComputation = TaxComputation.builder()
                .employee(emp)
                .financialYear(cycle.getYear() + "-" + (cycle.getYear() + 1))
                .totalIncome(gross * 12)
                .annualIncome(annual)
                .taxableIncome(annual)
                .taxPayable(tax)
                .cess(0.0) // Can be calculated based on specific rules
                .totalTax(tax)
                .tdsDeducted(tds)
                .tdsPerMonth(tds)
                .otherDeductions(pf + esi + pt)
                .deductions(pf + esi + pt)
                .status("COMPUTED")
                .build();
            taxComputationRepo.save(taxComputation);
        }
        cycle.setStatus(PayrollStatus.COMPLETED);
        cycleRepo.save(cycle);
    }

    private void createSalaryBreakup(SalaryBreakupRepository repo, EmployeePayroll payroll, ComponentType componentType, String componentName, Double amount) {
        SalaryBreakup breakup = new SalaryBreakup();
        breakup.setEmployeePayroll(payroll);
        breakup.setComponentType(componentType);
        breakup.setComponentName(componentName);
        breakup.setAmount(amount);
        repo.save(breakup);
    }

    private void createDeductionRecord(DeductionRuleRepository deductionRepo, EmployeePayroll payroll, String ruleName, Double amount) {
        if (payroll == null || ruleName == null || amount == null) {
            System.out.println("WARNING: Invalid parameters for createDeductionRecord");
            return;
        }
        
        DeductionRule rule = deductionRepo.findAll().stream()
                .filter(r -> r.getName() != null && r.getName().equalsIgnoreCase(ruleName))
                .findFirst()
                .orElse(null);
        
        if (rule != null) {
            SalaryBreakup deduction = new SalaryBreakup();
            deduction.setEmployeePayroll(payroll);
            deduction.setComponentType(ComponentType.DEDUCTION);
            deduction.setComponentName(ruleName);
            deduction.setAmount(amount);
            deduction.setCalculationFormula(rule.getCalculationFormula());
            salaryBreakupRepo.save(deduction);
        } else {
            System.out.println("WARNING: No deduction rule found for " + ruleName);
        }
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
        double gross = (s.getBasic() != null ? s.getBasic() : 0) + 
                       (s.getHra() != null ? s.getHra() : 0) + 
                       (s.getDa() != null ? s.getDa() : 0) + 
                       (s.getSpecialAllowance() != null ? s.getSpecialAllowance() : 0) + 
                       (s.getBonus() != null ? s.getBonus() : 0);
        double annual = gross * 12;
        return calculateTax(annual); 
    }

    private double calculateDeduction(String ruleName, double baseAmount, List<DeductionRule> deductionRules) {
        DeductionRule rule = deductionRules.stream()
                .filter(r -> r.getName().equalsIgnoreCase(ruleName) && r.getIsActive())
                .findFirst()
                .orElse(null);
        
        if (rule == null) {
            System.out.println("WARNING: No active deduction rule found for " + ruleName);
            return 0.0;
        }
        
        double deduction = 0.0;
        if (rule.getPercentage() != null) {
            deduction = baseAmount * (rule.getPercentage() / 100.0);
            // Apply maximum amount limit if specified
            if (rule.getMaxAmount() != null && deduction > rule.getMaxAmount()) {
                deduction = rule.getMaxAmount();
            }
        } else if (rule.getMaxAmount() != null) {
            deduction = rule.getMaxAmount();
        }
        
        // Special handling for ESI (only applicable if gross <= 21000)
        if ("Employee State Insurance".equalsIgnoreCase(ruleName) && baseAmount > 21000) {
            return 0.0;
        }
        
        return deduction;
    }

    private double calculateDeduction(String ruleName, double baseAmount) {
        return calculateDeduction(ruleName, baseAmount, deductionRuleRepo.findAll());
    }

    private double calculateTax(double income) {
        if (income <= 250000) return 0;
        else if (income <= 500000) return (income - 250000) * 0.05;
        else if (income <= 1000000) return 12500 + (income - 500000) * 0.2;
        else return 112500 + (income - 1000000) * 0.3;
    }
    
    private void validateMinimumWage(User employee, double gross) {
        if (employee.getState() == null) {
            System.out.println("WARNING: Employee " + (employee.getEmployeeCode() != null ? employee.getEmployeeCode() : "UNKNOWN") + " has no state specified. Skipping minimum wage validation.");
            return;
        }
        
        MinimumWage minimumWage = minimumWageRepo.findByStateAndIsActiveTrue(employee.getState())
            .orElse(null);
        
        if (minimumWage == null) {
            System.out.println("WARNING: No minimum wage rule found for state " + employee.getState().getDisplayName());
            return;
        }
        
        double requiredMinimum = minimumWage.getMinimumMonthlyWage();
        if (gross < requiredMinimum) {
            String warning = String.format(
                "MINIMUM WAGE VIOLATION: Employee %s (%s) gross salary %.2f is below minimum wage %.2f for %s",
                employee.getEmployeeCode(),
                employee.getName(),
                gross,
                requiredMinimum,
                employee.getState().getDisplayName()
            );
            System.out.println(warning);
            throw new RuntimeException(String.format(
                "Gross salary %.2f is below minimum wage %.2f for %s", 
                gross, requiredMinimum, employee.getState().getDisplayName()
            ));
        } else {
            System.out.println(String.format(
                "Minimum wage compliance: Employee %s gross %.2f >= minimum %.2f for %s",
                employee.getEmployeeCode(),
                gross,
                requiredMinimum,
                employee.getState().getDisplayName()
            ));
        }
    }
}