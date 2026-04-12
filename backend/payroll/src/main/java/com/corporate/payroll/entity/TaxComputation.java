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
    
    @Column(name = "financial_year")
    private String financialYear;
    
    @Column(name = "total_income")
    private Double totalIncome;
    
    
    @Column(name = "taxable_income")
    private Double taxableIncome;
    
    @Column(name = "tax_payable")
    private Double taxPayable;
    
    @Column(name = "cess")
    private Double cess;
    
    @Column(name = "total_tax")
    private Double totalTax;
    
    @Column(name = "tds_deducted")
    private Double tdsDeducted;
    
    
    
    @Column(name = "deductions")
    private Double deductions;
    
    @Column(name = "status")
    private String status;
    
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = "COMPUTED";
        }
    }
}
