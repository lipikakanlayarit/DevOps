package com.example.devops.repo;

import com.example.devops.model.ZoneTicketTypes;
import com.example.devops.model.ZoneTicketTypesId;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ZoneTicketTypesRepository extends JpaRepository<ZoneTicketTypes, ZoneTicketTypesId> {

    @Query(value = """
        SELECT ztt.* FROM zone_ticket_types ztt
        JOIN seat_zones z ON z.zone_id = ztt.zone_id
        WHERE z.event_id = :eventId
        """, nativeQuery = true)
    List<ZoneTicketTypes> findByEventId(@Param("eventId") Long eventId);

    @Modifying
    @Query(value = """
        DELETE FROM zone_ticket_types
        WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = :eventId)
        """, nativeQuery = true)
    void deleteByEventId(@Param("eventId") Long eventId);
}
