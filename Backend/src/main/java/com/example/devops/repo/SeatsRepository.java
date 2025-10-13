
package com.example.devops.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.devops.model.Seats;
import java.util.List;

@Repository
public interface SeatsRepository extends JpaRepository<Seats, Long> {

    @Query(value = "SELECT seat_id AS seatId, seat_label AS seatLabel, seat_number AS seatNumber FROM seats WHERE row_id = ?1 ORDER BY seat_number NULLS LAST, seat_id", nativeQuery = true)
    List<SeatingProjections.SeatRow> findSeatsByRowIdNative(Long rowId);

    @Query(value = "SELECT seat_label FROM seats WHERE seat_id = ?1", nativeQuery = true)
    String findSeatLabelByIdNative(Long seatId);
}
