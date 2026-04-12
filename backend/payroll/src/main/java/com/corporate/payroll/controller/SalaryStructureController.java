package com.corporate.payroll.controller;

import com.corporate.payroll.entity.SalaryStructure;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.SalaryStructureRepository;
import com.corporate.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/salary-structures")
@RequiredArgsConstructor
public class SalaryStructureController {
    private final SalaryStructureRepository salaryStructureRepository;
    private final UserRepository userRepository;
    @PostMapping
    public SalaryStructure createSalaryStructure(@RequestBody Map<String, Object> payload) {
        SalaryStructure salaryStructure = new SalaryStructure();
        salaryStructure.setBasic(Double.valueOf(payload.get("basic").toString()));
        salaryStructure.setHra(Double.valueOf(payload.get("hra").toString()));
        salaryStructure.setDa(Double.valueOf(payload.get("da").toString()));
        salaryStructure.setSpecialAllowance(Double.valueOf(payload.get("specialAllowance").toString()));
        salaryStructure.setBonus(Double.valueOf(payload.get("bonus").toString()));
        salaryStructure.setLta(Double.valueOf(payload.get("lta").toString()));
        salaryStructure.setEffectiveFrom(java.time.LocalDate.parse(payload.get("effectiveFrom").toString()));
        salaryStructure.setEffectiveTo(java.time.LocalDate.parse(payload.get("effectiveTo").toString()));
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + employeeId));
        salaryStructure.setEmployee(employee);
        return salaryStructureRepository.save(salaryStructure);
    }
    @GetMapping
    public List<SalaryStructure> getAllSalaryStructures() {
        return salaryStructureRepository.findAll();
    }
    @GetMapping("/{id}")
    public SalaryStructure getSalaryStructureById(@PathVariable Long id) {
        return salaryStructureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SalaryStructure not found with id " + id));
    }
    @PutMapping("/{id}")
    public SalaryStructure updateSalaryStructure(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        SalaryStructure existing = salaryStructureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SalaryStructure not found with id " + id));

        existing.setBasic(Double.valueOf(payload.get("basic").toString()));
        existing.setHra(Double.valueOf(payload.get("hra").toString()));
        existing.setDa(Double.valueOf(payload.get("da").toString()));
        existing.setSpecialAllowance(Double.valueOf(payload.get("specialAllowance").toString()));
        existing.setBonus(Double.valueOf(payload.get("bonus").toString()));
        existing.setLta(Double.valueOf(payload.get("lta").toString()));
        existing.setEffectiveFrom(java.time.LocalDate.parse(payload.get("effectiveFrom").toString()));
        existing.setEffectiveTo(java.time.LocalDate.parse(payload.get("effectiveTo").toString()));

        if (payload.containsKey("employeeId")) {
            Long employeeId = Long.valueOf(payload.get("employeeId").toString());
            User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found with id " + employeeId));
            existing.setEmployee(employee);
        }

        return salaryStructureRepository.save(existing);
    }
    @DeleteMapping("/{id}")
    public void deleteSalaryStructure(@PathVariable Long id) {
        salaryStructureRepository.deleteById(id);
    }
    @GetMapping("/employee/{employeeId}")
    public List<SalaryStructure> getByEmployee(@PathVariable Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + employeeId));
        return salaryStructureRepository.findByEmployee(employee);
    }
    @PutMapping("/employee/{employeeId}")
    public SalaryStructure updateSalaryStructureByEmployee(
            @PathVariable Long employeeId,
            @RequestBody Map<String, Object> payload) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id " + employeeId));

        List<SalaryStructure> structures = salaryStructureRepository.findByEmployee(employee);
        if (structures.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No SalaryStructure found for employee " + employeeId);
        }
        // Update the first (or latest) one
        SalaryStructure existing = structures.get(0);

        existing.setBasic(Double.valueOf(payload.get("basic").toString()));
        existing.setHra(Double.valueOf(payload.get("hra").toString()));
        existing.setDa(Double.valueOf(payload.get("da").toString()));
        existing.setSpecialAllowance(Double.valueOf(payload.get("specialAllowance").toString()));
        existing.setBonus(Double.valueOf(payload.get("bonus").toString()));
        existing.setLta(Double.valueOf(payload.get("lta").toString()));
        existing.setEffectiveFrom(java.time.LocalDate.parse(payload.get("effectiveFrom").toString()));
        existing.setEffectiveTo(java.time.LocalDate.parse(payload.get("effectiveTo").toString()));

        return salaryStructureRepository.save(existing);
    }
}