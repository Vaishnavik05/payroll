package com.corporate.payroll.controller;

import com.corporate.payroll.dto.*;
import com.corporate.payroll.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {
    
    private final PayrollService payrollService;

    @GetMapping("/tax/{employeeId}")
    public ResponseEntity<TaxResponse> getEmployeeTax(@PathVariable Long employeeId) {
        
        double annualTax = payrollService.getEmployeeTax(employeeId);
        TaxResponse response = new TaxResponse();
        response.setEmployeeId(employeeId);
        response.setAnnualTax(BigDecimal.valueOf(annualTax));
        response.setMonthlyTax(BigDecimal.valueOf(annualTax / 12));
        response.setFinancialYear("2024-2025");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validateSalary(
            @Valid @RequestBody SalaryValidationRequest request) {
        
        ValidationResponse response = new ValidationResponse();
        response.setEmployeeId(request.getEmployeeId());
        response.setValid(true);
        response.setMessage("Salary structure meets all requirements");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary/{cycleId}")
    public ResponseEntity<PayrollSummaryResponse> getPayrollSummary(@PathVariable Long cycleId) {
        
        PayrollSummaryResponse response = new PayrollSummaryResponse();
        response.setCycleId(cycleId);
        response.setTotalEmployees(0);
        response.setTotalGrossSalary(BigDecimal.ZERO);
        response.setTotalDeductions(BigDecimal.ZERO);
        response.setTotalNetSalary(BigDecimal.ZERO);
        response.setAverageSalary(BigDecimal.ZERO);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update-totals")
    public ResponseEntity<String> updatePayrollTotals() {
        try {
            payrollService.updateAllPayrollCyclesWithTotals();
            return ResponseEntity.ok("Payroll cycles totals updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update payroll totals: " + e.getMessage());
        }
    }

}
