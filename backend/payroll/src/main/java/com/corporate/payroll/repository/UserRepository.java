package com.corporate.payroll.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.corporate.payroll.entity.User;
public interface UserRepository extends JpaRepository<User, Long> {

}