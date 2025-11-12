package com.example.devops.repo;

import com.example.devops.model.ReservedSeats;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ReservedSeatsRepository extends JpaRepository<ReservedSeats, Long> {

    boolean existsBySeatId(Long seatId);

    boolean existsBySeatIdAndReservedIdNot(Long seatId, Long reservedId);

    @Query(value = "SELECT * FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    List<ReservedSeats> findByReservedId(@Param("reservedId") Long reservedId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM reserved_seats WHERE reserved_id = :reservedId", nativeQuery = true)
    void deleteByReservedId(@Param("reservedId") Long reservedId);

    @Query(value = """
        SELECT rs.seat_id
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
        """, nativeQuery = true)
    List<Long> findSoldSeatIdsByEvent(@Param("eventId") Long eventId);

    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'PAID'
        """, nativeQuery = true)
    Long countSoldSeatsByEvent(@Param("eventId") Long eventId);

    @Query(value = """
        SELECT COUNT(rs.seat_id)
          FROM reserved_seats rs
          JOIN reserved r ON r.reserved_id = rs.reserved_id
         WHERE r.event_id = :eventId
           AND UPPER(r.payment_status) = 'UNPAID'
        """, nativeQuery = true)
    Long countReservedSeatsByEvent(@Param("eventId") Long eventId);
}
