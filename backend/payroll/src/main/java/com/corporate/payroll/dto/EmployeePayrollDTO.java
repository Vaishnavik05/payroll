package com.corporate.payroll.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EmployeePayrollDTO {
    private Long id;
    private String employeeCode;
    private String employeeName;
    private Double gross;
    private Double totalDeductions;
    private Double netSalary;
    private String status;
    private String bankReference;
    private LocalDateTime paidAt;
}
