package com.corporate.payroll.controller;

import com.corporate.payroll.dto.*;
import com.corporate.payroll.entity.PayrollCycle;
import com.corporate.payroll.enums.PayrollStatus;
import com.corporate.payroll.repository.PayrollCycleRepository;
import com.corporate.payroll.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payroll-cycles")
@RequiredArgsConstructor
public class PayrollCycleController {
    private final PayrollCycleRepository payrollCycleRepository;
    private final PayrollService payrollService;

    @PostMapping
    public ResponseEntity<PayrollCycleResponse> createPayrollCycle(@Valid @RequestBody PayrollCycleRequest request) {
        PayrollCycle payrollCycle = new PayrollCycle();
        payrollCycle.setMonth(request.getMonth());
        payrollCycle.setYear(request.getYear());
        payrollCycle.setStartDate(request.getStartDate());
        payrollCycle.setEndDate(request.getEndDate());
        payrollCycle.setPaymentDate(request.getPaymentDate());
        payrollCycle.setStatus(PayrollStatus.DRAFT);
        
        PayrollCycle saved = payrollCycleRepository.save(payrollCycle);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(saved));
    }

    @GetMapping
    public ResponseEntity<List<PayrollCycleResponse>> getAllPayrollCycles() {
        List<PayrollCycleResponse> cycles = payrollCycleRepository.findAll()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(cycles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollCycleResponse> getPayrollCycleById(@PathVariable Long id) {
        PayrollCycle payrollCycle = payrollCycleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PayrollCycle not found with id " + id));
        return ResponseEntity.ok(convertToResponse(payrollCycle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PayrollCycleResponse> updatePayrollCycle(
            @PathVariable Long id, 
            @Valid @RequestBody PayrollCycleRequest request) {
        return payrollCycleRepository.findById(id)
                .map(cycle -> {
                    cycle.setMonth(request.getMonth());
                    cycle.setYear(request.getYear());
                    cycle.setStartDate(request.getStartDate());
                    cycle.setEndDate(request.getEndDate());
                    cycle.setPaymentDate(request.getPaymentDate());
                    return payrollCycleRepository.save(cycle);
                })
                .map(updated -> ResponseEntity.ok(convertToResponse(updated)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PayrollCycle not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayrollCycle(@PathVariable Long id) {
        if (!payrollCycleRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PayrollCycle not found with id " + id);
        }
        
        PayrollCycle cycle = payrollCycleRepository.findById(id).get();
        if (cycle.getStatus() == PayrollStatus.PROCESSING || cycle.getStatus() == PayrollStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete payroll cycle that is being processed or completed");
        }
        
        payrollCycleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/process")
    public ResponseEntity<PayrollProcessingResponse> processPayrollCycle(@PathVariable Long id) {
        try {
            payrollService.processPayroll(id);
            PayrollProcessingResponse response = new PayrollProcessingResponse(
                "Payroll cycle processed successfully",
                true,
                0, // Would be populated from service
                0, // Would be populated from service
                null,
                null,
                java.time.LocalDateTime.now(),
                id.toString()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            PayrollProcessingResponse response = new PayrollProcessingResponse(
                "Payroll processing failed: " + e.getMessage(),
                false,
                0,
                0,
                null,
                List.of(e.getMessage()),
                java.time.LocalDateTime.now(),
                id.toString()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<PayrollCycleResponse> completePayrollCycle(@PathVariable Long id) {
        PayrollCycle cycle = payrollCycleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll cycle not found"));
        
        if (cycle.getStatus() != PayrollStatus.PROCESSING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payroll cycle must be in PROCESSING status to be completed");
        }
        
        cycle.setStatus(PayrollStatus.COMPLETED);
        PayrollCycle updated = payrollCycleRepository.save(cycle);
        return ResponseEntity.ok(convertToResponse(updated));
    }
    
    private PayrollCycleResponse convertToResponse(PayrollCycle cycle) {
        PayrollCycleResponse response = new PayrollCycleResponse();
        response.setId(cycle.getId());
        response.setMonth(cycle.getMonth());
        response.setYear(cycle.getYear());
        response.setStartDate(cycle.getStartDate());
        response.setEndDate(cycle.getEndDate());
        response.setPaymentDate(cycle.getPaymentDate());
        response.setStatus(cycle.getStatus());
        response.setFinancialYear(cycle.getYear() + "-" + (cycle.getYear() + 1));
        // These would be calculated based on actual payroll data
        response.setTotalEmployees(0);
        response.setTotalGrossSalary(0.0);
        response.setTotalNetSalary(0.0);
        response.setTotalAmount(response.getTotalNetSalary());
        return response;
    }
}