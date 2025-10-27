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

    @Query(value = """
        SELECT z.zone_id AS zone_id,
               r.sort_order AS row_number,
               s.seat_number AS seat_number
          FROM reserved_seats rs
          JOIN reserved rv ON rv.reserved_id = rs.reserved_id
          JOIN seats s ON s.seat_id = rs.seat_id
          JOIN seat_rows r ON r.row_id = s.row_id
          JOIN seat_zones z ON z.zone_id = r.zone_id
         WHERE z.event_id = :eventId
           AND UPPER(rv.payment_status) = 'PAID'
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

    // ==================== Public สำหรับ FE (สถานะที่นั่ง) ====================

    @Query(value = """
        SELECT s.seat_id
          FROM seats s
          JOIN seat_rows sr ON sr.row_id = s.row_id
          JOIN seat_zones sz ON sz.zone_id = sr.zone_id
          JOIN reserved_seats rs ON rs.seat_id = s.seat_id
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE sz.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
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
           AND UPPER(r.payment_status) = 'PAID'
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

    // ==================== สำหรับ Admin: นับต่อ "โซน" ====================

    /** จำนวนที่นั่งทั้งหมดในโซน */
    @Query(value = """
        SELECT COUNT(*)
          FROM seats s
          JOIN seat_rows r ON r.row_id = s.row_id
         WHERE r.zone_id = :zoneId
        """, nativeQuery = true)
    int countSeatsInZone(@Param("zoneId") Long zoneId);

    /** จำนวนที่นั่งที่ขายแล้ว (PAID) ในโซน */
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

    /** จำนวนที่นั่งที่ "จองค้าง/ยังไม่จ่าย" หรือ "ถูกล็อกอยู่" ในโซน (ไม่นับซ้ำ) */
    @Query(value = """
        SELECT COUNT(*) FROM (
            -- reserved but not paid
            SELECT DISTINCT rs.seat_id
              FROM reserved_seats rs
              JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id
              JOIN seats s      ON s.seat_id = rs.seat_id
              JOIN seat_rows sr ON sr.row_id = s.row_id
             WHERE sr.zone_id = :zoneId
               AND UPPER(COALESCE(rsv.payment_status, 'UNPAID')) <> 'PAID'
            UNION
            -- locked seats (not expired)
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

    // ==================== สำหรับ Admin: นับภาพรวม "อีเวนต์" ====================

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

    /** reserved (ยังไม่จ่าย) ∪ locked (ยังไม่หมดอายุ) แบบไม่ซ้ำกัน */
    @Query(value = """
        SELECT COUNT(*) FROM (
            SELECT DISTINCT rs.seat_id
              FROM reserved_seats rs
              JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id
              JOIN seats s      ON s.seat_id = rs.seat_id
              JOIN seat_rows r  ON r.row_id = s.row_id
              JOIN seat_zones z ON z.zone_id = r.zone_id
             WHERE z.event_id = :eventId
               AND UPPER(COALESCE(rsv.payment_status,'UNPAID')) <> 'PAID'
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
