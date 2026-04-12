package com.corporate.payroll.dto;

import com.corporate.payroll.enums.PayrollStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class PayrollCycleResponse {
    private Long id;
    private Integer month;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate paymentDate;
    private PayrollStatus status;
    private int totalEmployees;
    private double totalGrossSalary;
    private double totalNetSalary;
    private double totalAmount;
    private String financialYear;
}
