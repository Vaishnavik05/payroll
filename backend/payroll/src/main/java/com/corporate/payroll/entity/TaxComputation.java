package com.corporate.payroll.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "tax_computation")
public class TaxComputation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;
    
    @Column(name = "financialYear")
    private String financialYear;
    
    @Column(name = "totalIncome")
    private Double totalIncome;
    
    @Column(name = "totalDeductions")
    private Double totalDeductions;
    
    @Column(name = "taxableIncome")
    private Double taxableIncome;
    
    @Column(name = "taxPayable")
    private Double taxPayable;
    
    @Column(name = "cess")
    private Double cess;
    
    @Column(name = "totalTax")
    private Double totalTax;
    
    @Column(name = "taxDeducted")
    private Double taxDeducted;
    
    @Column(name = "taxStatus")
    private String taxStatus;
    
    @PrePersist
    protected void onCreate() {
        if (taxStatus == null) {
            taxStatus = "COMPUTED";
        }
    }
}
