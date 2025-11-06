package com.example.devops.web;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.dto.TicketSetupResponse;
import com.example.devops.service.TicketSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/tickets")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
@RequiredArgsConstructor
public class TicketController {

    private final TicketSetupService ticketSetupService;

    /** PREFILL: ดึงผังที่นั่ง/โซน/ราคา/Advanced/SalesPeriod */
    @GetMapping("/setup")
    public ResponseEntity<?> getSetup(@PathVariable("eventId") Long eventId) {
        Map<String, Object> m = ticketSetupService.getSetup(eventId);
        if (m == null) {
            return ResponseEntity.ok(
                    TicketSetupResponse.builder()
                            .seatRows(0)
                            .seatColumns(0)
                            .zones(List.of())
                            .minPerOrder(null)
                            .maxPerOrder(null)
                            .active(null)
                            .salesStartDatetime(null)
                            .salesEndDatetime(null)
                            .build()
            );
        }

        int seatRows = toInt(m.get("seatRows"), 0);
        int seatColumns = toInt(m.get("seatColumns"), 0);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> zoneMaps =
                (List<Map<String, Object>>) m.getOrDefault("zones", List.of());

        // ✅ ส่ง rows/cols ต่อโซนให้ FE พรีฟิลได้ตรง
        List<TicketSetupResponse.ZonePrice> zones = zoneMaps.stream()
                .map(z -> TicketSetupResponse.ZonePrice.builder()
                        .code((String) z.getOrDefault("code", ""))
                        .name((String) z.getOrDefault("name", ""))
                        .price(toBigDecimal(z.get("price")))
                        .rows(toInteger(z.get("rows")))  // <— เพิ่ม
                        .cols(toInteger(z.get("cols")))  // <— เพิ่ม
                        .build())
                .toList();

        Integer minPerOrder = toInteger(m.get("minPerOrder"));
        Integer maxPerOrder = toInteger(m.get("maxPerOrder"));
        Boolean active = toBoolean(m.get("active"));
        Instant salesStart = toInstant(m.get("salesStartDatetime"));
        Instant salesEnd   = toInstant(m.get("salesEndDatetime"));

        return ResponseEntity.ok(
                TicketSetupResponse.builder()
                        .seatRows(seatRows)
                        .seatColumns(seatColumns)
                        .zones(zones)
                        .minPerOrder(minPerOrder)
                        .maxPerOrder(maxPerOrder)
                        .active(active)
                        .salesStartDatetime(salesStart)
                        .salesEndDatetime(salesEnd)
                        .build()
        );
    }

    /** CREATE/REGENERATE */
    @PostMapping("/setup")
    public ResponseEntity<?> setupTickets(@PathVariable("eventId") Long eventId,
                                          @RequestBody @jakarta.validation.Valid TicketSetupRequest request,
                                          Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Map<String, Object> result = ticketSetupService.setup(eventId, request);
        return ResponseEntity.ok(result);
    }

    /** UPDATE */
    @PutMapping("/setup")
    public ResponseEntity<?> updateTickets(@PathVariable("eventId") Long eventId,
                                           @RequestBody @jakarta.validation.Valid TicketSetupRequest request,
                                           Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Map<String, Object> result = ticketSetupService.update(eventId, request);
        return ResponseEntity.ok(result);
    }

    /** เรนเดอร์เก้าอี้เป็นกริด */
    @GetMapping("/grid")
    public ResponseEntity<?> getSeatGrid(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(ticketSetupService.getSeatGrid(eventId));
    }

    /** ดึงโซนทั้งหมดของอีเวนต์ */
    @GetMapping("/zones")
    public ResponseEntity<?> getZones(@PathVariable("eventId") Long eventId) {
        Map<String, Object> data = ticketSetupService.getSetup(eventId);
        return ResponseEntity.ok(data.get("zones"));
    }

    /* ================= Helpers ================ */
    private static int toInt(Object v, int def) {
        if (v instanceof Number n) return n.intValue();
        try { return v != null ? Integer.parseInt(v.toString()) : def; }
        catch (Exception e) { return def; }
    }
    private static Integer toInteger(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.valueOf(v.toString()); } catch (Exception e) { return null; }
    }
    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal b) return b;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(v.toString());
    }
    private static Boolean toBoolean(Object v) {
        if (v == null) return null;
        if (v instanceof Boolean b) return b;
        return Boolean.valueOf(v.toString());
    }
    private static Instant toInstant(Object v) {
        if (v == null) return null;
        if (v instanceof Instant i) return i;
        try { return Instant.parse(v.toString()); } catch (Exception e) { return null; }
    }
}
