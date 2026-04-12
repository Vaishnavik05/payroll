package com.corporate.payroll.repository;

import com.corporate.payroll.entity.DeductionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeductionRuleRepository extends JpaRepository<DeductionRule, Long> {
}
