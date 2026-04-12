package com.corporate.payroll.entity;
import jakarta.persistence.*;
import lombok.*;
import com.corporate.payroll.enums.ComponentType;
import java.time.LocalDateTime;
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
    
    @Column(nullable = false)
    private String componentName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComponentType componentType;
    
    @Column(nullable = false)
    private Double amount;
    
    @Column(columnDefinition = "TEXT")
    private String calculationFormula;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "is_taxable")
    @Builder.Default
    private Boolean isTaxable = true;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}