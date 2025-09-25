package com.example.devops.repo;

import com.example.devops.model.AdminUsers;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUsersRepository extends JpaRepository<AdminUsers, Long> {
}
