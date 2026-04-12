package com.corporate.payroll.controller;

import com.corporate.payroll.dto.SalaryBreakupDTO;
import com.corporate.payroll.entity.SalaryBreakup;
import com.corporate.payroll.repository.SalaryBreakupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/salary-breakup")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalaryBreakupController {
    private final SalaryBreakupRepository salaryBreakupRepository;

    @GetMapping
    public ResponseEntity<List<SalaryBreakupDTO>> getAllSalaryBreakups() {
        List<SalaryBreakupDTO> breakups = salaryBreakupRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(breakups);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryBreakupDTO> getSalaryBreakupById(@PathVariable Long id) {
        SalaryBreakup breakup = salaryBreakupRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salary breakup not found with id " + id));
        return ResponseEntity.ok(convertToDTO(breakup));
    }

    @GetMapping("/employee-payroll/{employeePayrollId}")
    public ResponseEntity<List<SalaryBreakupDTO>> getSalaryBreakupByEmployeePayroll(@PathVariable Long employeePayrollId) {
        List<SalaryBreakupDTO> breakups = salaryBreakupRepository.findByEmployeePayrollId(employeePayrollId)
            .stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(breakups);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SalaryBreakupDTO>> getSalaryBreakupByEmployee(@PathVariable Long employeeId) {
        List<SalaryBreakupDTO> breakups = salaryBreakupRepository.findByEmployeePayrollEmployeeId(employeeId)
            .stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(breakups);
    }

    @GetMapping("/payroll-cycle/{payrollCycleId}")
    public ResponseEntity<List<SalaryBreakupDTO>> getSalaryBreakupByPayrollCycle(@PathVariable Long payrollCycleId) {
        List<SalaryBreakupDTO> breakups = salaryBreakupRepository.findByEmployeePayrollPayrollCycleId(payrollCycleId)
            .stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(breakups);
    }

    @PostMapping
    public ResponseEntity<SalaryBreakupDTO> createSalaryBreakup(@Valid @RequestBody SalaryBreakupDTO request) {
        SalaryBreakup breakup = convertToEntity(request);
        SalaryBreakup saved = salaryBreakupRepository.save(breakup);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(saved));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<SalaryBreakupDTO>> createSalaryBreakups(@Valid @RequestBody List<SalaryBreakupDTO> requests) {
        List<SalaryBreakup> breakups = requests.stream()
                .map(this::convertToEntity)
                .collect(java.util.stream.Collectors.toList());
        List<SalaryBreakup> saved = salaryBreakupRepository.saveAll(breakups);
        List<SalaryBreakupDTO> response = saved.stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryBreakupDTO> updateSalaryBreakup(
            @PathVariable Long id, 
            @Valid @RequestBody SalaryBreakupDTO request) {
        return salaryBreakupRepository.findById(id)
                .map(breakup -> {
                    breakup.setComponentName(request.getComponentName());
                    breakup.setComponentType(request.getComponentType());
                    breakup.setAmount(request.getAmount().doubleValue());
                    breakup.setCalculationFormula(request.getCalculationFormula());
                    breakup.setDescription(request.getDescription());
                    breakup.setIsTaxable(request.getDescription() != null && !request.getDescription().isEmpty());
                    breakup.setUpdatedAt(java.time.LocalDateTime.now());
                    return salaryBreakupRepository.save(breakup);
                })
                .map(updated -> ResponseEntity.ok(convertToDTO(updated)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salary breakup not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalaryBreakup(@PathVariable Long id) {
        if (!salaryBreakupRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Salary breakup not found with id " + id);
        }
        
        salaryBreakupRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/employee-payroll/{employeePayrollId}")
    public ResponseEntity<Void> deleteSalaryBreakupByEmployeePayroll(@PathVariable Long employeePayrollId) {
        List<SalaryBreakup> breakups = salaryBreakupRepository.findByEmployeePayrollId(employeePayrollId);
        if (!breakups.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No salary breakups found for employee payroll id " + employeePayrollId);
        }
        
        salaryBreakupRepository.deleteAll(breakups);
        return ResponseEntity.noContent().build();
    }

    private SalaryBreakupDTO convertToDTO(SalaryBreakup breakup) {
        SalaryBreakupDTO dto = new SalaryBreakupDTO();
        dto.setId(breakup.getId());
        dto.setComponentName(breakup.getComponentName());
        dto.setComponentType(breakup.getComponentType());
        dto.setAmount(java.math.BigDecimal.valueOf(breakup.getAmount()));
        dto.setCalculationFormula(breakup.getCalculationFormula());
        dto.setDescription(breakup.getDescription());
        return dto;
    }

    private SalaryBreakup convertToEntity(SalaryBreakupDTO dto) {
        SalaryBreakup breakup = new SalaryBreakup();
        breakup.setComponentName(dto.getComponentName());
        breakup.setComponentType(dto.getComponentType());
        breakup.setAmount(dto.getAmount().doubleValue());
        breakup.setCalculationFormula(dto.getCalculationFormula());
        breakup.setDescription(dto.getDescription());
        breakup.setIsTaxable(dto.getDescription() != null && !dto.getDescription().isEmpty());
        breakup.setCreatedAt(java.time.LocalDateTime.now());
        breakup.setUpdatedAt(java.time.LocalDateTime.now());
        return breakup;
    }
}
