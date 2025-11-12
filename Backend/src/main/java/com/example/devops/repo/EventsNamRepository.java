package com.example.devops.repo;

import com.example.devops.model.EventsNam;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventsNamRepository extends JpaRepository<EventsNam, Long> {

    /* =========================
       Organizer / Listing
       ========================= */

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

    @Query(value = """
        SELECT e.*
        FROM events_nam e
        ORDER BY e.event_id DESC
        """, nativeQuery = true)
    List<EventsNam> findAllByOrderByEventIdDesc();


    /* =========================
       Admin review actions
       ========================= */

    /** ✅ อนุมัติอีเวนต์ */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
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

    /** ✅ ปฏิเสธอีเวนต์ */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
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


    /* =========================
       Public landing queries
       ========================= */

    @Query(value = "SELECT * FROM public_events_on_sale ORDER BY event_id DESC", nativeQuery = true)
    List<EventsNam> findOnSaleViaView();

    @Query(value = "SELECT * FROM public_events_upcoming", nativeQuery = true)
    List<EventsNam> findUpcomingViaView();

    @Query(value = """
        SELECT e.*
        FROM events_nam e
        WHERE UPPER(e.status) = 'APPROVED'
          AND e.sales_start_datetime IS NOT NULL
          AND e.sales_end_datetime   IS NOT NULL
          AND e.sales_start_datetime <= :nowTs
          AND e.sales_end_datetime   >= :nowTs
        ORDER BY e.sales_start_datetime ASC, e.event_id ASC
        """, nativeQuery = true)
    List<EventsNam> findCurrentlyOnSale(@Param("nowTs") Instant nowTs);

    @Query(value = """
        SELECT e.*
        FROM events_nam e
        WHERE UPPER(e.status) = 'APPROVED'
          AND e.sales_start_datetime IS NOT NULL
          AND e.sales_start_datetime > :nowTs
        ORDER BY e.sales_start_datetime ASC, e.event_id ASC
        """, nativeQuery = true)
    List<EventsNam> findUpcomingSales(@Param("nowTs") Instant nowTs);


    /* =========================
       ใช้กับ ImageSeeder: หา event ล่าสุดตามชื่อ
       ========================= */

    Optional<EventsNam> findTopByEventNameOrderByIdDesc(String eventName);
}
