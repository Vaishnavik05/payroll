package com.corporate.payroll.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.corporate.payroll.repository.*;
import com.corporate.payroll.entity.*;
import java.util.*;
import java.time.LocalDateTime;
import java.time.YearMonth;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    
    private final UserRepository userRepository;
    private final EmployeePayrollRepository payrollRepository;
    private final PayrollCycleRepository payrollCycleRepository;
    private final TaxComputationRepository taxComputationRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User Statistics
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream().filter(User::isActive).count();
        long inactiveUsers = totalUsers - activeUsers;
        
        // Role Statistics
        Map<String, Long> roleCounts = allUsers.stream()
            .filter(user -> user.getRole() != null)
            .collect(java.util.stream.Collectors.groupingBy(
                user -> user.getRole().toString(),
                java.util.stream.Collectors.counting()
            ));
        
        // Department Statistics
        Map<String, Long> departmentCounts = allUsers.stream()
            .filter(user -> user.getDepartment() != null)
            .collect(java.util.stream.Collectors.groupingBy(
                User::getDepartment,
                java.util.stream.Collectors.counting()
            ));
        
        // Payroll Statistics
        List<EmployeePayroll> allPayrolls = payrollRepository.findAll();
        long totalPayrollsProcessed = allPayrolls.size();
        
        // Current month payroll stats
        YearMonth currentMonth = YearMonth.now();
        List<EmployeePayroll> currentMonthPayrolls = allPayrolls.stream()
            .filter(p -> p.getPaidAt() != null)
            .filter(p -> {
                LocalDateTime paidAt = p.getPaidAt();
                return YearMonth.from(paidAt).equals(currentMonth);
            })
            .toList();
        
        // Financial Statistics
        double totalGrossSalary = allPayrolls.stream()
            .mapToDouble(p -> p.getGross() != null ? p.getGross() : 0.0)
            .sum();
        
        double totalNetSalary = allPayrolls.stream()
            .mapToDouble(p -> p.getNetSalary() != null ? p.getNetSalary() : 0.0)
            .sum();
        
        double totalDeductions = allPayrolls.stream()
            .mapToDouble(p -> p.getTotalDeductions() != null ? p.getTotalDeductions() : 0.0)
            .sum();
        
        double averageSalary = totalUsers > 0 ? totalGrossSalary / totalUsers : 0.0;
        
        // Tax Statistics
        List<TaxComputation> taxComputations = taxComputationRepository.findAll();
        double totalTaxCollected = taxComputations.stream()
            .mapToDouble(t -> t.getTaxDeducted() != null ? t.getTaxDeducted() : 0.0)
            .sum();
        
        // Payroll Cycle Statistics
        List<PayrollCycle> payrollCycles = payrollCycleRepository.findAll();
        long completedCycles = payrollCycles.stream()
            .filter(c -> c.getStatus() == com.corporate.payroll.enums.PayrollStatus.COMPLETED)
            .count();
        
        // Recent Activity
        long recentPayrolls = allPayrolls.stream()
            .filter(p -> p.getPaidAt() != null)
            .filter(p -> p.getPaidAt().isAfter(LocalDateTime.now().minusDays(7)))
            .count();
        
        // Salary Structure Statistics
        List<SalaryStructure> salaryStructures = salaryStructureRepository.findAll();
        long employeesWithSalaryStructure = salaryStructures.stream()
            .map(SalaryStructure::getEmployee)
            .filter(Objects::nonNull)
            .map(User::getId)
            .distinct()
            .count();
        
        // Build response
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("totalRoles", roleCounts.size());
        stats.put("roleBreakdown", roleCounts);
        stats.put("totalDepartments", departmentCounts.size());
        stats.put("departmentBreakdown", departmentCounts);
        stats.put("totalPayrollsProcessed", totalPayrollsProcessed);
        stats.put("currentMonthPayrolls", currentMonthPayrolls.size());
        stats.put("totalGrossSalary", totalGrossSalary);
        stats.put("totalNetSalary", totalNetSalary);
        stats.put("totalDeductions", totalDeductions);
        stats.put("averageSalary", averageSalary);
        stats.put("totalTaxCollected", totalTaxCollected);
        stats.put("completedPayrollCycles", completedCycles);
        stats.put("totalPayrollCycles", payrollCycles.size());
        stats.put("recentPayrolls", recentPayrolls);
        stats.put("employeesWithSalaryStructure", employeesWithSalaryStructure);
        
        // Additional computed metrics
        stats.put("payrollProcessingRate", totalUsers > 0 ? (double) employeesWithSalaryStructure / totalUsers * 100 : 0.0);
        stats.put("taxComplianceRate", totalPayrollsProcessed > 0 ? (double) taxComputations.size() / totalPayrollsProcessed * 100 : 0.0);
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/recent-activity")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivity() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        // Recent payroll processing
        List<EmployeePayroll> recentPayrolls = payrollRepository.findAll().stream()
            .filter(p -> p.getPaidAt() != null)
            .filter(p -> p.getPaidAt().isAfter(LocalDateTime.now().minusDays(7)))
            .sorted((a, b) -> b.getPaidAt().compareTo(a.getPaidAt()))
            .limit(10)
            .toList();
        
        for (EmployeePayroll payroll : recentPayrolls) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "PAYROLL_PROCESSED");
            activity.put("description", "Payroll processed for " + 
                (payroll.getEmployee() != null ? payroll.getEmployee().getName() : "Unknown"));
            activity.put("amount", payroll.getNetSalary());
            activity.put("timestamp", payroll.getPaidAt());
            activity.put("employeeCode", payroll.getEmployee() != null ? payroll.getEmployee().getEmployeeCode() : "N/A");
            activities.add(activity);
        }
        
        return ResponseEntity.ok(activities);
    }
}
