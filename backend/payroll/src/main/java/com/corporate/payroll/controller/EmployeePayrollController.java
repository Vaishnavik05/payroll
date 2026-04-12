package com.corporate.payroll.controller;

import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.entity.SalaryBreakup;
import com.corporate.payroll.repository.EmployeePayrollRepository;
import com.corporate.payroll.repository.SalaryBreakupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/employee-payrolls")
@RequiredArgsConstructor
public class EmployeePayrollController {
    private final EmployeePayrollRepository employeePayrollRepository;
    private final SalaryBreakupRepository salaryBreakupRepository;

    @GetMapping("/{id}/breakup")
    public List<SalaryBreakup> getSalaryBreakup(@PathVariable Long id) {
        EmployeePayroll payroll = employeePayrollRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EmployeePayroll not found"));
        return salaryBreakupRepository.findByEmployeePayroll(payroll);
    }
}