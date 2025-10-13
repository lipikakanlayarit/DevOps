
package com.example.devops.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.devops.model.ReservedSeats;
import com.example.devops.model.ReservedSeatsId;
import java.util.List;
import java.util.Set;

@Repository
public interface ReservedSeatsRepository extends JpaRepository<ReservedSeats, ReservedSeatsId> {

    @Query(value = "SELECT rs.seat_id FROM reserved_seats rs JOIN reserved r ON r.reserved_id = rs.reserved_id WHERE r.event_id = ?1", nativeQuery = true)
    Set<Long> findTakenSeatIdsByEventIdNative(Long eventId);

    @Query(value = "SELECT seat_id FROM reserved_seats WHERE reserved_id = ?1", nativeQuery = true)
    List<Long> findSeatIdsByReservedIdNative(Long reservedId);
}
