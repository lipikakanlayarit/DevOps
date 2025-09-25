package com.example.devops.repo;

import com.example.devops.model.ZoneTicketTypes;
import com.example.devops.model.ZoneTicketTypesId;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ZoneTicketTypesRepository extends JpaRepository<ZoneTicketTypes, ZoneTicketTypesId> {
}
