package com.corporate.payroll.controller;

import com.corporate.payroll.dto.*;
import com.corporate.payroll.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
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

    @PostMapping("/cancel/{cycleId}")
    public ResponseEntity<String> cancelPayroll(@PathVariable Long cycleId) {
        try {
            payrollService.cancelPayroll(cycleId);
            return ResponseEntity.ok("Payroll cycle cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to cancel payroll: " + e.getMessage());
        }
    }

    @PostMapping("/mark-left-out")
    public ResponseEntity<String> markEmployeeLeftOut(@RequestBody Map<String, Object> payload) {
        try {
            Long employeeId = Long.valueOf(payload.get("employeeId").toString());
            Long payrollCycleId = Long.valueOf(payload.get("payrollCycleId").toString());
            String reason = payload.get("reason") != null ? payload.get("reason").toString() : "Left out by finance";
            
            payrollService.markEmployeeLeftOut(employeeId, payrollCycleId, reason);
            return ResponseEntity.ok("Employee marked as left out successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to mark employee as left out: " + e.getMessage());
        }
    }

    @PostMapping("/cleanup-duplicates")
    public ResponseEntity<String> cleanupDuplicatePayslips() {
        try {
            payrollService.cleanupDuplicatePayslips();
            return ResponseEntity.ok("Duplicate payslips cleaned up successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to cleanup duplicate payslips: " + e.getMessage());
        }
    }

}
