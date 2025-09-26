package com.example.devops.repo;

import com.example.devops.model.Organizer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganizerRepo extends JpaRepository<Organizer, Long> {
    Optional<Organizer> findByEmail(String email);
}
