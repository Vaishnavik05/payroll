package com.corporate.payroll.controller;

import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.repository.EmployeePayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
public class TaxController {
    private final EmployeePayrollRepository employeePayrollRepository;

    @GetMapping("/employee/{employeeId}")
    public Double getEmployeeTax(@PathVariable Long employeeId) {
        List<EmployeePayroll> payrolls = employeePayrollRepository.findByEmployee_Id(employeeId);
        if (payrolls.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "EmployeePayroll not found for employeeId " + employeeId);
        }
        EmployeePayroll latestPayroll = payrolls.stream()
            .max((a, b) -> a.getId().compareTo(b.getId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payroll found"));
        return latestPayroll.getGross() - latestPayroll.getNetSalary();
    }

    @GetMapping("/financial-year")
    public Map<Long, Double> getTaxForFinancialYear() {
        LocalDateTime now = LocalDateTime.now();
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        LocalDateTime start = LocalDateTime.of(year, Month.APRIL, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(year + 1, Month.MARCH, 31, 23, 59, 59);
        List<EmployeePayroll> payrolls = employeePayrollRepository.findAll().stream()
            .filter(p -> p.getPaidAt() != null && !p.getPaidAt().isBefore(start) && !p.getPaidAt().isAfter(end))
            .collect(Collectors.toList());
        return payrolls.stream()
            .collect(Collectors.groupingBy(
                p -> p.getEmployee().getId(),
                Collectors.summingDouble(p -> p.getGross() - p.getNetSalary())
            ));
    }
}