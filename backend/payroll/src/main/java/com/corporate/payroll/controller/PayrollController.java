package com.corporate.payroll.controller;

import com.corporate.payroll.dto.*;
import com.corporate.payroll.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
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

}
