package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Repository สำหรับดึงตั๋วของผู้ใช้ โดย join ตารางทั้งหมดและรวมที่นั่งด้วย string_agg
 */
public interface ReservedRepository extends JpaRepository<Reserved, Long> {

    @Query(value = """
            SELECT 
                r.reserved_id       AS reservedId,
                r.event_id          AS eventId,
                e.event_name        AS eventName,
                e.venue_name        AS venueName,
                e.cover_image_url   AS coverImageUrl,
                e.start_datetime    AS startDatetime,
                r.quantity          AS quantity,
                r.total_amount      AS totalAmount,
                r.payment_status    AS paymentStatus,
                r.confirmation_code AS confirmationCode,
                tt.type_name        AS ticketTypeName,
                /* รวมที่นั่ง เช่น A-1,A-2 (ตามลำดับโซน/แถว/เบอร์) */
                CASE 
                    WHEN COUNT(rs.seat_id) > 0 THEN 
                        STRING_AGG((COALESCE(sr.row_label,'') || '-' || COALESCE(s.seat_number::text,'')), ',' 
                                   ORDER BY COALESCE(sr.sort_order, 0), COALESCE(s.seat_number, 0))
                    ELSE NULL
                END AS seatLabels
            FROM reserved r
            JOIN users u ON u.user_id = r.user_id
            JOIN events_nam e ON e.event_id = r.event_id
            LEFT JOIN ticket_types tt ON tt.ticket_type_id = r.ticket_type_id
            LEFT JOIN reserved_seats rs ON rs.reserved_id = r.reserved_id
            LEFT JOIN seats s ON s.seat_id = rs.seat_id
            LEFT JOIN seat_rows sr ON sr.row_id = s.row_id
            LEFT JOIN seat_zones sz ON sz.zone_id = sr.zone_id
            WHERE UPPER(u.username) = UPPER(:username)
            GROUP BY r.reserved_id, r.event_id, e.event_name, e.venue_name, e.cover_image_url, e.start_datetime,
                     r.quantity, r.total_amount, r.payment_status, r.confirmation_code, tt.type_name
            ORDER BY r.reserved_id DESC
            """, nativeQuery = true)
    List<TicketRowProjection> findTicketsByUsername(@Param("username") String username);

    interface TicketRowProjection {
        Long getReservedId();
        Long getEventId();
        String getEventName();
        String getVenueName();
        String getCoverImageUrl();
        OffsetDateTime getStartDatetime();
        Integer getQuantity();
        BigDecimal getTotalAmount();
        String getPaymentStatus();
        String getConfirmationCode();
        String getTicketTypeName();
        String getSeatLabels();
    }
}
