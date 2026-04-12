package com.corporate.payroll.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.corporate.payroll.entity.*;
import com.corporate.payroll.enums.PayrollStatus;
import com.corporate.payroll.enums.PayoutStatus;
import com.corporate.payroll.enums.ComponentType;
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
            if (gross <= 0) {
                System.out.println("WARNING: Invalid gross salary for employee " + emp.getEmployeeCode() + ": " + gross);
                continue;
            }
            validateMinimumWage(emp, gross);
            double pf = calculateDeduction("Provident Fund", s.getBasic() + s.getDa(), deductionRules);
            double esi = calculateDeduction("Employee State Insurance", gross, deductionRules);
            double pt = calculateDeduction("Professional Tax", gross, deductionRules);
            double annual = gross * 12;
            double tax = calculateTax(annual);
            double tds = tax / 12;
            double deductions = pf + esi + pt + tds;
            
            double net = gross - deductions;
            
            // Check if payslip already exists for this employee and payroll cycle
            EmployeePayroll existingPayroll = payrollRepo.findByEmployeeAndPayrollCycle(emp, cycle).orElse(null);
            EmployeePayroll payroll;
            
            if (existingPayroll != null) {
                System.out.println("INFO: Updating existing payslip for employee " + emp.getEmployeeCode() + " in cycle " + cycle.getMonth() + "/" + cycle.getYear());
                payroll = existingPayroll;
            } else {
                System.out.println("INFO: Creating new payslip for employee " + emp.getEmployeeCode() + " in cycle " + cycle.getMonth() + "/" + cycle.getYear());
                payroll = new EmployeePayroll();
                payroll.setEmployee(emp);
                payroll.setPayrollCycle(cycle);
            }
            
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
            payroll.setBankReference(generateStandardBankReference(emp, cycle));
            payroll.setPaidAt(java.time.LocalDateTime.now());
            payrollRepo.save(payroll);
            
            // Clean up existing salary breakup records for this payroll if updating
            if (existingPayroll != null) {
                salaryBreakupRepo.deleteByEmployeePayrollId(payroll.getId());
            }
            
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
            
            String financialYear = cycle.getYear() + "-" + (cycle.getYear() + 1);
            
            // Check if tax computation already exists for this employee and financial year
            List<TaxComputation> existingTaxComputations = taxComputationRepo.findByEmployeeEmployeeCodeAndFinancialYearOrderByCreatedAtDesc(emp.getEmployeeCode(), financialYear);
            TaxComputation taxComputation;
            
            if (existingTaxComputations != null && !existingTaxComputations.isEmpty()) {
                System.out.println("INFO: Updating existing tax computation for employee " + emp.getEmployeeCode() + " for financial year " + financialYear);
                taxComputation = existingTaxComputations.get(0);
                taxComputation.setTotalIncome(gross * 12);
                taxComputation.setTotalDeductions(pf + esi + pt);
                taxComputation.setTaxableIncome(annual);
                taxComputation.setTaxPayable(tax);
                taxComputation.setCess(0.0);
                taxComputation.setTotalTax(tax);
                taxComputation.setTaxDeducted(tds);
                taxComputation.setTaxStatus("COMPUTED");
            } else {
                System.out.println("INFO: Creating new tax computation for employee " + emp.getEmployeeCode() + " for financial year " + financialYear);
                taxComputation = TaxComputation.builder()
                    .employee(emp)
                    .financialYear(financialYear)
                    .totalIncome(gross * 12)
                    .totalDeductions(pf + esi + pt)
                    .taxableIncome(annual)
                    .taxPayable(tax)
                    .cess(0.0) 
                    .totalTax(tax)
                    .taxDeducted(tds)
                    .taxStatus("COMPUTED")
                    .build();
            }
            
            // Ensure employee is properly set before saving
            if (taxComputation.getEmployee() == null || taxComputation.getEmployee().getId() == null) {
                System.out.println("ERROR: Employee not properly set for tax computation for employee " + emp.getEmployeeCode());
                continue;
            }
            
            // Explicitly set the employee reference to avoid null constraint issues
            taxComputation.setEmployee(emp);
            
            taxComputationRepo.save(taxComputation);
        }
        cycle.setStatus(PayrollStatus.COMPLETED);
        
        // Calculate total amount and employee count for the payroll cycle
        List<EmployeePayroll> cyclePayrolls = payrollRepo.findByPayrollCycle(cycle);
        double totalCycleAmount = cyclePayrolls.stream()
            .mapToDouble(ep -> ep.getNetSalary() != null ? ep.getNetSalary() : 0.0)
            .sum();
        int totalCycleEmployees = cyclePayrolls.size();
        
        cycle.setTotalAmount(totalCycleAmount);
        cycle.setTotalEmployees(totalCycleEmployees);
        cycleRepo.save(cycle);
    }
    
    /**
     * Clean up duplicate payslips for the same employee in the same payroll cycle
     * Keeps only the most recent payslip for each employee-cycle combination
     */
    public void cleanupDuplicatePayslips() {
        System.out.println("Starting cleanup of duplicate payslips...");
        
        List<EmployeePayroll> allPayrolls = payrollRepo.findAll();
        
        // Group payslips by employee and payroll cycle
        Map<String, List<EmployeePayroll>> groupedPayrolls = allPayrolls.stream()
            .collect(Collectors.groupingBy(p -> {
                String employeeCode = p.getEmployee() != null ? p.getEmployee().getEmployeeCode() : "UNKNOWN";
                String cycleKey = p.getPayrollCycle() != null ? 
                    p.getPayrollCycle().getMonth() + "/" + p.getPayrollCycle().getYear() : "UNKNOWN";
                return employeeCode + "|" + cycleKey;
            }));
        
        int duplicatesFound = 0;
        int duplicatesRemoved = 0;
        
        for (Map.Entry<String, List<EmployeePayroll>> entry : groupedPayrolls.entrySet()) {
            List<EmployeePayroll> payrollList = entry.getValue();
            
            if (payrollList.size() > 1) {
                duplicatesFound++;
                System.out.println("Found " + payrollList.size() + " payslips for " + entry.getKey());
                
                // Sort by creation date (most recent first)
                payrollList.sort((a, b) -> {
                    if (a.getPaidAt() == null && b.getPaidAt() == null) return 0;
                    if (a.getPaidAt() == null) return 1;
                    if (b.getPaidAt() == null) return -1;
                    return b.getPaidAt().compareTo(a.getPaidAt());
                });
                
                // Keep the first (most recent) and delete the rest
                EmployeePayroll toKeep = payrollList.get(0);
                List<EmployeePayroll> toDelete = payrollList.subList(1, payrollList.size());
                
                System.out.println("Keeping payslip ID: " + toKeep.getId() + " (from " + toKeep.getPaidAt() + ")");
                
                for (EmployeePayroll payroll : toDelete) {
                    System.out.println("Deleting duplicate payslip ID: " + payroll.getId() + " (from " + payroll.getPaidAt() + ")");
                    payrollRepo.delete(payroll);
                    duplicatesRemoved++;
                }
            }
        }
        
        System.out.println("Cleanup completed. Found " + duplicatesFound + " duplicate groups, removed " + duplicatesRemoved + " duplicate payslips.");
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
                .filter(r -> r.getDeductionType() != null && r.getDeductionType().equalsIgnoreCase(ruleName))
                .findFirst()
                .orElse(null);
        
        if (rule != null) {
            SalaryBreakup deduction = new SalaryBreakup();
            deduction.setEmployeePayroll(payroll);
            deduction.setComponentType(ComponentType.DEDUCTION);
            deduction.setComponentName(ruleName);
            deduction.setAmount(amount);
            deduction.setCalculationFormula(ruleName + " deduction");
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
                .filter(r -> r.getDeductionType().equalsIgnoreCase(ruleName))
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
    
    private String generateStandardBankReference(User employee, PayrollCycle cycle) {
        // Create a standardized bank reference format: EMP001202404BANK001
        // Format: EmployeeCode + Year + Month (2-digit) + BANK + Sequence (3-digit)
        String employeeCode = employee.getEmployeeCode() != null ? employee.getEmployeeCode() : "EMP000";
        String year = String.valueOf(cycle.getYear());
        Integer monthValue = cycle.getMonth();
        String month = String.format("%02d", monthValue != null ? monthValue : 1);
        
        // Generate a consistent sequence based on employee code and month/year
        int sequence = Math.abs((employeeCode + year + month).hashCode()) % 1000;
        String sequenceStr = String.format("%03d", sequence);
        
        return employeeCode + year + month + "BANK" + sequenceStr;
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
    
    /**
     * Update all existing payroll cycles with total amounts and employee counts
     * This method should be run once after adding the new fields to populate existing data
     */
    public void updateAllPayrollCyclesWithTotals() {
        System.out.println("Updating all payroll cycles with total amounts and employee counts...");
        
        List<PayrollCycle> allCycles = cycleRepo.findAll();
        
        for (PayrollCycle cycle : allCycles) {
            try {
                // Get all employee payrolls for this cycle
                List<EmployeePayroll> cyclePayrolls = payrollRepo.findByPayrollCycle(cycle);
                
                // Calculate total amount (sum of net salaries)
                double totalCycleAmount = cyclePayrolls.stream()
                    .mapToDouble(ep -> ep.getNetSalary() != null ? ep.getNetSalary() : 0.0)
                    .sum();
                
                // Count employees
                int totalCycleEmployees = cyclePayrolls.size();
                
                // Update the cycle with calculated values
                cycle.setTotalAmount(totalCycleAmount);
                cycle.setTotalEmployees(totalCycleEmployees);
                
                cycleRepo.save(cycle);
                
                System.out.println("Updated payroll cycle " + cycle.getId() + 
                    " (" + cycle.getMonth() + "/" + cycle.getYear() + 
                    "): Amount = " + totalCycleAmount + 
                    ", Employees = " + totalCycleEmployees);
                    
            } catch (Exception e) {
                System.err.println("Error updating payroll cycle " + cycle.getId() + ": " + e.getMessage());
            }
        }
        
        System.out.println("Completed updating payroll cycles with totals.");
    }
}