package com.corporate.payroll.entity;
import jakarta.persistence.*;
import lombok.*;
import com.corporate.payroll.enums.Role;
import com.corporate.payroll.enums.State;
import java.time.LocalDate;
@Entity
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String employeeCode;
    @Enumerated(EnumType.STRING)
    private Role role;
    private String department;
    @Enumerated(EnumType.STRING)
    private State state;
    private LocalDate joiningDate;
    private boolean isActive = true;
}