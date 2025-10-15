package com.example.devops.repo;

import com.example.devops.model.ZoneTicketTypes;
import com.example.devops.model.ZoneTicketTypesId;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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

    // ---------- เมธอดที่เติมใหม่ ----------

    /** ดึง ticket_type_id ทั้งหมดของโซนหนึ่ง ๆ */
    @Query(value = """
        SELECT ztt.ticket_type_id
        FROM zone_ticket_types ztt
        WHERE ztt.zone_id = :zoneId
        """, nativeQuery = true)
    List<Long> findTicketTypeIdsByZoneId(@Param("zoneId") Long zoneId);

    /** ดึงราคาตั๋วอันแรกของโซนหนึ่ง ๆ (ถ้า schema ของคุณเก็บราคาในตาราง ticket_types) */
    @Query(value = """
        SELECT t.price
        FROM ticket_types t
        JOIN zone_ticket_types ztt ON ztt.ticket_type_id = t.ticket_type_id
        WHERE ztt.zone_id = :zoneId
        ORDER BY t.price DESC
        LIMIT 1
        """, nativeQuery = true)
    BigDecimal findFirstPriceByZoneId(@Param("zoneId") Long zoneId);

    /** เอาไว้เรียกดู mapping ทั้งหมดของโซนเดียว */
    @Query(value = """
        SELECT ztt.* FROM zone_ticket_types ztt
        WHERE ztt.zone_id = :zoneId
        """, nativeQuery = true)
    List<ZoneTicketTypes> findByZoneId(@Param("zoneId") Long zoneId);

    @Modifying
    @Query(value = """
        DELETE FROM zone_ticket_types
        WHERE zone_id = :zoneId
        """, nativeQuery = true)
    void deleteByZoneId(@Param("zoneId") Long zoneId);
}
