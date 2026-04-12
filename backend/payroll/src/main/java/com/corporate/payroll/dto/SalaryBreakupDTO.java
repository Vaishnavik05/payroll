package com.corporate.payroll.dto;

import com.corporate.payroll.enums.ComponentType;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SalaryBreakupDTO {
    private Long id;
    private ComponentType componentType;
    private String componentName;
    private BigDecimal amount;
    private String calculationFormula;
}
