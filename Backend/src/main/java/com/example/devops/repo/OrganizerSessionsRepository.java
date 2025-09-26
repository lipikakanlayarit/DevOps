package com.example.devops.repo;

import com.example.devops.model.OrganizerSessions;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizerSessionsRepository extends JpaRepository<OrganizerSessions, Long> {
}
