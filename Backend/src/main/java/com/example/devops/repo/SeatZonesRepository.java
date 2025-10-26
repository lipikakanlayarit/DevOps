package com.example.devops.repo;

import com.example.devops.model.SeatZones;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatZonesRepository extends JpaRepository<SeatZones, Long> {

    /** ✅ ดึงโซนทั้งหมดของอีเวนต์ เรียงตาม sort_order (ค่า NULL จะอยู่ท้าย) */
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT * 
          FROM seat_zones 
         WHERE event_id = :eventId 
         ORDER BY COALESCE(sort_order, 999999)
        """, nativeQuery = true)
    List<SeatZones> findByEventIdOrderBySortOrderAsc(@Param("eventId") Long eventId);

    /** ✅ ดึงโซนทั้งหมดของอีเวนต์ เรียงตาม sort_order และ zone_id (ใช้ในหน้า Admin Event Detail) */
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT * 
          FROM seat_zones 
         WHERE event_id = :eventId 
         ORDER BY COALESCE(sort_order, 999999), zone_id ASC
        """, nativeQuery = true)
    List<SeatZones> findByEventIdOrderBySortOrderAscZoneIdAsc(@Param("eventId") Long eventId);

    /** ✅ ดึงข้อมูลโซนเดี่ยวตาม zoneId */
    @Transactional(readOnly = true)
    @Query(value = "SELECT * FROM seat_zones WHERE zone_id = :zoneId LIMIT 1", nativeQuery = true)
    Optional<SeatZones> findByZoneId(@Param("zoneId") Long zoneId);

    /** ✅ ตรวจสอบชื่อโซนซ้ำภายใน event (ไม่สนตัวพิมพ์) */
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT EXISTS(
            SELECT 1 FROM seat_zones 
             WHERE event_id = :eventId 
               AND LOWER(zone_name) = LOWER(:zoneName)
        )
        """, nativeQuery = true)
    boolean existsByEventIdAndZoneNameIgnoreCase(@Param("eventId") Long eventId,
                                                 @Param("zoneName") String zoneName);

    /** ✅ ลบข้อมูลโซนทั้งหมดในอีเวนต์ */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM seat_zones WHERE event_id = :eventId", nativeQuery = true)
    void deleteByEventId(@Param("eventId") Long eventId);
}
