package com.corporate.payroll.service;

import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.UserRepository;
import com.corporate.payroll.enums.Role;
import com.corporate.payroll.enums.State;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserRegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(String name, String email, String password, String employeeCode, 
                           Role role, String department, State state, LocalDate joiningDate) {
        
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new RuntimeException("User with email " + email + " already exists");
        }
        
        if (userRepository.findByEmployeeCode(employeeCode).isPresent()) {
            throw new RuntimeException("User with employee code " + employeeCode + " already exists");
        }
        
        User user = new User();
        user.setName(name);
        user.setEmail(email.toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setEmployeeCode(employeeCode.toUpperCase().trim());
        user.setRole(role);
        user.setDepartment(department);
        user.setState(state);
        user.setJoiningDate(joiningDate != null ? joiningDate : LocalDate.now());
        user.setActive(true);
        
        return userRepository.save(user);
    }

    public User updateUserPassword(String email, String newPassword) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with email: " + email);
        }
        
        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    public boolean validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        if (!password.matches(".*[A-Z].*")) {
            return false;
        }
        
        if (!password.matches(".*[a-z].*")) {
            return false;
        }
        
        if (!password.matches(".*\\d.*")) {
            return false;
        }
        
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            return false;
        }
        
        return true;
    }

    public String getPasswordStrengthMessage() {
        return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }
}
