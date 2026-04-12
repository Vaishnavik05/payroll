package com.corporate.payroll.controller;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.UserRepository;
import com.corporate.payroll.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id);
    }
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        return userRepository.findById(id)
            .map(user -> {
                user.setName(updatedUser.getName());
                user.setEmail(updatedUser.getEmail());
                user.setEmployeeCode(updatedUser.getEmployeeCode());
                user.setRole(updatedUser.getRole());
                user.setDepartment(updatedUser.getDepartment());
                user.setJoiningDate(updatedUser.getJoiningDate());
                user.setActive(updatedUser.isActive());
                return userRepository.save(user);
            })
            .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable String role) {
        return userRepository.findAll().stream()
            .filter(user -> user.getRole().name().equalsIgnoreCase(role))
            .toList();
    }
    @GetMapping(params = "role")
    public List<User> getUsersByRole(@RequestParam Role role) {
        return userRepository.findByRole(role);
    }
}
