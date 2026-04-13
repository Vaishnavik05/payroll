package com.corporate.payroll.controller;

import com.corporate.payroll.entity.TaxComputation;
import com.corporate.payroll.service.TaxComputationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tax-processing")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TaxProcessingController {

    private final TaxComputationService taxComputationService;

    @PostMapping("/process/{financialYear}")
    public ResponseEntity<?> processTaxComputations(@PathVariable String financialYear) {
        try {
            System.out.println("Starting tax processing for financial year: " + financialYear);
            taxComputationService.processTaxComputationsForAllEmployees(financialYear);
            
            double totalTaxCollected = taxComputationService.getTotalTaxCollectedForFinancialYear(financialYear);
            int totalEmployees = taxComputationService.getTaxComputationsByFinancialYear(financialYear).size();
            
            System.out.println("Tax processing completed successfully. Total tax: " + totalTaxCollected + ", Employees: " + totalEmployees);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tax computations processed successfully for " + financialYear,
                "totalTaxCollected", totalTaxCollected,
                "totalEmployees", totalEmployees,
                "processedAt", LocalDateTime.now()
            ));
        } catch (Exception e) {
            // Log the full error for debugging
            System.err.println("Tax processing error: " + e.getMessage());
            e.printStackTrace();
            
            // Try to get partial results even if there was an error
            double totalTaxCollected = 0.0;
            int totalEmployees = 0;
            try {
                totalTaxCollected = taxComputationService.getTotalTaxCollectedForFinancialYear(financialYear);
                totalEmployees = taxComputationService.getTaxComputationsByFinancialYear(financialYear).size();
            } catch (Exception partialErr) {
                System.err.println("Could not get partial results: " + partialErr.getMessage());
            }
            
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Tax processing completed with some errors: " + e.getMessage(),
                "totalTaxCollected", totalTaxCollected,
                "totalEmployees", totalEmployees,
                "processedAt", LocalDateTime.now()
            ));
        }
    }

    @PostMapping("/process-current-year")
    public ResponseEntity<?> processCurrentYearTaxComputations() {
        LocalDateTime now = LocalDateTime.now();
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        String currentFinancialYear = year + "-" + (year + 1);
        
        return processTaxComputations(currentFinancialYear);
    }

    @GetMapping("/summary/{financialYear}")
    public ResponseEntity<?> getTaxSummary(@PathVariable String financialYear) {
        try {
            double totalTaxCollected = taxComputationService.getTotalTaxCollectedForFinancialYear(financialYear);
            int totalComputations = taxComputationService.getTaxComputationsByFinancialYear(financialYear).size();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "financialYear", financialYear,
                "totalTaxCollected", totalTaxCollected,
                "totalEmployees", totalComputations,
                "averageTaxPerEmployee", totalComputations > 0 ? totalTaxCollected / totalComputations : 0.0
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to get tax summary: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/summary/current-year")
    public ResponseEntity<?> getCurrentYearTaxSummary() {
        LocalDateTime now = LocalDateTime.now();
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        String currentFinancialYear = year + "-" + (year + 1);
        
        return getTaxSummary(currentFinancialYear);
    }

    @GetMapping("/test")
    public ResponseEntity<?> testTaxService() {
        try {
            // Test basic functionality
            LocalDateTime now = LocalDateTime.now();
            int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
            String currentFinancialYear = year + "-" + (year + 1);
            
            // Test if service is working
            double totalTax = taxComputationService.getTotalTaxCollectedForFinancialYear(currentFinancialYear);
            List<TaxComputation> computations = taxComputationService.getTaxComputationsByFinancialYear(currentFinancialYear);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tax service is working correctly",
                "financialYear", currentFinancialYear,
                "totalTaxCollected", totalTax,
                "totalComputations", computations.size(),
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Tax service test failed: " + e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
}
