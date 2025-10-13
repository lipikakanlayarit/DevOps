
package com.example.devops.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.devops.model.SeatZones;
import java.util.List;

@Repository
public interface SeatZonesRepository extends JpaRepository<SeatZones, Long> {

    @Query(value = "SELECT zone_id AS zoneId, zone_name AS zoneName FROM seat_zones WHERE event_id = ?1 ORDER BY zone_id", nativeQuery = true)
    List<SeatingProjections.ZoneRow> findZonesByEventIdNative(Long eventId);
}
