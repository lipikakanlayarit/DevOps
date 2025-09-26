package com.example.devops.repo;

import com.example.devops.model.UserSessions;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionsRepository extends JpaRepository<UserSessions, Long> {
}
