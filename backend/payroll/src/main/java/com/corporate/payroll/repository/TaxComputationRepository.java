package com.corporate.payroll.repository;

import com.corporate.payroll.entity.TaxComputation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface TaxComputationRepository extends JpaRepository<TaxComputation, Long> {
    
    @Query("SELECT t FROM TaxComputation t WHERE t.financialYear = :financialYear")
    List<TaxComputation> findByFinancialYear(String financialYear);
    
    @Query("SELECT t FROM TaxComputation t WHERE t.employee.id = :employeeId ORDER BY t.createdAt DESC")
    List<TaxComputation> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    
    @Query("SELECT t FROM TaxComputation t WHERE t.employee.id = :employeeId AND t.financialYear = :financialYear ORDER BY t.createdAt DESC")
    List<TaxComputation> findByEmployeeIdAndFinancialYearOrderByCreatedAtDesc(Long employeeId, String financialYear);
}
