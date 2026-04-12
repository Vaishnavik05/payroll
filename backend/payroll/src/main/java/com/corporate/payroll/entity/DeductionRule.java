package com.corporate.payroll.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "deduction_rule")
public class DeductionRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String deductionType;
    private Double percentage;
    private Double fixedAmount;
    private Double maxAmount;
    private String applicableFrom;
}
