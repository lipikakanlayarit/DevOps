package com.example.devops.repo;

import com.example.devops.model.SeatRows;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SeatRowsRepository extends JpaRepository<SeatRows, Long> {

    @Query(value = """
        SELECT r.* FROM seat_rows r
        JOIN seat_zones z ON z.zone_id = r.zone_id
        WHERE z.event_id = :eventId
        ORDER BY COALESCE(r.sort_order, 999999)
        """, nativeQuery = true)
    List<SeatRows> findAllRowsByEventId(@Param("eventId") Long eventId);

    @Modifying
    @Query(value = """
        DELETE FROM seat_rows
        WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = :eventId)
        """, nativeQuery = true)
    void deleteByEventId(@Param("eventId") Long eventId);
}
