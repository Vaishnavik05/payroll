package com.corporate.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationResponse {
    private Long employeeId;
    private boolean valid;
    private String message;
    private String[] warnings;
}
