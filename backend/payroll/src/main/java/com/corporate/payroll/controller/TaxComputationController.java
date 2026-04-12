package com.corporate.payroll.controller;

import com.corporate.payroll.entity.TaxComputation;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.TaxComputationRepository;
import com.corporate.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/tax-computations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TaxComputationController {
    private final TaxComputationRepository taxComputationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<TaxComputation>> getAllTaxComputations() {
        List<TaxComputation> computations = taxComputationRepository.findAll();
        return ResponseEntity.ok(computations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaxComputation> getTaxComputationById(@PathVariable Long id) {
        return taxComputationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeCode}")
    public ResponseEntity<List<TaxComputation>> getTaxComputationsByEmployee(@PathVariable String employeeCode) {
        List<TaxComputation> computations = taxComputationRepository.findByEmployeeEmployeeCodeOrderByCreatedAtDesc(employeeCode);
        return ResponseEntity.ok(computations);
    }

    @GetMapping("/financial-year/{financialYear}")
    public ResponseEntity<List<TaxComputation>> getTaxComputationsByFinancialYear(@PathVariable String financialYear) {
        List<TaxComputation> computations = taxComputationRepository.findByFinancialYear(financialYear);
        return ResponseEntity.ok(computations);
    }

    @GetMapping("/employee/{employeeCode}/financial-year/{financialYear}")
    public ResponseEntity<List<TaxComputation>> getTaxComputationsByEmployeeAndFinancialYear(
            @PathVariable String employeeCode, 
            @PathVariable String financialYear) {
        List<TaxComputation> computations = taxComputationRepository.findByEmployeeEmployeeCodeAndFinancialYearOrderByCreatedAtDesc(employeeCode, financialYear);
        return ResponseEntity.ok(computations);
    }

    @GetMapping("/employee/{employeeCode}/latest")
    public ResponseEntity<TaxComputation> getLatestTaxComputationByEmployee(@PathVariable String employeeCode) {
        List<TaxComputation> computations = taxComputationRepository.findByEmployeeEmployeeCodeOrderByCreatedAtDesc(employeeCode);
        return computations.isEmpty() ? 
            ResponseEntity.notFound().build() : 
            ResponseEntity.ok(computations.get(0));
    }

    @GetMapping("/summary/financial-year/{financialYear}")
    public ResponseEntity<Object> getTaxSummaryByFinancialYear(@PathVariable String financialYear) {
        List<TaxComputation> computations = taxComputationRepository.findAll().stream()
                .filter(tc -> financialYear.equals(tc.getFinancialYear()))
                .toList();
        
        double totalEmployees = computations.size();
        double totalTax = computations.stream().mapToDouble(TaxComputation::getTotalTax).sum();
        double totalTDS = computations.stream().mapToDouble(TaxComputation::getTaxDeducted).sum();
        double totalIncome = computations.stream().mapToDouble(TaxComputation::getTotalIncome).sum();
        
        var summary = java.util.Map.of(
                "financialYear", financialYear,
                "totalEmployees", totalEmployees,
                "totalTaxCollected", totalTax,
                "totalTDSDeducted", totalTDS,
                "totalAnnualIncome", totalIncome,
                "averageTaxPerEmployee", totalEmployees > 0 ? totalTax / totalEmployees : 0
        );
        
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<TaxComputation> createTaxComputation(@RequestBody TaxComputation taxComputation) {
        try {
            // Validate employee exists
            if (taxComputation.getEmployee() == null || taxComputation.getEmployee().getId() == null) {
                return ResponseEntity.badRequest().build();
            }
            
            User employee = userRepository.findById(taxComputation.getEmployee().getId())
                    .orElse(null);
            
            if (employee == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Explicitly set the employee reference to ensure proper mapping
            taxComputation.setEmployee(employee);
            
            // Save the tax computation
            TaxComputation savedComputation = taxComputationRepository.save(taxComputation);
            return ResponseEntity.ok(savedComputation);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/employee/{employeeCode}")
    public ResponseEntity<TaxComputation> createTaxComputationForEmployee(
            @PathVariable String employeeCode,
            @RequestBody TaxComputation taxComputation) {
        try {
            // Find employee by employee code
            User employee = userRepository.findByEmployeeCode(employeeCode)
                    .orElse(null);
            
            if (employee == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Set the employee reference
            taxComputation.setEmployee(employee);
            
            // Save the tax computation
            TaxComputation savedComputation = taxComputationRepository.save(taxComputation);
            return ResponseEntity.ok(savedComputation);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
