package com.corporate.payroll.entity;
import jakarta.persistence.*;
import lombok.*;
import com.corporate.payroll.enums.ComponentType;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "salary_breakup")
public class SalaryBreakup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_payroll_id", nullable = false)
    private EmployeePayroll employeePayroll;
    private String componentName;
    @Enumerated(EnumType.STRING)
    private ComponentType componentType;
    private Double amount;
    private String calculationFormula;
}