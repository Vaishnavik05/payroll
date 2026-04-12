package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.User;
import com.corporate.payroll.enums.Role;
import java.util.List;
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByRole(Role role);
}