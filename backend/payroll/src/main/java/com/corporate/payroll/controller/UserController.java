package com.corporate.payroll.controller;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }
}
