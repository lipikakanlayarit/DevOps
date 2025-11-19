package com.example.devops.repo;

import com.example.devops.model.Seats;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SeatsRepository extends JpaRepository<Seats, Long> {

    @Query(value = """
        SELECT s.seat_id
          FROM seats s
         WHERE (:rowId IS NOT NULL AND s.row_id = :rowId AND s.seat_number = :seatNo)
        UNION
        SELECT s2.seat_id
          FROM seats s2
          JOIN seat_rows r ON r.row_id = s2.row_id
         WHERE (:rowId IS NULL AND :rowLabel IS NOT NULL
            AND r.zone_id = :zoneId
            AND r.row_label = :rowLabel
            AND s2.seat_number = :seatNo)
        LIMIT 1
        """, nativeQuery = true)
    Long findSeatIdFlexible(@Param("zoneId") Long zoneId,
                            @Param("rowId") Integer rowId,
                            @Param("rowLabel") String rowLabel,
                            @Param("seatNo") int seatNo);

    @Query(value = """
        SELECT s.seat_id
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
         WHERE r.zone_id = :zoneId
           AND r.sort_order = :rowNumber
           AND s.seat_number = :seatNo
        LIMIT 1
        """, nativeQuery = true)
    Long findSeatIdByZoneRowCol(@Param("zoneId") Long zoneId,
                                @Param("rowNumber") Integer rowNumber,
                                @Param("seatNo") int seatNo);

    @Query(value = """
        SELECT COALESCE(MAX(s.seat_number), 0)
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
         WHERE r.zone_id = :zoneId
        """, nativeQuery = true)
    Integer findMaxSeatsPerRowByZoneId(@Param("zoneId") Long zoneId);

    @Query(value = """
        SELECT s.*
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
          JOIN seat_zones z ON z.zone_id = r.zone_id
         WHERE z.event_id = :eventId
         ORDER BY r.sort_order, s.seat_number
        """, nativeQuery = true)
    List<Seats> findAllSeatsByEventId(@Param("eventId") Long eventId);

    /* ==================== ⭐⭐⭐ FIX: OCCUPIED (ไม่ cross zone แล้ว) ====================

       ครอบคลุม 2 แหล่ง:
       1) reserved_seats ที่ seat_status อยู่ใน ('PENDING','CONFIRMED')
       2) seat_locks สถานะ LOCKED ที่ยังไม่หมดอายุ
    */
    @Query(value = """
        WITH occ_rs AS (
            SELECT z.zone_id,
                   r.sort_order AS row_number,
                   s.seat_number AS seat_number
              FROM reserved_seats rs
              JOIN seats      s  ON s.seat_id = rs.seat_id
              JOIN seat_rows  r  ON r.row_id  = s.row_id
              JOIN seat_zones z  ON z.zone_id = r.zone_id
             WHERE z.event_id = :eventId
               AND rs.seat_status IN ('PENDING','CONFIRMED')
        ),
        occ_locks AS (
            SELECT z2.zone_id,
                   r2.sort_order AS row_number,
                   s2.seat_number AS seat_number
              FROM seat_locks l
              JOIN seats      s2 ON s2.seat_id = l.seat_id
              JOIN seat_rows  r2 ON r2.row_id  = s2.row_id
              JOIN seat_zones z2 ON z2.zone_id = r2.zone_id
             WHERE z2.event_id = :eventId
               AND UPPER(COALESCE(l.status,'LOCKED')) = 'LOCKED'
               AND (l.expires_at IS NULL OR l.expires_at > NOW())
        )
        SELECT * FROM occ_rs
        UNION
        SELECT * FROM occ_locks
        """, nativeQuery = true)
    List<Object[]> findOccupiedWithZoneRowColByEventId(@Param("eventId") Long eventId);

    @Modifying
    @Transactional
    @Query(value = """
        DELETE FROM seats
         WHERE row_id IN (
            SELECT r.row_id
              FROM seat_rows r
              JOIN seat_zones z ON z.zone_id = r.zone_id
             WHERE z.event_id = :eventId
         )
        """, nativeQuery = true)
    void deleteByEventId(@Param("eventId") Long eventId);

    // ==================== ⭐⭐⭐ Public สำหรับ FE (รวม RESERVED) ====================

    @Query(value = """
        SELECT s.seat_id
          FROM seats s
          JOIN seat_rows sr ON sr.row_id = s.row_id
          JOIN seat_zones sz ON sz.zone_id = sr.zone_id
          JOIN reserved_seats rs ON rs.seat_id = s.seat_id
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE sz.event_id = :eventId
           AND UPPER(COALESCE(r.payment_status,'UNPAID')) IN ('RESERVED','PAID')
        """, nativeQuery = true)
    List<Long> findPaidTakenSeatIdsByEvent(@Param("eventId") Long eventId);

    @Query(value = """
        SELECT s.seat_id
          FROM seats s
          JOIN seat_rows sr ON sr.row_id = s.row_id
          JOIN seat_zones sz ON sz.zone_id = sr.zone_id
          JOIN seat_locks l ON l.seat_id = s.seat_id
         WHERE sz.event_id = :eventId
           AND UPPER(l.status) = 'LOCKED'
           AND (l.expires_at IS NULL OR l.expires_at > NOW())
        """, nativeQuery = true)
    List<Long> findLockedSeatIdsByEvent(@Param("eventId") Long eventId);

    @Query(value = """
        SELECT s.seat_id
          FROM seats s
          JOIN seat_rows sr ON sr.row_id = s.row_id
          JOIN seat_zones sz ON sz.zone_id = sr.zone_id
          JOIN reserved_seats rs ON rs.seat_id = s.seat_id
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE sz.event_id = :eventId
           AND UPPER(COALESCE(r.payment_status,'UNPAID')) IN ('RESERVED','PAID')
           AND s.seat_id = ANY (:seatIds)
        """, nativeQuery = true)
    List<Long> findPaidTakenAmong(@Param("eventId") Long eventId,
                                  @Param("seatIds") Long[] seatIds);

    @Query(value = """
        SELECT s.seat_id,
               z.zone_id,
               r.sort_order AS row_number,
               s.seat_number
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
          JOIN seat_zones z ON z.zone_id = r.zone_id
         WHERE z.event_id = :eventId
           AND s.seat_id = ANY (:seatIds)
        """, nativeQuery = true)
    List<Object[]> findZoneRowColForSeatIds(@Param("eventId") Long eventId,
                                            @Param("seatIds") Long[] seatIds);

    // ==================== ⭐⭐⭐ Admin - นับโซน (แยก RESERVED) ====================

    @Query(value = """
        SELECT COUNT(*)
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
         WHERE r.zone_id = :zoneId
        """, nativeQuery = true)
    int countSeatsInZone(@Param("zoneId") Long zoneId);

    @Query(value = """
        SELECT COALESCE(COUNT(DISTINCT rs.seat_id), 0)
          FROM reserved_seats rs
          JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id
          JOIN seats s      ON s.seat_id = rs.seat_id
          JOIN seat_rows sr ON sr.row_id = s.row_id
         WHERE sr.zone_id = :zoneId
           AND UPPER(COALESCE(rsv.payment_status, '')) = 'PAID'
        """, nativeQuery = true)
    int countSoldSeatsInZone(@Param("zoneId") Long zoneId);

    @Query(value = """
        SELECT COUNT(*) FROM (
            SELECT DISTINCT rs.seat_id
              FROM reserved_seats rs
              JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id
              JOIN seats s      ON s.seat_id = rs.seat_id
              JOIN seat_rows sr ON sr.row_id = s.row_id
             WHERE sr.zone_id = :zoneId
               AND UPPER(COALESCE(rsv.payment_status, 'UNPAID')) = 'RESERVED'
            UNION
            SELECT DISTINCT l.seat_id
              FROM seat_locks l
              JOIN seats s      ON s.seat_id = l.seat_id
              JOIN seat_rows sr ON sr.row_id = s.row_id
             WHERE sr.zone_id = :zoneId
               AND UPPER(COALESCE(l.status,'LOCKED')) = 'LOCKED'
               AND (l.expires_at IS NULL OR l.expires_at > NOW())
        ) x
        """, nativeQuery = true)
    int countReservedSeatsInZone(@Param("zoneId") Long zoneId);

    // ==================== ⭐⭐⭐ Admin - นับอีเวนต์ (แยก RESERVED) ====================

    @Query(value = """
        SELECT COUNT(*)
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
          JOIN seat_zones z ON z.zone_id = r.zone_id
         WHERE z.event_id = :eventId
        """, nativeQuery = true)
    long countTotalSeatsByEvent(@Param("eventId") Long eventId);

    @Query(value = """
        SELECT COUNT(DISTINCT rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id
          JOIN seats s      ON s.seat_id = rs.seat_id
          JOIN seat_rows r  ON r.row_id = s.row_id
          JOIN seat_zones z ON z.zone_id = r.zone_id
         WHERE z.event_id = :eventId
           AND UPPER(COALESCE(rsv.payment_status,'UNPAID')) = 'PAID'
        """, nativeQuery = true)
    long countSoldSeatsByEvent(@Param("eventId") Long eventId);

    @Query(value = """
        SELECT COUNT(*) FROM (
            SELECT DISTINCT rs.seat_id
              FROM reserved_seats rs
              JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id
              JOIN seats s      ON s.seat_id = rs.seat_id
              JOIN seat_rows r  ON r.row_id = s.row_id
              JOIN seat_zones z ON z.zone_id = r.zone_id
             WHERE z.event_id = :eventId
               AND UPPER(COALESCE(rsv.payment_status,'UNPAID')) = 'RESERVED'
            UNION
            SELECT DISTINCT l.seat_id
              FROM seat_locks l
              JOIN seats s      ON s.seat_id = l.seat_id
              JOIN seat_rows r  ON r.row_id = s.row_id
              JOIN seat_zones z ON z.zone_id = r.zone_id
             WHERE z.event_id = :eventId
               AND UPPER(COALESCE(l.status,'LOCKED')) = 'LOCKED'
               AND (l.expires_at IS NULL OR l.expires_at > NOW())
        ) x
        """, nativeQuery = true)
    long countReservedSeatSlotsByEvent(@Param("eventId") Long eventId);
}
