package com.example.devops.controller;

import com.example.devops.model.SeatZones;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.SeatRowsRepository;
import com.example.devops.repo.SeatZonesRepository;
import com.example.devops.repo.SeatsRepository;
import com.example.devops.repo.ZoneTicketTypesRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/events")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEventZoneController {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zttRepo;
    private final ReservedRepository reservedRepo;

    // ✅ ใช้สำหรับ query รายการใบจองแบบ custom (รวมที่นั่งด้วย STRING_AGG)
    private final JdbcTemplate jdbc;

    public AdminEventZoneController(
            SeatZonesRepository seatZonesRepo,
            SeatRowsRepository seatRowsRepo,
            SeatsRepository seatsRepo,
            ZoneTicketTypesRepository zttRepo,
            ReservedRepository reservedRepo,
            JdbcTemplate jdbc
    ) {
        this.seatZonesRepo = seatZonesRepo;
        this.seatRowsRepo = seatRowsRepo;
        this.seatsRepo = seatsRepo;
        this.zttRepo = zttRepo;
        this.reservedRepo = reservedRepo;
        this.jdbc = jdbc;
    }

    /**
     * ✅ รายการโซนของอีเวนต์ พร้อม Row/Column/Price และตัวเลขขายจริง (sold/reserved/available)
     * GET /api/admin/events/{eventId}/zones
     */
    @GetMapping("/{eventId}/zones")
    public ResponseEntity<?> listZonesSummary(@PathVariable("eventId") Long eventId) {
        List<SeatZones> zones = seatZonesRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(eventId);

        List<Map<String, Object>> result = zones.stream().map(z -> {
            Long zoneId = z.getZoneId();

            // 1) โครงสร้างแถว/คอลัมน์
            int rowCount = seatRowsRepo.countByZoneId(zoneId);
            Integer maxSeatsPerRow = seatsRepo.findMaxSeatsPerRowByZoneId(zoneId);
            int columnCount = (maxSeatsPerRow == null ? 0 : maxSeatsPerRow);

            // 2) ราคาจริงจาก ticket type (ถ้ามี)
            BigDecimal price = zttRepo.findFirstPriceByZoneId(zoneId);
            String priceStr = (price != null ? price.toPlainString() : "-");

            // 3) ตัวเลขขายจริงจากฐานข้อมูล
            int totalSeats = seatsRepo.countSeatsInZone(zoneId);
            int soldSeats = seatsRepo.countSoldSeatsInZone(zoneId);
            int reservedSeats = seatsRepo.countReservedSeatsInZone(zoneId); // unpaid ∪ locked (de-dup)
            int available = Math.max(0, totalSeats - soldSeats - reservedSeats);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("zoneId", zoneId);
            m.put("zone", Optional.ofNullable(z.getZoneName()).orElse("Zone #" + zoneId));
            m.put("row", rowCount);
            m.put("column", columnCount);
            m.put("price", priceStr);
            m.put("sold", soldSeats);
            m.put("reserved", reservedSeats);
            m.put("available", available);
            m.put("total", totalSeats);
            // เพื่อความเข้ากันได้กับ FE เดิม
            m.put("sale", soldSeats + "/" + totalSeats);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * ✅ สรุปตัวเลขที่นั่งทั้งงาน (สำหรับกล่อง Available/Reserved/Sold บนหน้า Admin)
     * GET /api/admin/events/{eventId}/seat-stats
     */
    @GetMapping("/{eventId}/seat-stats")
    public ResponseEntity<?> getSeatStats(@PathVariable("eventId") Long eventId) {
        long total = seatsRepo.countTotalSeatsByEvent(eventId);
        long sold = seatsRepo.countSoldSeatsByEvent(eventId);
        long reserved = seatsRepo.countReservedSeatSlotsByEvent(eventId); // unpaid ∪ locked (de-dup)
        long available = Math.max(0, total - sold - reserved);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("total", total);
        body.put("sold", sold);
        body.put("reserved", reserved);
        body.put("available", available);
        return ResponseEntity.ok(body);
    }

    /**
     * ✅ รายการใบจองของอีเวนต์ (ตาราง Reservations)
     *      - รวมที่นั่งทุกตัวในใบจองเดียวกันด้วย STRING_AGG (ไม่ใช้ DISTINCT)
     *      - ทำให้กรณีคนละโซนแต่เลขซ้ำ แสดงได้เป็น "A1, A1" ตามที่ต้องการ
     * GET /api/admin/events/{eventId}/reservations
     */
    @GetMapping("/{eventId}/reservations")
    public ResponseEntity<?> listReservations(@PathVariable("eventId") Long eventId) {

        String sql = """
            SELECT
              rv.reserved_id AS id,
              rv.confirmation_code AS reserved_code,
              UPPER(COALESCE(rv.payment_status,'UNPAID')) AS status,
              rv.total_amount AS total,
              COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.username, '') AS username,
              TO_CHAR((rv.registration_datetime AT TIME ZONE 'Asia/Bangkok'),'DD Mon YYYY') AS date,
              -- ⭐ รวมที่นั่งทุกตัว (ไม่ตัดซ้ำ) → จะได้ "A1, A1" ถ้าคนละโซนแต่เลขซ้ำ
              STRING_AGG(sr.row_label || s.seat_number::text, ', '
                         ORDER BY sz.zone_name, sr.row_label, s.seat_number) AS seat_label,
              rv.payment_method
            FROM reserved rv
            JOIN events_nam ev      ON ev.event_id = rv.event_id
            LEFT JOIN users u       ON u.user_id = rv.user_id
            LEFT JOIN reserved_seats rs ON rs.reserved_id = rv.reserved_id
            LEFT JOIN seats s            ON s.seat_id    = rs.seat_id
            LEFT JOIN seat_rows sr       ON sr.row_id    = s.row_id
            LEFT JOIN seat_zones sz      ON sz.zone_id   = sr.zone_id
            WHERE rv.event_id = ?
            GROUP BY
              rv.reserved_id, rv.confirmation_code, rv.payment_status, rv.total_amount,
              u.first_name, u.last_name, u.username, rv.registration_datetime, rv.payment_method
            ORDER BY rv.reserved_id DESC
        """;

        List<Map<String, Object>> raw = jdbc.queryForList(sql, eventId);

        // map ให้เข้ากับ FE เดิม
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : raw) {
            Map<String, Object> m = new LinkedHashMap<>();
            String code = r.get("reserved_code") != null ? String.valueOf(r.get("reserved_code")) : null;
            String idStr = (code != null && !code.trim().isEmpty()) ? code : String.valueOf(r.get("id"));
            String user = r.get("username") != null ? String.valueOf(r.get("username")) : "-";
            String status = r.get("status") != null ? String.valueOf(r.get("status")) : "UNPAID";

            m.put("id", idStr);
            m.put("seat_label", r.get("seat_label"));
            m.put("total", r.get("total"));
            m.put("user", user);
            m.put("status", status);
            m.put("date", r.get("date"));
            m.put("payment_method", r.get("payment_method"));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }
}
