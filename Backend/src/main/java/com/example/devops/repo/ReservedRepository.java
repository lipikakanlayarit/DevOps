package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    /* ===============================================================
       ✅ สรุปรายการจองของอีเวนต์ + seat_label + expire_at (5 นาที)
       =============================================================== */
    @Transactional(readOnly = true)
    @Query(value = """
        WITH lbl_rs AS (
            SELECT t.reserved_id,
                   STRING_AGG(t.label, ', ' ORDER BY t.sort_order, t.seat_number) AS seat_label
            FROM (
                SELECT
                       rv.reserved_id,
                       sr.sort_order,
                       s.seat_number,
                       (sr.row_label || s.seat_number::text) AS label
                  FROM reserved rv
                  JOIN reserved_seats rs ON rs.reserved_id = rv.reserved_id
                  JOIN seats s           ON s.seat_id      = rs.seat_id
                  JOIN seat_rows sr      ON sr.row_id      = s.row_id
                 WHERE rv.event_id = :eventId
            ) t
            GROUP BY t.reserved_id
        ),
        lbl_rt AS (
            SELECT t.reserved_id,
                   STRING_AGG(t.label, ', ' ORDER BY t.seat_row, t.seat_col_int) AS seat_label
            FROM (
                SELECT
                       r.reserved_id                AS reserved_id,
                       rt.seat_row                  AS seat_row,
                       (rt.seat_col)::int           AS seat_col_int,
                       (rt.seat_row || rt.seat_col) AS label
                  FROM reserved r
                  JOIN reservation_tickets rt ON rt.reservation_id = r.reserved_id
                 WHERE r.event_id = :eventId
            ) t
            GROUP BY t.reserved_id
        )
        SELECT 
            rv.reserved_id            AS id,
            rv.confirmation_code      AS reserved_code,
            UPPER(COALESCE(rv.payment_status,'UNPAID')) AS status,
            rv.total_amount           AS total,
            rv.payment_method         AS payment_method,
            COALESCE(u.username, '-') AS user,
            TO_CHAR((rv.registration_datetime AT TIME ZONE 'Asia/Bangkok'), 'DD Mon YYYY') AS date,
            COALESCE(lbl_rs.seat_label, lbl_rt.seat_label, '-') AS seat_label,
            (rv.registration_datetime AT TIME ZONE 'Asia/Bangkok') AS registration_ts,
            LEAST(
                rv.registration_datetime + INTERVAL '5 minutes',
                ev.sales_end_datetime
            )                         AS expire_at
        FROM reserved rv
        LEFT JOIN users u   ON u.user_id = rv.user_id
        LEFT JOIN lbl_rs    ON lbl_rs.reserved_id = rv.reserved_id
        LEFT JOIN lbl_rt    ON lbl_rt.reserved_id = rv.reserved_id
        LEFT JOIN events_nam ev ON ev.event_id = rv.event_id
        WHERE rv.event_id = :eventId
        ORDER BY rv.reserved_id DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findReservationsByEvent(@Param("eventId") Long eventId);

    /** ✅ alias เพื่อความเข้ากันได้ (ใช้ชื่อเดิมได้) */
    @Transactional(readOnly = true)
    @Query(value = """
        WITH lbl_rs AS (
            SELECT t.reserved_id,
                   STRING_AGG(t.label, ', ' ORDER BY t.sort_order, t.seat_number) AS seat_label
            FROM (
                SELECT
                       rv.reserved_id,
                       sr.sort_order,
                       s.seat_number,
                       (sr.row_label || s.seat_number::text) AS label
                  FROM reserved rv
                  JOIN reserved_seats rs ON rs.reserved_id = rv.reserved_id
                  JOIN seats s           ON s.seat_id      = rs.seat_id
                  JOIN seat_rows sr      ON sr.row_id      = s.row_id
                 WHERE rv.event_id = :eventId
            ) t
            GROUP BY t.reserved_id
        ),
        lbl_rt AS (
            SELECT t.reserved_id,
                   STRING_AGG(t.label, ', ' ORDER BY t.seat_row, t.seat_col_int) AS seat_label
            FROM (
                SELECT
                       r.reserved_id                AS reserved_id,
                       rt.seat_row                  AS seat_row,
                       (rt.seat_col)::int           AS seat_col_int,
                       (rt.seat_row || rt.seat_col) AS label
                  FROM reserved r
                  JOIN reservation_tickets rt ON rt.reservation_id = r.reserved_id
                 WHERE r.event_id = :eventId
            ) t
            GROUP BY t.reserved_id
        )
        SELECT 
            rv.reserved_id            AS id,
            rv.confirmation_code      AS reserved_code,
            UPPER(COALESCE(rv.payment_status,'UNPAID')) AS status,
            rv.total_amount           AS total,
            rv.payment_method         AS payment_method,
            COALESCE(u.username, '-') AS user,
            TO_CHAR((rv.registration_datetime AT TIME ZONE 'Asia/Bangkok'), 'DD Mon YYYY') AS date,
            COALESCE(lbl_rs.seat_label, lbl_rt.seat_label, '-') AS seat_label,
            (rv.registration_datetime AT TIME ZONE 'Asia/Bangkok') AS registration_ts,
            LEAST(
                rv.registration_datetime + INTERVAL '5 minutes',
                ev.sales_end_datetime
            )                         AS expire_at
        FROM reserved rv
        LEFT JOIN users u   ON u.user_id = rv.user_id
        LEFT JOIN lbl_rs    ON lbl_rs.reserved_id = rv.reserved_id
        LEFT JOIN lbl_rt    ON lbl_rt.reserved_id = rv.reserved_id
        LEFT JOIN events_nam ev ON ev.event_id = rv.event_id
        WHERE rv.event_id = :eventId
        ORDER BY rv.reserved_id DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findReservationSummaryByEvent(@Param("eventId") Long eventId);

    // ----------------------------------------------------------------------
    // ✅ รวมยอดเงินจากใบจองที่ชำระแล้ว (ใช้ใน Dashboard)
    // ----------------------------------------------------------------------
    @Query(value = """
        SELECT COALESCE(SUM(rv.total_amount), 0)
          FROM reserved rv
         WHERE rv.event_id = :eventId
           AND UPPER(COALESCE(rv.payment_status,'UNPAID')) = 'PAID'
        """, nativeQuery = true)
    BigDecimal sumPaidAmountByEvent(@Param("eventId") Long eventId);

    // ----------------------------------------------------------------------
    // ✅ Ticket History ของ user (ตาราง compat view reservations)
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

    // ----------------------------------------------------------------------
    // ✅ ลบใบจองแบบ Hard Delete
    // ----------------------------------------------------------------------
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM reserved WHERE reserved_id = :reservedId", nativeQuery = true)
    void deleteReservationHard(@Param("reservedId") Long reservedId);

    // ----------------------------------------------------------------------
    // ✅ เมธอดสำหรับ "claim" ใบจองของ guest → user
    // ----------------------------------------------------------------------
    @Modifying
    @Transactional
    @Query(value = """
        UPDATE reserved
           SET user_id = :userId,
               guest_claimed_at = NOW(),
               created_as_guest = FALSE
         WHERE user_id IS NULL
           AND created_as_guest = TRUE
           AND guest_email IS NOT NULL
           AND LOWER(guest_email) = LOWER(:email)
        """, nativeQuery = true)
    int claimAllByEmail(@Param("email") String email, @Param("userId") Long userId);
}
