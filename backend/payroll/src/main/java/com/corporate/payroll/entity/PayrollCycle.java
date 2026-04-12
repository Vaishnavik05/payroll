package com.corporate.payroll.entity;
import jakarta.persistence.*;
import lombok.*;
import com.corporate.payroll.enums.PayrollStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity
@Data
public class PayrollCycle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int month;
    private int year;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate paymentDate;
    @Enumerated(EnumType.STRING)
    private PayrollStatus status = PayrollStatus.DRAFT;
    private LocalDateTime createdAt = LocalDateTime.now();
}