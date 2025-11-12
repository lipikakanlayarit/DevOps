package com.example.devops.repo;

import com.example.devops.model.ReservedSeats;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ReservedSeatsRepository extends JpaRepository<ReservedSeats, Long> {

    // =========================
    // ⚠️ ของเดิม (คงไว้ให้ใช้งานต่อได้)
    // =========================

    // เดิม: เช็คว่ามีการจับจองที่นั่ง seat_id นี้ไหม (ไม่กรองสถานะ)
    boolean existsBySeatId(Long seatId);

    // เดิม: เช็คมีคนอื่นจอง seat_id นี้ไหม (ไม่กรองสถานะ)
    boolean existsBySeatIdAndReservedIdNot(Long seatId, Long reservedId);

    @Query(value = "SELECT * FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    List<ReservedSeats> findByReservedId(@Param("reservedId") Long reservedId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    void deleteByReservedId(@Param("reservedId") Long reservedId);

    // เดิม: seat ที่ขายแล้ว (นับตามใบจองที่ PAID) — ไม่ได้กรอง seat_status
    @Query(value = """
        SELECT rs.seat_id
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
        """, nativeQuery = true)
    List<Long> findSoldSeatIdsByEvent(@Param("eventId") Long eventId);

    // เดิม: นับ sold seat (ไม่กรอง seat_status)
    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
        """, nativeQuery = true)
    Long countSoldSeatsByEvent(@Param("eventId") Long eventId);

    // เดิม: นับ reserved (UNPAID ทั้งหมด ไม่กรอง seat_status)
    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'UNPAID'
        """, nativeQuery = true)
    Long countReservedSeatsByEvent(@Param("eventId") Long eventId);


    // ============================================================
    // ✅ ใหม่ (แนะนำให้ค่อยๆ ย้ายมาใช้) — กรองเฉพาะ "Active seat slots"
    //    seat_status IN ('LOCKED','PENDING','CONFIRMED')
    //    เพื่อเลี่ยงชนกับแถวที่ CANCELLED/EXPIRED และเคสซ้ำซ้อน
    // ============================================================

    // แนะนำใช้แทน existsBySeatId(..)
    @Query(value = """
        SELECT EXISTS(
            SELECT 1
              FROM reserved_seats rs
              WHERE rs.seat_id = :seatId
                AND rs.seat_status IN ('LOCKED','PENDING','CONFIRMED')
        )
        """, nativeQuery = true)
    boolean existsActiveBySeatId(@Param("seatId") Long seatId);

    // แนะนำใช้แทน existsBySeatIdAndReservedIdNot(..)
    @Query(value = """
        SELECT EXISTS(
            SELECT 1
              FROM reserved_seats rs
              WHERE rs.seat_id = :seatId
                AND rs.reserved_id <> :reservedId
                AND rs.seat_status IN ('LOCKED','PENDING','CONFIRMED')
        )
        """, nativeQuery = true)
    boolean existsActiveBySeatIdExcludingReservation(@Param("seatId") Long seatId,
                                                     @Param("reservedId") Long reservedId);

    // รายการ seat_id ที่ "ขายแล้วจริง" (PAID) และยังเป็น Active slot (เผื่อระบบยังไม่อัพเดต seat_status เป็น CONFIRMED)
    @Query(value = """
        SELECT rs.seat_id
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
           AND rs.seat_status IN ('LOCKED','PENDING','CONFIRMED')
        """, nativeQuery = true)
    List<Long> findSoldActiveSeatIdsByEvent(@Param("eventId") Long eventId);

    // จำนวน seat ที่ "ขายแล้วจริง" (PAID) แบบ Active-only
    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
           AND rs.seat_status IN ('LOCKED','PENDING','CONFIRMED')
        """, nativeQuery = true)
    Long countSoldActiveSeatsByEvent(@Param("eventId") Long eventId);

    // จำนวน seat ที่ "ยังค้าง/ถูกกันไว้" สำหรับใบจอง UNPAID แบบ Active-only
    // (ตีความเป็น pending availability: LOCKED หรือ PENDING; เว้น CONFIRMED เพื่อไม่ซ้ำกับ sold)
    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'UNPAID'
           AND rs.seat_status IN ('LOCKED','PENDING')
        """, nativeQuery = true)
    Long countReservedActiveSeatsByEvent(@Param("eventId") Long eventId);

    // สำหรับรายโซน (ถ้าจำเป็นต้องอ้างอิงระดับ zone_id ตรงๆ ในบางจุด)
    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r   ON r.reserved_id = rs.reserved_id
          JOIN seats s      ON s.seat_id = rs.seat_id
          JOIN seat_rows sr ON sr.row_id = s.row_id
         WHERE r.event_id = :eventId
           AND sr.zone_id = :zoneId
           AND UPPER(r.payment_status) = 'PAID'
           AND rs.seat_status IN ('LOCKED','PENDING','CONFIRMED')
        """, nativeQuery = true)
    Long countSoldActiveSeatsInZone(@Param("eventId") Long eventId, @Param("zoneId") Long zoneId);

    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r   ON r.reserved_id = rs.reserved_id
          JOIN seats s      ON s.seat_id = rs.seat_id
          JOIN seat_rows sr ON sr.row_id = s.row_id
         WHERE r.event_id = :eventId
           AND sr.zone_id = :zoneId
           AND UPPER(r.payment_status) = 'UNPAID'
           AND rs.seat_status IN ('LOCKED','PENDING')
        """, nativeQuery = true)
    Long countReservedActiveSeatsInZone(@Param("eventId") Long eventId, @Param("zoneId") Long zoneId);
}
