package com.corporate.payroll.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.corporate.payroll.enums.PayoutStatus;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "employee_payroll")
public class EmployeePayroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;
    @ManyToOne(optional = false)
    @JoinColumn(name = "payroll_cycle_id", nullable = false)
    private PayrollCycle payrollCycle;
    private Double gross;
    private Double totalDeductions;
    private Double netSalary;
    @Enumerated(EnumType.STRING)
    private PayoutStatus status;
    private String bankReference;
    private LocalDateTime paidAt;
    private Double basic;
    private Double hra;
    private Double da;
    private Double specialAllowance;
    private Double bonus;
    private Double lta;
}