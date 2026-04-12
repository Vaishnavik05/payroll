package com.corporate.payroll.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.List;
import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.repository.EmployeePayrollRepository;
@RestController
@RequestMapping("/api/payslips")
@RequiredArgsConstructor
public class PayslipController {
    private final EmployeePayrollRepository employeePayrollRepository;
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeePayroll>> getPayslipsForEmployee(@PathVariable Long employeeId) {
        List<EmployeePayroll> payrolls = employeePayrollRepository.findByEmployee_Id(employeeId);
        if (payrolls.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No payslips found for employeeId " + employeeId);
        }
        return ResponseEntity.ok(payrolls);
    }
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable Long id) {
        Optional<EmployeePayroll> payrollOpt = employeePayrollRepository.findById(id);
        if (payrollOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payslip not found for id " + id);
        }
        EmployeePayroll payroll = payrollOpt.get();
        String payslipContent = "Payslip for Employee: " + payroll.getEmployee().getName() + "\n"
                + "Gross Salary: " + payroll.getGross() + "\n"
                + "Net Salary: " + payroll.getNetSalary() + "\n"
                + "Paid At: " + payroll.getPaidAt() + "\n";

        byte[] fileBytes = payslipContent.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip_" + id + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .body(fileBytes);
    }
}
