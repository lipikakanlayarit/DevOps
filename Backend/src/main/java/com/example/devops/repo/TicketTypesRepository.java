package com.example.devops.repo;

import com.example.devops.model.TicketTypes;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketTypesRepository extends JpaRepository<TicketTypes, Long> {
}
