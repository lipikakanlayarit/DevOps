
package com.example.devops.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.devops.model.SeatRows;
import java.util.List;

@Repository
public interface SeatRowsRepository extends JpaRepository<SeatRows, Long> {

    @Query(value = "SELECT row_id AS rowId, row_label AS rowLabel FROM seat_rows WHERE zone_id = ?1 ORDER BY sort_order NULLS LAST, row_id", nativeQuery = true)
    List<SeatingProjections.RowRow> findRowsByZoneIdNative(Long zoneId);
}
