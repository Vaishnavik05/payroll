package com.corporate.payroll.controller;

import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // First find user by email to get the correct user
            Optional<User> userByEmail = userRepository.findByEmailIgnoreCase(loginRequest.getEmail().trim());
            
            if (userByEmail.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email not found in our records"
                ));
            }
            
            User user = userByEmail.get();
            
            // Validate employee code matches
            if (!user.getEmployeeCode().equals(loginRequest.getEmployeeCode().trim())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Employee code does not match our records"
                ));
            }
            
            // Check if user is active
            if (!user.isActive()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Account is deactivated"
                ));
            }
            
            // Validate role matches selected role
            if (!user.getRole().name().equals(loginRequest.getRole())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Selected role does not match our records. Your role is: " + user.getRole().name()
                ));
            }
            
            // Create response with user details
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "employeeCode", user.getEmployeeCode(),
                "role", user.getRole().name(),
                "department", user.getDepartment()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Login failed: " + e.getMessage()
            ));
        }
    }
    
    // DTO for login request
    public static class LoginRequest {
        private String email;
        private String employeeCode;
        private String role;
        
        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
