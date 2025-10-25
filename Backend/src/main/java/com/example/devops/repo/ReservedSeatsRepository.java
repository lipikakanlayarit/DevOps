package com.example.devops.repo;

import com.example.devops.model.ReservedSeats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReservedSeatsRepository extends JpaRepository<ReservedSeats, Long> {

    boolean existsBySeatId(Long seatId);

    // ดึงรายการ reserved_seats ของ reservation หนึ่ง ๆ (ใช้ native เพราะตารางเก็บเป็น id ตรง ๆ)
    @Query(value = "SELECT * FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    List<ReservedSeats> findByReservedId(@Param("reservedId") Long reservedId);

    // ที่นั่งที่ “ขายแล้ว” = reserved_seats ที่อยู่ใน reservation ของ event นั้นและ reservation เป็น PAID
    @Query(value = """
        SELECT rs.seat_id
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
        """, nativeQuery = true)
    List<Long> findSoldSeatIdsByEvent(@Param("eventId") Long eventId);
}
