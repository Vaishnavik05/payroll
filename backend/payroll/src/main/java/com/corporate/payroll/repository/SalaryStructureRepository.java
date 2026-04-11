package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.*;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {
    SalaryStructure findByEmployee(User employee);
}
