package com.corporate.payroll.controller;

import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.UserRepository;
import com.corporate.payroll.security.JwtTokenProvider;
import com.corporate.payroll.security.RateLimitingService;
import com.corporate.payroll.service.UserRegistrationService;
import com.corporate.payroll.enums.Role;
import com.corporate.payroll.enums.State;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RateLimitingService rateLimitingService;
    private final UserRegistrationService userRegistrationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        // Validate required fields
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email is required"
            ));
        }
        
        if (loginRequest.getEmployeeCode() == null || loginRequest.getEmployeeCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Employee code is required"
            ));
        }
        
        if (loginRequest.getRole() == null || loginRequest.getRole().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Role is required"
            ));
        }
        
        String email = loginRequest.getEmail().trim();
        log.info("Login attempt for email: {}", email);
        
        // Check rate limiting
        if (rateLimitingService.isLocked(email)) {
            long lockTimeRemaining = rateLimitingService.getLockTimeRemaining(email);
            log.warn("Account locked due to too many failed attempts: {}, lock time remaining: {} minutes", 
                    email, lockTimeRemaining / 60000);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Account locked due to too many failed attempts. Try again in " + (lockTimeRemaining / 60000) + " minutes.",
                "remainingAttempts", 0,
                "lockTimeRemaining", lockTimeRemaining
            ));
        }

        try {
            Optional<User> userByEmail = userRepository.findByEmailIgnoreCase(email);
            
            if (userByEmail.isEmpty()) {
                rateLimitingService.recordFailedAttempt(email);
                int remainingAttempts = rateLimitingService.getRemainingAttempts(email);
                log.warn("Login failed - email not found: {}, remaining attempts: {}", email, remainingAttempts);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email not found in our records",
                    "remainingAttempts", remainingAttempts
                ));
            }
            
            User user = userByEmail.get();
            
            if (!user.isActive()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Account is deactivated"
                ));
            }
            
            if (!user.getEmployeeCode().equals(loginRequest.getEmployeeCode().trim())) {
                rateLimitingService.recordFailedAttempt(email);
                int remainingAttempts = rateLimitingService.getRemainingAttempts(email);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Employee code does not match our records",
                    "remainingAttempts", remainingAttempts
                ));
            }
            
            if (!user.getRole().name().equals(loginRequest.getRole())) {
                rateLimitingService.recordFailedAttempt(email);
                int remainingAttempts = rateLimitingService.getRemainingAttempts(email);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Selected role does not match our records. Your role is: " + user.getRole().name(),
                    "remainingAttempts", remainingAttempts
                ));
            }
            
            // Create authentication token using employee code as the credential
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                email, 
                loginRequest.getEmployeeCode(), 
                java.util.Collections.emptyList()
            );
            
            String token = jwtTokenProvider.generateTokenFromUserDetails(
                user.getEmail(), 
                java.util.List.of(user.getRole().name()), 
                user.getId()
            );
            
            rateLimitingService.recordSuccessfulAttempt(email);
            
            log.info("Login successful for user: {} (ID: {}, Role: {})", 
                    user.getEmail(), user.getId(), user.getRole());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("tokenType", "Bearer");
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
            rateLimitingService.recordFailedAttempt(email);
            int remainingAttempts = rateLimitingService.getRemainingAttempts(email);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Login failed: " + e.getMessage(),
                "remainingAttempts", remainingAttempts
            ));
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        log.info("User registration attempt for email: {}", registerRequest.getEmail());
        try {
            if (registerRequest.getName() == null || registerRequest.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Name is required"
                ));
            }
            
            if (registerRequest.getEmail() == null || registerRequest.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email is required"
                ));
            }
            
            if (registerRequest.getPassword() == null || registerRequest.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Password is required"
                ));
            }
            
            if (registerRequest.getEmployeeCode() == null || registerRequest.getEmployeeCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Employee code is required"
                ));
            }
            
            if (registerRequest.getRole() == null || registerRequest.getRole().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Role is required"
                ));
            }
            
            if (!userRegistrationService.validatePasswordStrength(registerRequest.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", userRegistrationService.getPasswordStrengthMessage()
                ));
            }

            Role role;
            State state;
            try {
                role = Role.valueOf(registerRequest.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid role. Valid roles: ADMIN, HR_MANAGER, FINANCE, EMPLOYEE"
                ));
            }
            
            try {
                state = registerRequest.getState() != null ? 
                    State.valueOf(registerRequest.getState().toUpperCase()) : State.KARNATAKA;
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid state. Please use a valid Indian state (e.g., KARNATAKA, MAHARASHTRA, DELHI, etc.)"
                ));
            }

            User user = userRegistrationService.registerUser(
                registerRequest.getName().trim(),
                registerRequest.getEmail().trim().toLowerCase(),
                registerRequest.getPassword(),
                registerRequest.getEmployeeCode().trim().toUpperCase(),
                role,
                registerRequest.getDepartment() != null ? registerRequest.getDepartment().trim() : "General",
                state,
                registerRequest.getJoiningDate() != null ? registerRequest.getJoiningDate() : LocalDate.now()
            );

            log.info("User registered successfully: {} (ID: {}, Role: {})", 
                    user.getEmail(), user.getId(), user.getRole());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User registered successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "employeeCode", user.getEmployeeCode(),
                    "role", user.getRole().name(),
                    "department", user.getDepartment()
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Registration failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Logout successful"
        ));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        log.debug("Token refresh attempt");
        
        // Validate request
        if (request == null || request.get("token") == null || request.get("token").trim().isEmpty()) {
            log.warn("Token refresh failed - no token provided");
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Token is required"
            ));
        }
        
        String token = request.get("token").trim();
        
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("Token refresh failed - invalid or expired token");
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid or expired token"
            ));
        }
        
        try {
            String username = jwtTokenProvider.getUsernameFromToken(token);
            List<String> roles = jwtTokenProvider.getRolesFromToken(token);
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            
            log.debug("Refreshing token for user: {}", username);
            
            // Generate new token
            String newToken = jwtTokenProvider.generateTokenFromUserDetails(username, roles, userId);
            
            log.info("Token refreshed successfully for user: {}", username);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", newToken,
                "tokenType", "Bearer"
            ));
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to refresh token: " + e.getMessage()
            ));
        }
    }

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String employeeCode;
        private String role;
        private String department;
        private String state;
        private LocalDate joiningDate;
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        
        public LocalDate getJoiningDate() { return joiningDate; }
        public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }
    }

    public static class LoginRequest {
        private String email;
        private String employeeCode;
        private String role;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
