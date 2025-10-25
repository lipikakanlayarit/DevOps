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
        SELECT ztt.* 
          FROM zone_ticket_types ztt
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

    /** ✅ ticket_type_id ทั้งหมดของโซน (เรียงตาม id เพื่อให้ deterministic) */
    @Query(value = """
        SELECT ztt.ticket_type_id
          FROM zone_ticket_types ztt
         WHERE ztt.zone_id = :zoneId
         ORDER BY ztt.ticket_type_id ASC
        """, nativeQuery = true)
    List<Long> findTicketTypeIdsByZoneId(@Param("zoneId") Long zoneId);

    /** ✅ ราคาแรกของโซน (ผ่าน mapping zone↔ticket_type) */
    @Query(value = """
        SELECT t.price
          FROM zone_ticket_types ztt
          JOIN ticket_types t ON t.ticket_type_id = ztt.ticket_type_id
         WHERE ztt.zone_id = :zoneId
         ORDER BY t.ticket_type_id ASC
         LIMIT 1
        """, nativeQuery = true)
    BigDecimal findFirstPriceByZoneId(@Param("zoneId") Long zoneId);

    /** ✅ Fallback: หา price ด้วย typeKey (เช่น VVIP/VIP) ภายในอีเวนต์ */
    @Query(value = """
        SELECT t.price
          FROM ticket_types t
         WHERE t.event_id = :eventId
           AND UPPER(t.type_name) = UPPER(:typeKey)
         LIMIT 1
        """, nativeQuery = true)
    BigDecimal findPriceByEventAndTypeKey(@Param("eventId") Long eventId, @Param("typeKey") String typeKey);

    @Query(value = """
        SELECT ztt.* 
          FROM zone_ticket_types ztt
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
