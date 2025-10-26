package com.example.devops.repo;

import com.example.devops.model.ReservedSeats;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ReservedSeatsRepository extends JpaRepository<ReservedSeats, Long> {

    /** ✅ เช็กว่าที่นั่งถูกใช้แล้วหรือยัง (ไม่สนว่าเป็นใบจองไหน) */
    @Transactional(readOnly = true)
    boolean existsBySeatId(Long seatId);

    /** ✅ กันชนกับใบจองอื่น (ที่ไม่ใช่ id นี้) */
    @Transactional(readOnly = true)
    boolean existsBySeatIdAndReservedIdNot(Long seatId, Long reservedId);

    /** ✅ ดึงรายการ reserved_seats ของ reservation หนึ่ง ๆ */
    @Transactional(readOnly = true)
    @Query(value = "SELECT * FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    List<ReservedSeats> findByReservedId(@Param("reservedId") Long reservedId);

    /** ✅ ลบ mapping ที่นั่งทั้งหมดของ reservation (ใช้เวลาแก้ไข/ยกเลิก) */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    void deleteByReservedId(@Param("reservedId") Long reservedId);

    /** ✅ ที่นั่งที่ “ขายแล้วจริง” (PAID) ของอีเวนต์ */
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT rs.seat_id
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
        """, nativeQuery = true)
    List<Long> findSoldSeatIdsByEvent(@Param("eventId") Long eventId);

    /** ✅ (เผื่อใช้) ที่นั่งที่ถูกจับจองแล้วทั้งหมด (RESERVED + PAID) ของอีเวนต์ */
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT rs.seat_id
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(COALESCE(r.payment_status,'')) IN ('UNPAID','PAID')
        """, nativeQuery = true)
    List<Long> findTakenSeatIdsByEvent(@Param("eventId") Long eventId);
}
