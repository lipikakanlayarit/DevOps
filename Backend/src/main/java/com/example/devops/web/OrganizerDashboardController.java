package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/organizer/events")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
@RequiredArgsConstructor
public class OrganizerDashboardController {

    private final EventsNamRepository eventsRepo;
    private final ReservedRepository reservedRepo;
    private final ReservedSeatsRepository reservedSeatsRepo;
    private final SeatsRepository seatsRepo;
    private final JdbcTemplate jdbc;

    @GetMapping("/{eventId}/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getDashboard(@PathVariable Long eventId) {
        log.info("📊 Dashboard summary requested for eventId={}", eventId);

        var eventOpt = eventsRepo.findById(eventId);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "EVENT_NOT_FOUND"));
        }
        EventsNam ev = eventOpt.get();

        long totalSeatCount   = seatsRepo.countTotalSeatsByEvent(eventId);
        long soldSeatCount    = seatsRepo.countSoldSeatsByEvent(eventId);
        long reservedSeatCnt  = seatsRepo.countReservedSeatSlotsByEvent(eventId);
        long availableSeatCnt = Math.max(0, totalSeatCount - soldSeatCount - reservedSeatCnt);

        BigDecimal totalPaid = reservedRepo.sumPaidAmountByEvent(eventId);
        if (totalPaid == null) totalPaid = BigDecimal.ZERO;

        // ✅ seat-level rows; unit_price ใช้จาก seat_zones.price (sz.price)
        String rowsSql = """
            SELECT
              rv.reserved_id AS id,
              rv.confirmation_code AS reserved_code,
              UPPER(COALESCE(rv.payment_status,'UNPAID')) AS status,
              sz.price AS unit_price,  -- 👈 ใช้ราคาจาก seat_zones
              COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.username, '') AS user,
              TO_CHAR((rv.registration_datetime AT TIME ZONE 'Asia/Bangkok'),'DD Mon YYYY') AS date,
              LOWER(COALESCE(sz.zone_name, sz.description, '')) || ' ' ||
              sr.row_label || s.seat_number::text AS seat_label,
              rv.payment_method,
              s.seat_id AS seat_id,
              (rv.registration_datetime AT TIME ZONE 'Asia/Bangkok') AS registration_ts,
              LEAST(rv.registration_datetime + INTERVAL '5 minutes', ev.sales_end_datetime) AS expire_at
            FROM reserved rv
            JOIN events_nam ev        ON ev.event_id = rv.event_id
            LEFT JOIN users u         ON u.user_id   = rv.user_id
            LEFT JOIN reserved_seats rs ON rs.reserved_id = rv.reserved_id
            LEFT JOIN seats s            ON s.seat_id     = rs.seat_id
            LEFT JOIN seat_rows sr       ON sr.row_id     = s.row_id
            LEFT JOIN seat_zones sz      ON sz.zone_id    = sr.zone_id
            WHERE rv.event_id = ?
            ORDER BY rv.reserved_id DESC, sz.zone_name, sr.row_label, s.seat_number
        """;

        List<Map<String, Object>> rows = jdbc.queryForList(rowsSql, eventId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("eventId", eventId);
        result.put("eventName", ev.getEventName());
        result.put("ticketTarget", totalSeatCount);
        result.put("sold", soldSeatCount);
        result.put("reserved", reservedSeatCnt);
        result.put("available", availableSeatCnt);
        result.put("netPayout", totalPaid);
        result.put("ticketSoldNow", soldSeatCount);
        result.put("rows", rows);

        return ResponseEntity.ok(result);
    }
}
