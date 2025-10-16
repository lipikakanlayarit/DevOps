package com.example.devops.repo;

import com.example.devops.model.SeatZones;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SeatZonesRepository extends JpaRepository<SeatZones, Long> {

    @Query(value = "SELECT * FROM seat_zones WHERE event_id = :eventId ORDER BY COALESCE(sort_order, 999999)", nativeQuery = true)
    List<SeatZones> findByEventIdOrderBySortOrderAsc(@Param("eventId") Long eventId);

    @Modifying
    @Query(value = "DELETE FROM seat_zones WHERE event_id = :eventId", nativeQuery = true)
    void deleteByEventId(@Param("eventId") Long eventId);
}
