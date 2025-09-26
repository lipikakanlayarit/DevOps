package com.example.devops.repo;

import com.example.devops.model.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminUserRepo extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByEmail(String email);
}
