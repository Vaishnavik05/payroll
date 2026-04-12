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
    
    @Column(name = "component_name", nullable = false)
    private String componentName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false)
    private ComponentType componentType;
    
    @Column(nullable = false)
    private Double amount;
    
    @Column(columnDefinition = "TEXT")
    private String calculationFormula;
}