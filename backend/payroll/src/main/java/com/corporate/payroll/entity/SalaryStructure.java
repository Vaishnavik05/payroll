package com.corporate.payroll.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
@Entity
@Data
public class SalaryStructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Double basic;
    private Double hra;
    private Double da;
    private Double specialAllowance;
    private Double bonus;
    private Double lta;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;
}