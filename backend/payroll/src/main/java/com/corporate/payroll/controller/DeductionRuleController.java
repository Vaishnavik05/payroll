package com.corporate.payroll.controller;
import com.corporate.payroll.entity.DeductionRule;
import com.corporate.payroll.repository.DeductionRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/deduction-rules")
@RequiredArgsConstructor
public class DeductionRuleController {
    private final DeductionRuleRepository deductionRuleRepository;

    @PostMapping
    public DeductionRule createDeductionRule(@RequestBody DeductionRule deductionRule) {
        return deductionRuleRepository.save(deductionRule);
    }

    @GetMapping
    public List<DeductionRule> getAllDeductionRules() {
        return deductionRuleRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<DeductionRule> getDeductionRuleById(@PathVariable Long id) {
        return deductionRuleRepository.findById(id);
    }

    @PutMapping("/{id}")
    public DeductionRule updateDeductionRule(@PathVariable Long id, @RequestBody DeductionRule updatedRule) {
        return deductionRuleRepository.findById(id)
            .map(rule -> {
                rule.setName(updatedRule.getName());
                rule.setDescription(updatedRule.getDescription());
                rule.setCalculationFormula(updatedRule.getCalculationFormula());
                rule.setIsActive(updatedRule.getIsActive());
                return deductionRuleRepository.save(rule);
            })
            .orElseThrow(() -> new RuntimeException("Deduction rule not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public void deleteDeductionRule(@PathVariable Long id) {
        deductionRuleRepository.deleteById(id);
    }

    @GetMapping("/active")
    public List<DeductionRule> getActiveDeductionRules() {
        return deductionRuleRepository.findAll().stream()
            .filter(rule -> rule.getIsActive() != null && rule.getIsActive())
            .toList();
    }
}
