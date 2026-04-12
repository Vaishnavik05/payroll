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
        deductionRuleRepository.deleteAll();
        
        if (deductionRuleRepository.count() == 0) {
            DeductionRule pf = DeductionRule.builder()
                .deductionType("Provident Fund")
                .percentage(12.0)
                .fixedAmount(null)
                .maxAmount(null)
                .applicableFrom("2024-01-01")
                .build();
                
            DeductionRule esi = DeductionRule.builder()
                .deductionType("Employee State Insurance")
                .percentage(0.75)
                .fixedAmount(null)
                .maxAmount(157.50)
                .applicableFrom("2024-01-01")
                .build();
                
            DeductionRule pt = DeductionRule.builder()
                .deductionType("Professional Tax")
                .percentage(null)
                .fixedAmount(200.0)
                .maxAmount(200.0)
                .applicableFrom("2024-01-01")
                .build();
                
            DeductionRule tds = DeductionRule.builder()
                .deductionType("Tax Deduction at Source")
                .percentage(null)
                .fixedAmount(null)
                .maxAmount(null)
                .applicableFrom("2024-01-01")
                .build();

            deductionRuleRepository.save(pf);
            deductionRuleRepository.save(esi);
            deductionRuleRepository.save(pt);
            deductionRuleRepository.save(tds);
            
            System.out.println("Default deduction rules initialized successfully!");
            System.out.println("Created rules: PF, ESI, PT, TDS with simplified structure");
        }
    }
    
    private void initializeMinimumWages() {
        minimumWageRepository.deleteAll();
        
        if (minimumWageRepository.count() == 0) {
        
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
            System.out.println("Sample users initialized successfully!");
        }
    }
}
