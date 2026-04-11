package com.corporate.payroll.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.corporate.payroll.service.PayrollService;
@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {
    private final PayrollService payrollService;
    @PutMapping("/process/{id}")
    public String processPayroll(@PathVariable Long id) {
        payrollService.processPayroll(id);
        return "Payroll processed successfully";
    }
}