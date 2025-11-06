package com.example.devops.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * ============================================================
 *  SeatLockService
 * ============================================================
 * ✅ หน้าที่หลัก:
 *   - ดูแลตาราง seat_locks (LOCKED / EXPIRED / UNLOCKED)
 *   - ตรวจจับที่นั่งที่หมดเวลาแล้ว (expires_at <= NOW())
 *   - ยกเลิกใบจองที่ยังไม่ได้ชำระภายในเวลาที่กำหนด (5 นาที)
 *   - ลบ mapping reserved_seats ของใบจองที่ถูกยกเลิก
 *   - รันอัตโนมัติทุก 1 นาที
 *
 * ============================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SeatLockService {

    private final JdbcTemplate jdbc;

    // ============================== 🧹 AUTO CLEANUP ==============================

    /**
     * รันอัตโนมัติทุก 1 นาที
     * 1. อัปเดต seat_locks ที่หมดเวลาเป็น EXPIRED
     * 2. ยกเลิก reserved ที่ยังไม่จ่ายและหมดเวลา
     * 3. ลบ reserved_seats ของใบจองที่ถูกยกเลิก
     */
    @Transactional
    @Scheduled(fixedRate = 60000) // 1 นาที
    public void cleanupExpiredLocks() {
        log.debug("⏰ SeatLockService cleanup job started at {}", Instant.now());
        try {
            // -------------------------------------------------
            // 1️⃣ อัปเดต LOCK ที่หมดเวลา
            // -------------------------------------------------
            int expiredLocks = jdbc.update("""
                UPDATE seat_locks
                   SET status = 'EXPIRED'
                 WHERE status = 'LOCKED'
                   AND expires_at <= NOW()
            """);

            // -------------------------------------------------
            // 2️⃣ ยกเลิกใบจองที่มีที่นั่งหมดเวลา (RESERVED → CANCELLED)
            // -------------------------------------------------
            int cancelledReservations = jdbc.update("""
                UPDATE reserved 
                   SET payment_status = 'CANCELLED',
                       notes = 'Auto-cancelled due to timeout'
                 WHERE UPPER(COALESCE(payment_status,'')) = 'RESERVED'
                   AND reserved_id IN (
                       SELECT DISTINCT rs.reserved_id
                         FROM reserved_seats rs
                         JOIN seat_locks sl ON sl.seat_id = rs.seat_id
                        WHERE sl.status = 'EXPIRED'
                   )
            """);

            // -------------------------------------------------
            // 3️⃣ ลบ mapping reserved_seats ที่เชื่อมกับใบจองที่ถูกยกเลิก
            // -------------------------------------------------
            int deletedSeats = jdbc.update("""
                DELETE FROM reserved_seats
                 WHERE reserved_id IN (
                   SELECT reserved_id FROM reserved WHERE payment_status = 'CANCELLED'
                 )
            """);

            log.info("🧹 SeatLockService cleanup → expiredLocks={}, cancelledReservations={}, deletedSeats={}",
                    expiredLocks, cancelledReservations, deletedSeats);

        } catch (Exception e) {
            log.error("❌ SeatLockService cleanup failed: {}", e.getMessage(), e);
        }
    }

    // ============================== 🔍 MANUAL HELPERS ==============================

    /** ตรวจนับจำนวน LOCK ที่หมดเวลาแล้ว (ใช้ debug/admin) */
    @Transactional(readOnly = true)
    public int countExpiredLocksNow() {
        Integer count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM seat_locks 
             WHERE status = 'LOCKED' 
               AND expires_at <= NOW()
        """, Integer.class);
        return count == null ? 0 : count;
    }

    /** ดึงรายการ seat_locks ที่ยัง active อยู่ (ยังไม่หมดเวลา) */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findActiveLocks() {
        return jdbc.queryForList("""
            SELECT lock_id, seat_id, user_id, expires_at, status
              FROM seat_locks
             WHERE status = 'LOCKED'
               AND expires_at > NOW()
             ORDER BY expires_at ASC
        """);
    }

    /** สำหรับ dev/debug: เคลียร์ทุก LOCK ที่หมดเวลาแล้วทันที (รันมือ) */
    @Transactional
    public void forceCleanupNow() {
        int affected = jdbc.update("""
            UPDATE seat_locks
               SET status = 'EXPIRED'
             WHERE status = 'LOCKED'
               AND expires_at <= NOW()
        """);
        log.warn("⚙️ Force cleanup executed manually → affected locks={}", affected);
    }
}
