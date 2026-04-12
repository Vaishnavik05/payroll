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
    private String name;
    private String componentType;
    private Double percentage;
    private Double maxAmount;
    private Boolean isActive;
    private String description;
    private String calculationFormula;
}
