package com.example.devops.repo;

import com.example.devops.model.EventsNam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<EventsNam, Long> {

    // JPQL: อ้าง "ชื่อฟิลด์ใน entity" (event_name) ไม่ใช่ชื่อคอลัมน์ DB
    @Query("""
           SELECT e
           FROM EventsNam e
           WHERE (:q IS NULL OR :q = '' OR LOWER(e.event_name) LIKE LOWER(CONCAT('%', :q, '%')))
           """)
    Page<EventsNam> searchByName(@Param("q") String q, Pageable pageable);

    // ถ้าอยากใช้ Native SQL แทน (ไม่จำเป็น) — uncomment ด้านล่าง
//    @Query(
//      value = "SELECT * FROM events_nam e WHERE (:q IS NULL OR :q = '' OR LOWER(e.event_name) LIKE LOWER(CONCAT('%', :q, '%')))",
//      countQuery = "SELECT count(*) FROM events_nam e WHERE (:q IS NULL OR :q = '' OR LOWER(e.event_name) LIKE LOWER(CONCAT('%', :q, '%')))",
//      nativeQuery = true
//    )
//    Page<EventsNam> searchByName(@Param("q") String q, Pageable pageable);
}
