package com.example.devops.repo;

import com.example.devops.model.EventsNam;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventsNamRepository extends JpaRepository<EventsNam, Long> {

    @Query(value = """
        SELECT e.* 
        FROM events_nam e
        WHERE e.organizer_id = :orgId
        ORDER BY e.event_id DESC
        """, nativeQuery = true)
    List<EventsNam> findByOrganizerIdOrderByIdDesc(@Param("orgId") Long orgId);

    @Query(value = """
        SELECT e.*
        FROM events_nam e
        WHERE UPPER(e.status) = UPPER(:status)
        ORDER BY e.event_id DESC
        """, nativeQuery = true)
    List<EventsNam> findAllByStatus(@Param("status") String status);

    @Modifying
    @Query(value = """
        UPDATE events_nam
           SET status = 'APPROVED',
               review = :review,
               reviewed_at = NOW(),
               reviewed_by = :adminId
         WHERE event_id = :id
        """, nativeQuery = true)
    int approve(@Param("id") Long id,
                @Param("review") String review,
                @Param("adminId") Integer adminId);

    @Modifying
    @Query(value = """
        UPDATE events_nam
           SET status = 'REJECTED',
               review = :review,
               reviewed_at = NOW(),
               reviewed_by = :adminId
         WHERE event_id = :id
        """, nativeQuery = true)
    int reject(@Param("id") Long id,
               @Param("review") String review,
               @Param("adminId") Integer adminId);
}
