package com.corporate.payroll.config;

import com.corporate.payroll.entity.DeductionRule;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.entity.MinimumWage;
import com.corporate.payroll.repository.DeductionRuleRepository;
import com.corporate.payroll.repository.MinimumWageRepository;
import com.corporate.payroll.repository.UserRepository;
import com.corporate.payroll.enums.State;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final DeductionRuleRepository deductionRuleRepository;
    private final UserRepository userRepository;
    private final MinimumWageRepository minimumWageRepository;
    
    @Override
    public void run(String... args) throws Exception {
        initializeDeductionRules();
        initializeMinimumWages();
        initializeSampleUsers();
    }
    
    private void initializeDeductionRules() {
        // Clear existing rules first
        deductionRuleRepository.deleteAll();
        
        if (deductionRuleRepository.count() == 0) {
            
            // Create standard deduction rules
            DeductionRule pf = DeductionRule.builder()
                .name("Provident Fund")
                .componentType("DEDUCTION")
                .percentage(12.0)
                .description("Employee Provident Fund contribution")
                .calculationFormula("12% of Basic + DA")
                .isActive(true)
                .build();
                
            DeductionRule esi = DeductionRule.builder()
                .name("Employee State Insurance")
                .componentType("DEDUCTION")
                .percentage(0.75)
                .maxAmount(157.50)
                .description("Employee State Insurance contribution")
                .calculationFormula("0.75% of Gross (max ₹157.50)")
                .isActive(true)
                .build();
                
            DeductionRule pt = DeductionRule.builder()
                .name("Professional Tax")
                .componentType("DEDUCTION")
                .percentage(null)
                .maxAmount(200.0)
                .description("Professional Tax deduction")
                .calculationFormula("Fixed ₹200 per month")
                .isActive(true)
                .build();
                
            DeductionRule tds = DeductionRule.builder()
                .name("Tax Deduction at Source")
                .componentType("DEDUCTION")
                .percentage(null)
                .description("Income Tax deduction")
                .calculationFormula("As per tax slabs")
                .isActive(true)
                .build();

            deductionRuleRepository.save(pf);
            deductionRuleRepository.save(esi);
            deductionRuleRepository.save(pt);
            deductionRuleRepository.save(tds);
            
            System.out.println("Default deduction rules initialized successfully!");
        }
    }
    
    private void initializeMinimumWages() {
        // Clear existing rules first
        minimumWageRepository.deleteAll();
        
        if (minimumWageRepository.count() == 0) {
            
            // Initialize minimum wages for all Indian states
            for (State state : State.values()) {
                MinimumWage minimumWage = MinimumWage.builder()
                    .state(state)
                    .minimumMonthlyWage(state.getMinimumMonthlyWage())
                    .effectiveFrom(java.time.LocalDate.of(2024, 1, 1))
                    .isActive(true)
                    .build();
                minimumWageRepository.save(minimumWage);
            }
            
            System.out.println("Minimum wage rules initialized successfully!");
        }
    }
    
    private void initializeSampleUsers() {
        if (userRepository.count() == 0) {
            // Find existing users by employee code or create sample ones if they don't exist
            User employee1 = userRepository.findByEmployeeCode("EMP001").orElseGet(() -> {
                User user = new User();
                user.setName("John Doe");
                user.setEmail("john.doe@company.com");
                user.setEmployeeCode("EMP001");
                user.setRole(com.corporate.payroll.enums.Role.EMPLOYEE);
                user.setDepartment("IT");
                user.setState(State.MAHARASHTRA);
                user.setJoiningDate(java.time.LocalDate.of(2023, 1, 15));
                user.setActive(true);
                return userRepository.save(user);
            });
            
            User employee2 = userRepository.findByEmployeeCode("EMP002").orElseGet(() -> {
                User user = new User();
                user.setName("Jane Smith");
                user.setEmail("jane.smith@company.com");
                user.setEmployeeCode("EMP002");
                user.setRole(com.corporate.payroll.enums.Role.EMPLOYEE);
                user.setDepartment("HR");
                user.setState(State.KARNATAKA);
                user.setJoiningDate(java.time.LocalDate.of(2022, 6, 1));
                user.setActive(true);
                return userRepository.save(user);
            });
            
            User employee3 = userRepository.findByEmployeeCode("EMP003").orElseGet(() -> {
                User user = new User();
                user.setName("Mike Wilson");
                user.setEmail("mike.wilson@company.com");
                user.setEmployeeCode("EMP003");
                user.setRole(com.corporate.payroll.enums.Role.EMPLOYEE);
                user.setDepartment("Finance");
                user.setState(State.DELHI);
                user.setJoiningDate(java.time.LocalDate.of(2021, 3, 10));
                user.setActive(true);
                return userRepository.save(user);
            });
            
            // Skip tax computation creation for now due to database schema issues
            // Tax computations will be created when payroll cycles are processed
            System.out.println("Sample users initialized successfully!");
        }
    }
}
