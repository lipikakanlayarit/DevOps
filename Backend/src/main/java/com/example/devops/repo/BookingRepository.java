package com.example.devops.repo;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class BookingRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public BookingRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** ที่นั่งที่ถูกจองแล้วของงานนี้ (ใช้กันจองซ้ำ) */
    public List<Long> findReservedSeatIdsByEvent(Long eventId) {
        String sql = """
            SELECT rs.seat_id
            FROM reserved_seats rs
            JOIN reserved r ON r.reserved_id = rs.reserved_id
            WHERE r.event_id = :eventId
            """;
        return jdbc.queryForList(sql, Map.of("eventId", eventId), Long.class);
    }

    /** ราคาต่ำสุดของงาน ใช้คำนวณราคารวมแบบง่าย */
    public BigDecimal getMinPriceByEvent(Long eventId) {
        String sql = "SELECT COALESCE(MIN(price), 0) FROM ticket_types WHERE event_id = :eventId";
        BigDecimal price = jdbc.queryForObject(sql, Map.of("eventId", eventId), BigDecimal.class);
        return price != null ? price : BigDecimal.ZERO;
    }

    /* ==============================
       INSERT RESERVED (เวอร์ชันแนะนำ)
       ไม่ต้องส่ง Instant มาก็ได้ ระบบจะใช้ now()
       ============================== */
    public Long insertReserved(
            Long userId,
            Long eventId,
            int quantity,
            BigDecimal totalAmount,
            String paymentStatus,
            String confirmationCode
    ) {
        return insertReserved(userId, eventId, quantity, totalAmount, paymentStatus, confirmationCode, Instant.now());
    }

    /* ==========================================
       INSERT RESERVED (โอเวอร์โหลด ให้เข้ากับโค้ดเดิม)
       ที่ controller ส่ง Instant มาด้วย
       ========================================== */
    public Long insertReserved(
            Long userId,
            Long eventId,
            int quantity,
            BigDecimal totalAmount,
            String paymentStatus,
            String confirmationCode,
            Instant registrationInstant
    ) {
        String sql = """
            INSERT INTO reserved
              (user_id, event_id, quantity, total_amount, payment_status, confirmation_code, registration_datetime)
            VALUES
              (:userId, :eventId, :quantity, :totalAmount, :paymentStatus, :confirmationCode, :registrationDatetime)
            RETURNING reserved_id
            """;

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("eventId", eventId);
        params.put("quantity", quantity);
        params.put("totalAmount", totalAmount);
        params.put("paymentStatus", paymentStatus);
        params.put("confirmationCode", confirmationCode);
        params.put("registrationDatetime",
                Timestamp.from(registrationInstant != null ? registrationInstant : Instant.now()));

        return jdbc.queryForObject(sql, params, Long.class);
    }

    /* ======================================
       INSERT RESERVED_SEATS (แบบเดี่ยว)
       ให้เข้ากับโค้ดเดิมที่เรียก insertReservedSeat
       ====================================== */
    public int insertReservedSeat(Long reservedId, Long seatId) {
        String sql = """
            INSERT INTO reserved_seats (reserved_id, seat_id)
            VALUES (:reservedId, :seatId)
            """;
        return jdbc.update(sql, new MapSqlParameterSource()
                .addValue("reservedId", reservedId)
                .addValue("seatId", seatId));
    }

    /* ==============================
       INSERT RESERVED_SEATS (แบบชุด)
       ใช้ตอนส่งเป็นลิสต์
       ============================== */
    public int[] bulkInsertReservedSeats(Long reservedId, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) return new int[0];
        String sql = """
            INSERT INTO reserved_seats (reserved_id, seat_id)
            VALUES (:reservedId, :seatId)
            """;
        MapSqlParameterSource[] batch = seatIds.stream()
                .map(seatId -> new MapSqlParameterSource()
                        .addValue("reservedId", reservedId)
                        .addValue("seatId", seatId))
                .toArray(MapSqlParameterSource[]::new);
        return jdbc.batchUpdate(sql, batch);
    }
}
