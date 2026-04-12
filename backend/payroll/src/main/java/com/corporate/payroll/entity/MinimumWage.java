package com.corporate.payroll.entity;

import jakarta.persistence.*;
import lombok.*;
import com.corporate.payroll.enums.State;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "minimum_wage")
public class MinimumWage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private State state;
    
    @Column(name = "minimum_monthly_wage", nullable = false)
    private Double minimumMonthlyWage;
    
    @Column(name = "effective_from", nullable = false)
    private java.time.LocalDate effectiveFrom;
    
    @Column(name = "effective_to")
    private java.time.LocalDate effectiveTo;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
    }
}
