package com.corporate.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaxResponse {
    private Long employeeId;
    private BigDecimal annualTax;
    private BigDecimal monthlyTax;
    private String financialYear;
}
