
package com.example.devops.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.devops.model.TicketTypes;
import java.math.BigDecimal;

@Repository
public interface TicketTypesRepository extends JpaRepository<TicketTypes, Long> {

    @Query(value = "SELECT COALESCE(MIN(price),0) FROM ticket_types WHERE event_id = ?1", nativeQuery = true)
    BigDecimal findMinPriceByEventIdNative(Long eventId);
}
