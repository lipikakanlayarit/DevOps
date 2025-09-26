package com.example.devops.repo;

import com.example.devops.model.AdminUsers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminUserRepository extends JpaRepository<AdminUsers, Long> {
    Optional<AdminUsers> findByEmail(String email);
}
