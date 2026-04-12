package com.corporate.payroll.controller;
import com.corporate.payroll.entity.PayrollCycle;
import com.corporate.payroll.enums.PayrollStatus;
import com.corporate.payroll.repository.PayrollCycleRepository;
import com.corporate.payroll.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/payroll-cycle")
@RequiredArgsConstructor
public class PayrollCycleController {
    private final PayrollCycleRepository payrollCycleRepository;
    private final PayrollService payrollService;

    @PostMapping
    public PayrollCycle createPayrollCycle(@RequestBody PayrollCycle payrollCycle) {
        return payrollCycleRepository.save(payrollCycle);
    }

    @GetMapping
    public List<PayrollCycle> getAllPayrollCycles() {
        return payrollCycleRepository.findAll();
    }

    @GetMapping("/{id}")
    public PayrollCycle getPayrollCycleById(@PathVariable Long id) {
        return payrollCycleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PayrollCycle not found with id " + id));
    }

    @PutMapping("/{id}")
    public PayrollCycle updatePayrollCycle(@PathVariable Long id, @RequestBody PayrollCycle updated) {
        return payrollCycleRepository.findById(id)
                .map(cycle -> {
                    cycle.setMonth(updated.getMonth());
                    cycle.setYear(updated.getYear());
                    cycle.setStartDate(updated.getStartDate());
                    cycle.setEndDate(updated.getEndDate());
                    cycle.setPaymentDate(updated.getPaymentDate());
                    cycle.setStatus(updated.getStatus());
                    return payrollCycleRepository.save(cycle);
                })
                .orElseThrow(() -> new RuntimeException("PayrollCycle not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public void deletePayrollCycle(@PathVariable Long id) {
        payrollCycleRepository.deleteById(id);
    }

    @PutMapping("/{id}/process")
    public String processPayrollCycle(@PathVariable Long id) {
        payrollService.processPayroll(id);
        return "Payroll cycle processed successfully";
    }

    @PutMapping("/{id}/complete")
    public String completePayrollCycle(@PathVariable Long id) {
        PayrollCycle cycle = payrollCycleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll cycle not found"));
        cycle.setStatus(PayrollStatus.COMPLETED);
        payrollCycleRepository.save(cycle);
        return "Payroll cycle marked as completed";
    }
}