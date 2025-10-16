package com.example.devops.repo;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.projection.AdminEventRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface EventsNamRepository extends JpaRepository<EventsNam, Long> {

    // (คงไว้) ใช้ที่อื่นในระบบ
    @Query(value = """
        SELECT e.*
        FROM events_nam e
        WHERE e.organizer_id = :orgId
        ORDER BY e.event_id DESC
        """, nativeQuery = true)
    List<EventsNam> findByOrganizerIdOrderByIdDesc(@Param("orgId") Long orgId);

    // ✅ ใช้ VIEW ถ้าคุณบอกว่าหน้ารายการดึงจาก view (ไม่มี cover_image ก็ไม่เป็นไร เพราะเราเลือกเฉพาะคอลัมน์ที่ต้องใช้)
    //    ถ้าระบบคุณไม่มี view นี้ ให้สลับ FROM เป็น events_nam ได้ทันที
    @Query(value = """
        SELECT
          event_id,
          event_name,
          category_id,
          organizer_id,
          start_datetime,
          end_datetime,
          venue_name,
          venue_address,
          status
        FROM events_nam_pretty
        WHERE (COALESCE(:status, '') = '' OR status = :status)
          AND (COALESCE(:q, '') = '' OR event_name ILIKE ('%' || :q || '%'))
        ORDER BY event_id DESC
        """,
            countQuery = """
        SELECT COUNT(*)
        FROM events_nam_pretty
        WHERE (COALESCE(:status, '') = '' OR status = :status)
          AND (COALESCE(:q, '') = '' OR event_name ILIKE ('%' || :q || '%'))
        """,
            nativeQuery = true)
    Page<AdminEventRow> searchAdminList(@Param("status") String status,
                                        @Param("q") String q,
                                        Pageable pageable);

    // ✅ อัปเดตสถานะยิงที่ตารางจริงเหมือนเดิม
    @Modifying
    @Transactional
    @Query(value = "UPDATE events_nam SET status = :status WHERE event_id = :id", nativeQuery = true)
    int updateStatus(@Param("id") Long id, @Param("status") String status);
}
