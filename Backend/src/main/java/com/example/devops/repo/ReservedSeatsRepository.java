package com.example.devops.repo;

import com.example.devops.model.ReservedSeats;
import com.example.devops.model.ReservedSeatsId;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservedSeatsRepository extends JpaRepository<ReservedSeats, ReservedSeatsId> {
}
