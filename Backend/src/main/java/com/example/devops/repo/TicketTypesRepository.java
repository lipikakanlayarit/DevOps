package com.example.devops.repo;

import com.example.devops.model.TicketTypes;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketTypesRepository extends JpaRepository<TicketTypes, Long> {

    @Query(value = "SELECT * FROM ticket_types WHERE event_id = :eventId ORDER BY ticket_type_id", nativeQuery = true)
    List<TicketTypes> findByEventId(@Param("eventId") Long eventId);
}
