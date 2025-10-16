package com.example.devops.repo;

import com.example.devops.model.Seats;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SeatsRepository extends JpaRepository<Seats, Long> {

    @Query(value = """
        SELECT s.* FROM seats s
        JOIN seat_rows r ON r.row_id = s.row_id
        JOIN seat_zones z ON z.zone_id = r.zone_id
        WHERE z.event_id = :eventId
        ORDER BY r.row_label, s.seat_number
        """, nativeQuery = true)
    List<Seats> findAllSeatsByEventId(@Param("eventId") Long eventId);

    @Modifying
    @Query(value = """
        DELETE FROM seats
        WHERE row_id IN (
            SELECT r.row_id FROM seat_rows r
            JOIN seat_zones z ON z.zone_id = r.zone_id
            WHERE z.event_id = :eventId
        )
        """, nativeQuery = true)
    void deleteByEventId(@Param("eventId") Long eventId);
}
