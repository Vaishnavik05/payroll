package com.corporate.payroll.controller;
import com.corporate.payroll.entity.DeductionRule;
import com.corporate.payroll.repository.DeductionRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/deduction-rules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeductionRuleController {
    private final DeductionRuleRepository deductionRuleRepository;

    @PostMapping
    public ResponseEntity<DeductionRule> createDeductionRule(@Valid @RequestBody DeductionRule deductionRule) {
        try {
            // Validate that at least one of percentage or fixedAmount is provided
            if (deductionRule.getPercentage() == null && deductionRule.getFixedAmount() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Either percentage or fixed amount must be provided");
            }
            
            // Validate percentage range if provided
            if (deductionRule.getPercentage() != null && (deductionRule.getPercentage() < 0 || deductionRule.getPercentage() > 100)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Percentage must be between 0 and 100");
            }
            
            DeductionRule saved = deductionRuleRepository.save(deductionRule);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to create deduction rule: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<DeductionRule>> getAllDeductionRules() {
        try {
            List<DeductionRule> rules = deductionRuleRepository.findAll();
            return ResponseEntity.ok(rules);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to fetch deduction rules: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeductionRule> getDeductionRuleById(@PathVariable Long id) {
        try {
            return deductionRuleRepository.findById(id)
                .map(rule -> ResponseEntity.ok(rule))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Deduction rule not found with id " + id));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to fetch deduction rule: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeductionRule> updateDeductionRule(
            @PathVariable Long id, 
            @Valid @RequestBody DeductionRule updatedRule) {
        try {
            // Validate that at least one of percentage or fixedAmount is provided
            if (updatedRule.getPercentage() == null && updatedRule.getFixedAmount() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Either percentage or fixed amount must be provided");
            }
            
            // Validate percentage range if provided
            if (updatedRule.getPercentage() != null && (updatedRule.getPercentage() < 0 || updatedRule.getPercentage() > 100)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Percentage must be between 0 and 100");
            }
            
            return deductionRuleRepository.findById(id)
                .map(rule -> {
                    rule.setDeductionType(updatedRule.getDeductionType());
                    rule.setPercentage(updatedRule.getPercentage());
                    rule.setFixedAmount(updatedRule.getFixedAmount());
                    rule.setMaxAmount(updatedRule.getMaxAmount());
                    rule.setApplicableFrom(updatedRule.getApplicableFrom());
                    return ResponseEntity.ok(deductionRuleRepository.save(rule));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Deduction rule not found with id " + id));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to update deduction rule: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeductionRule(@PathVariable Long id) {
        try {
            if (!deductionRuleRepository.existsById(id)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Deduction rule not found with id " + id);
            }
            deductionRuleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to delete deduction rule: " + e.getMessage());
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<DeductionRule>> getActiveDeductionRules() {
        try {
            List<DeductionRule> rules = deductionRuleRepository.findAll();
            return ResponseEntity.ok(rules);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to fetch active deduction rules: " + e.getMessage());
        }
    }
}
