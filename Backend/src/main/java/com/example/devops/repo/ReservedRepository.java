package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Repository
public interface ReservedRepository extends JpaRepository<Reserved, Long> {

    /** ✅ ดึงรายการจองทั้งหมดของอีเวนต์ (entity) */
    @Transactional(readOnly = true)
    List<Reserved> findAllByEventId(Long eventId);

    /** ✅ นับจำนวนใบจองตามสถานะ (เช่น PAID / UNPAID) */
    @Transactional(readOnly = true)
    long countByEventIdAndPaymentStatusIgnoreCase(Long eventId, String paymentStatus);

    /** ✅ ตรวจสอบรหัสยืนยันซ้ำ */
    @Transactional(readOnly = true)
    boolean existsByConfirmationCode(String confirmationCode);

    /** ✅ เฉพาะที่จ่ายแล้ว (entity) */
    @Transactional(readOnly = true)
    @Query("SELECT r FROM Reserved r WHERE r.eventId = :eventId AND UPPER(r.paymentStatus) = 'PAID'")
    List<Reserved> findPaidByEventId(@Param("eventId") Long eventId);

    /** ✅ สำหรับตารางแสดงผล: join & aggregate seat label ต่อใบจอง (alias เป็น `user`) */
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT 
            rv.reserved_id            AS id,
            rv.confirmation_code      AS reserved_code,
            rv.payment_status         AS status,
            rv.total_amount           AS total,
            rv.payment_method         AS payment_method,
            COALESCE(u.username, '-') AS user,
            rv.registration_datetime  AS date,
            STRING_AGG(
              COALESCE(s.seat_label, CONCAT('R', sr.sort_order, 'S', s.seat_number))::text,
              ',' ORDER BY sr.sort_order, s.seat_number
            ) AS seat_label
        FROM reserved rv
        LEFT JOIN users u           ON u.user_id = rv.user_id
        LEFT JOIN reserved_seats rs ON rs.reserved_id = rv.reserved_id
        LEFT JOIN seats s           ON s.seat_id = rs.seat_id
        LEFT JOIN seat_rows sr      ON sr.row_id = s.row_id
        WHERE rv.event_id = :eventId
        GROUP BY rv.reserved_id, rv.confirmation_code, rv.payment_status, rv.total_amount, 
                 rv.payment_method, u.username, rv.registration_datetime
        ORDER BY rv.reserved_id
        """, nativeQuery = true)
    List<Map<String, Object>> findReservationsByEvent(@Param("eventId") Long eventId);

    // ----------------------------------------------------------------------
    // ✅ ใหม่: ดึง Ticket History ของ user (แก้ cast ::text เพื่อกัน error integer '-')
    // ใช้กับ Modal "Ticket History" ในหน้า Admin -> User Management
    // ----------------------------------------------------------------------
    @Transactional(readOnly = true)
    @Query(value = """
        SELECT
            COALESCE(r.reserve_code, 'RSV-' || r.reservation_id::text)           AS "reserveId",
            COALESCE(e.event_name, '-')                                          AS "title",
            COALESCE(e.venue_name, '-')                                          AS "venue",
            COALESCE(to_char(e.start_datetime, 'YYYY-MM-DD HH24:MI'), '-')       AS "showDate",
            COALESCE(tt.type_name, '-')                                          AS "zone",
            COALESCE(rt.seat_row::text, '-')                                     AS "row",
            COALESCE(rt.seat_col::text, '-')                                     AS "column",
            COALESCE(rt.price, tt.price, 0)                                      AS "total",
            ''                                                                   AS "poster"
        FROM reservations r
        LEFT JOIN reservation_tickets rt ON rt.reservation_id = r.reservation_id
        LEFT JOIN ticket_types tt        ON tt.ticket_type_id = rt.ticket_type_id
        LEFT JOIN events_nam e           ON e.event_id = COALESCE(r.event_id, tt.event_id)
        WHERE r.user_id = :userId
          AND COALESCE(r.status,'') = 'PAID'
        ORDER BY r.created_at DESC NULLS LAST,
                 rt.reservation_ticket_id ASC NULLS LAST
        """, nativeQuery = true)
    List<Map<String, Object>> findUserTicketHistory(@Param("userId") Long userId);

    // (ถ้าจะใช้ลบ reservation + mapping ที่นั่งในธุรกรรมเดียวกัน เพิ่มเมธอดช่วยได้ตามนี้)
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM reserved WHERE reserved_id = :reservedId", nativeQuery = true)
    void deleteReservationHard(@Param("reservedId") Long reservedId);
}
