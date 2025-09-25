package com.example.devops.repo;

import com.example.devops.model.SeatLocks;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatLocksRepository extends JpaRepository<SeatLocks, Long> {
}
