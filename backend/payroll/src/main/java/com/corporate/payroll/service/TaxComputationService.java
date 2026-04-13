package com.corporate.payroll.service;

import com.corporate.payroll.entity.TaxComputation;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.TaxComputationRepository;
import com.corporate.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxComputationService {

    private final TaxComputationRepository taxComputationRepository;
    private final UserRepository userRepository;

    public TaxComputation createOrUpdateTaxComputation(String employeeCode, String financialYear, 
                                                      Double totalIncome, Double totalDeductions, 
                                                      Double taxableIncome, Double taxPayable, 
                                                      Double cess, Double totalTax, Double taxDeducted) {
        try {
            log.debug("Starting tax computation for employee: {}, year: {}", employeeCode, financialYear);
            
            // Find employee by employee code
            User employee = userRepository.findByEmployeeCode(employeeCode)
                    .orElse(null);
            
            if (employee == null) {
                log.warn("Employee not found with code: {}", employeeCode);
                return null;
            }

            log.debug("Found employee: {} (ID: {})", employeeCode, employee.getId());

            // Check if tax computation already exists
            List<TaxComputation> existingComputations = null;
            try {
                existingComputations = taxComputationRepository
                        .findByEmployeeEmployeeCodeAndFinancialYearOrderByCreatedAtDesc(employeeCode, financialYear);
            } catch (Exception e) {
                log.warn("Error checking existing computations for {}: {}", employeeCode, e.getMessage());
                existingComputations = null;
            }

            TaxComputation taxComputation;

            if (existingComputations != null && !existingComputations.isEmpty()) {
                // Update existing computation
                taxComputation = existingComputations.get(0);
                log.info("Updating existing tax computation for employee {} for financial year {} (ID: {})", 
                        employeeCode, financialYear, taxComputation.getId());
            } else {
                // Create new computation
                taxComputation = new TaxComputation();
                taxComputation.setEmployee(employee);
                taxComputation.setFinancialYear(financialYear);
                log.info("Creating new tax computation for employee {} for financial year {}", employeeCode, financialYear);
            }

            // Set tax computation values
            taxComputation.setTotalIncome(totalIncome);
            taxComputation.setTotalDeductions(totalDeductions);
            taxComputation.setTaxableIncome(taxableIncome);
            taxComputation.setTaxPayable(taxPayable);
            taxComputation.setCess(cess);
            taxComputation.setTotalTax(totalTax);
            taxComputation.setTaxDeducted(taxDeducted);
            taxComputation.setTaxStatus("COMPUTED");

            // Save the tax computation
            TaxComputation savedComputation = null;
            try {
                savedComputation = taxComputationRepository.save(taxComputation);
                log.info("Successfully saved tax computation for employee {}: ID={}, TotalTax={}", 
                        employeeCode, savedComputation.getId(), totalTax);
            } catch (Exception e) {
                log.error("Failed to save tax computation for employee {}: {}", employeeCode, e.getMessage());
                return null;
            }
            
            return savedComputation;

        } catch (Exception e) {
            log.error("Error creating/updating tax computation for employee {}: {}", employeeCode, e.getMessage(), e);
            return null;
        }
    }

    public void processTaxComputationsForAllEmployees(String financialYear) {
        log.info("Starting tax computation processing for financial year: {}", financialYear);
        
        try {
            List<User> employees = userRepository.findAll();
            log.info("Found {} total employees in database", employees.size());
            
            if (employees.isEmpty()) {
                log.warn("No employees found in database");
                return;
            }
            
            int processedCount = 0;
            int errorCount = 0;
            int skippedInactive = 0;
            int skippedZeroIncome = 0;

            for (User employee : employees) {
                try {
                    log.info("Processing employee: {} (Active: {})", 
                            employee.getEmployeeCode() != null ? employee.getEmployeeCode() : "UNKNOWN", 
                            employee.isActive());
                    
                    if (!employee.isActive()) {
                        log.info("Skipping inactive employee: {}", employee.getEmployeeCode());
                        skippedInactive++;
                        continue;
                    }

                    // Calculate annual income with a reasonable default
                    double annualIncome = calculateAnnualIncome(employee);
                    log.info("Employee {} annual income: {}", employee.getEmployeeCode(), annualIncome);
                    
                    if (annualIncome <= 0) {
                        log.info("Skipping employee {} with zero income", employee.getEmployeeCode());
                        skippedZeroIncome++;
                        continue;
                    }

                    // Calculate tax
                    double totalDeductions = calculateStandardDeductions(annualIncome);
                    double taxableIncome = annualIncome - totalDeductions;
                    double taxPayable = calculateTax(taxableIncome);
                    double cess = 0.0; // No cess for now
                    double totalTax = taxPayable + cess;
                    double monthlyTds = totalTax / 12;

                    log.info("Tax calculation for {}: Income={}, Taxable={}, Tax={}", 
                            employee.getEmployeeCode(), annualIncome, taxableIncome, totalTax);

                    // Create or update tax computation
                    TaxComputation taxComputation = createOrUpdateTaxComputation(
                            employee.getEmployeeCode(),
                            financialYear,
                            annualIncome,
                            totalDeductions,
                            taxableIncome,
                            taxPayable,
                            cess,
                            totalTax,
                            monthlyTds
                    );

                    if (taxComputation != null) {
                        processedCount++;
                        log.info("Successfully processed tax for employee {}: ID={}, TotalTax={}", 
                                employee.getEmployeeCode(), taxComputation.getId(), totalTax);
                    } else {
                        log.warn("Tax computation returned null for employee: {}", employee.getEmployeeCode());
                        errorCount++;
                    }

                } catch (Exception e) {
                    log.error("Error processing tax computation for employee {}: {}", 
                            employee.getEmployeeCode(), e.getMessage(), e);
                    errorCount++;
                    // Continue processing other employees instead of failing the entire transaction
                }
            }

            log.info("Tax computation processing completed. Total: {}, Processed: {}, Errors: {}, Skipped Inactive: {}, Skipped Zero Income: {}", 
                    employees.size(), processedCount, errorCount, skippedInactive, skippedZeroIncome);
            
            // Only throw exception if there were employees but everything failed
            if (processedCount == 0 && employees.size() > 0 && skippedInactive == 0 && skippedZeroIncome == 0) {
                String errorMsg = String.format("Failed to process any tax computations. Found %d active employees, %d errors", 
                        employees.size(), errorCount);
                log.error(errorMsg);
                throw new RuntimeException(errorMsg);
            }
            
            log.info("Tax processing completed successfully. Processed {} employees with tax computations", processedCount);
            
        } catch (Exception e) {
            log.error("Fatal error in tax computation processing: {}", e.getMessage(), e);
            throw new RuntimeException("Tax computation processing failed: " + e.getMessage(), e);
        }
    }

    private double calculateAnnualIncome(User employee) {
        try {
            // Try to get actual salary from salary structure
            // For now, return a reasonable default based on employee role
            if (employee.getRole() != null) {
                switch (employee.getRole().toLowerCase()) {
                    case "manager":
                        return 600000.0; // 50,000 per month
                    case "developer":
                        return 480000.0; // 40,000 per month
                    case "employee":
                    default:
                        return 360000.0; // 30,000 per month
                }
            }
            return 360000.0; // Default fallback
        } catch (Exception e) {
            log.warn("Error calculating annual income for employee {}: {}", employee.getEmployeeCode(), e.getMessage());
            return 360000.0; // Safe fallback
        }
    }

    private double calculateStandardDeductions(double annualIncome) {
        // Standard deductions under Section 80C, etc.
        // Simplified calculation
        return Math.min(150000.0, annualIncome * 0.1); // Max 1.5L under 80C
    }

    private double calculateTax(double taxableIncome) {
        // Indian tax slabs (simplified)
        if (taxableIncome <= 250000) return 0;
        else if (taxableIncome <= 500000) return (taxableIncome - 250000) * 0.05;
        else if (taxableIncome <= 1000000) return 12500 + (taxableIncome - 500000) * 0.2;
        else return 112500 + (taxableIncome - 1000000) * 0.3;
    }

    public List<TaxComputation> getAllTaxComputations() {
        return taxComputationRepository.findAll();
    }

    public List<TaxComputation> getTaxComputationsByFinancialYear(String financialYear) {
        return taxComputationRepository.findByFinancialYear(financialYear);
    }

    public double getTotalTaxCollectedForFinancialYear(String financialYear) {
        try {
            List<TaxComputation> computations = getTaxComputationsByFinancialYear(financialYear);
            if (computations == null || computations.isEmpty()) {
                log.info("No tax computations found for financial year: {}", financialYear);
                return 0.0;
            }
            
            double totalTax = computations.stream()
                    .mapToDouble(tc -> tc.getTotalTax() != null ? tc.getTotalTax() : 0.0)
                    .sum();
            
            log.info("Total tax collected for {}: {} from {} computations", financialYear, totalTax, computations.size());
            return totalTax;
        } catch (Exception e) {
            log.error("Error calculating total tax for financial year {}: {}", financialYear, e.getMessage());
            return 0.0;
        }
    }
}
