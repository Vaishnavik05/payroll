package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.SalaryStructure;
import com.corporate.payroll.entity.User;
import java.util.List;
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {
    List<SalaryStructure> findByEmployee(User employee);
}