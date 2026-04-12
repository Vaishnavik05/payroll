package com.corporate.payroll.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.MinimumWage;
import com.corporate.payroll.enums.State;
import java.util.List;
import java.util.Optional;

public interface MinimumWageRepository extends JpaRepository<MinimumWage, Long> {
    Optional<MinimumWage> findByStateAndIsActiveTrue(State state);
    List<MinimumWage> findByIsActiveTrue();
}
