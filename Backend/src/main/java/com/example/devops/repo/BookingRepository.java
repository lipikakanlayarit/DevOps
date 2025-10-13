
package com.example.devops.repo;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Repository
public class BookingRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public BookingRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long insertReserved(Long userId, Long eventId, int quantity, BigDecimal total, String status, String code, Instant now) {
        var sql = "INSERT INTO reserved (user_id, event_id, quantity, total_amount, payment_status, confirmation_code, registration_datetime) " +
                  "VALUES (:userId, :eventId, :quantity, :total, :status, :code, :now) RETURNING reserved_id";
        var params = new MapSqlParameterSource(Map.of(
                "userId", userId,
                "eventId", eventId,
                "quantity", quantity,
                "total", total,
                "status", status,
                "code", code,
                "now", now
        ));
        return jdbc.queryForObject(sql, params, Long.class);
    }

    public void insertReservedSeat(Long reservedId, Long seatId) {
        var sql = "INSERT INTO reserved_seats (reserved_id, seat_id) VALUES (:rid, :sid)";
        var params = new MapSqlParameterSource(Map.of("rid", reservedId, "sid", seatId));
        jdbc.update(sql, params);
    }
}
