package com.corporate.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollProcessingResponse {
    private String message;
    private boolean success;
    private int employeesProcessed;
    private int employeesSkipped;
    private List<String> warnings;
    private List<String> errors;
    private LocalDateTime processedAt;
    private String payrollCycleId;
}
