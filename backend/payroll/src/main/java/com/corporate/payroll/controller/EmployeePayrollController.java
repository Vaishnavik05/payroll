package com.corporate.payroll.controller;

import com.corporate.payroll.dto.EmployeePayrollDTO;
import com.corporate.payroll.dto.SalaryBreakupDTO;
import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.entity.SalaryBreakup;
import com.corporate.payroll.repository.EmployeePayrollRepository;
import com.corporate.payroll.repository.SalaryBreakupRepository;
import com.corporate.payroll.repository.PayrollCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee-payrolls")
@RequiredArgsConstructor
public class EmployeePayrollController {
    private final EmployeePayrollRepository employeePayrollRepository;
    private final SalaryBreakupRepository salaryBreakupRepository;
    private final PayrollCycleRepository payrollCycleRepository;

    @GetMapping("/{id}/breakup")
    public ResponseEntity<List<SalaryBreakupDTO>> getSalaryBreakup(@PathVariable Long id) {
        EmployeePayroll payroll = employeePayrollRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EmployeePayroll not found"));
        
        List<SalaryBreakupDTO> breakupDTOs = salaryBreakupRepository.findByEmployeePayroll(payroll)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(breakupDTOs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EmployeePayrollDTO> getEmployeePayroll(@PathVariable Long id) {
        EmployeePayroll payroll = employeePayrollRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EmployeePayroll not found"));
            
        return ResponseEntity.ok(convertToEmployeePayrollDTO(payroll));
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<EmployeePayrollDTO>> getAllEmployeePayrolls() {
        List<EmployeePayroll> payrolls = employeePayrollRepository.findAll();
        List<EmployeePayrollDTO> payrollDTOs = payrolls.stream()
            .map(this::convertToEmployeePayrollDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(payrollDTOs);
    }
    
    @GetMapping("/employee/{employeeCode}")
    public ResponseEntity<List<EmployeePayrollDTO>> getEmployeePayrollsByEmployeeCode(@PathVariable String employeeCode) {
        List<EmployeePayroll> payrolls = employeePayrollRepository.findAll().stream()
            .filter(p -> p.getEmployee() != null && employeeCode.equals(p.getEmployee().getEmployeeCode()))
            .collect(Collectors.toList());
            
        List<EmployeePayrollDTO> payrollDTOs = payrolls.stream()
            .map(this::convertToEmployeePayrollDTO)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(payrollDTOs);
    }
    
    @GetMapping("/payroll-cycle/{payrollCycleId}")
    public ResponseEntity<List<EmployeePayrollDTO>> getEmployeePayrollsByPayrollCycle(@PathVariable Long payrollCycleId) {
        // Verify payroll cycle exists
        payrollCycleRepository.findById(payrollCycleId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll cycle not found"));
        
        // Find all employee payrolls for this payroll cycle
        List<EmployeePayroll> payrolls = employeePayrollRepository.findByPayrollCycleId(payrollCycleId);
        
        // Convert to DTOs
        List<EmployeePayrollDTO> payrollDTOs = payrolls.stream()
            .map(this::convertToEmployeePayrollDTO)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(payrollDTOs);
    }
    
    private SalaryBreakupDTO convertToDTO(SalaryBreakup breakup) {
        SalaryBreakupDTO dto = new SalaryBreakupDTO();
        dto.setId(breakup.getId());
        dto.setComponentType(breakup.getComponentType());
        dto.setComponentName(breakup.getComponentName());
        dto.setAmount(breakup.getAmount() != null ? java.math.BigDecimal.valueOf(breakup.getAmount()) : null);
        dto.setCalculationFormula(breakup.getCalculationFormula());
        return dto;
    }
    
    private EmployeePayrollDTO convertToEmployeePayrollDTO(EmployeePayroll payroll) {
        EmployeePayrollDTO dto = new EmployeePayrollDTO();
        dto.setId(payroll.getId());
        dto.setEmployeeCode(payroll.getEmployee() != null ? payroll.getEmployee().getEmployeeCode() : null);
        dto.setEmployeeName(payroll.getEmployee() != null ? payroll.getEmployee().getName() : null);
        dto.setGross(payroll.getGross());
        dto.setTotalDeductions(payroll.getTotalDeductions());
        dto.setNetSalary(payroll.getNetSalary());
        dto.setStatus(payroll.getStatus() != null ? payroll.getStatus().toString() : null);
        dto.setBankReference(payroll.getBankReference());
        dto.setPaidAt(payroll.getPaidAt());
        return dto;
    }
}