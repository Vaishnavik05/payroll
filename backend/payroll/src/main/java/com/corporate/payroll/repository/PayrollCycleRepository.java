package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.PayrollCycle;
public interface PayrollCycleRepository extends JpaRepository<PayrollCycle, Long> {
    
}
