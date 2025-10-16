package com.example.devops.web;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.dto.TicketSetupResponse;
import com.example.devops.model.SeatZones;
import com.example.devops.service.TicketSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    /**
     * PREFILL: ดึงผังที่นั่ง/โซน/ราคาปัจจุบันของอีเวนต์
     * ถ้ายังไม่เคยตั้งค่า จะคืน 200 + โครงว่าง (ไม่ 404)
     */
    @GetMapping("/setup")
    public ResponseEntity<?> getSetup(@PathVariable("eventId") Long eventId) {
        Map<String, Object> m = ticketSetupService.getSetup(eventId);
        if (m == null) {
            return ResponseEntity.ok(
                    TicketSetupResponse.builder()
                            .seatRows(0)
                            .seatColumns(0)
                            .zones(List.of())
                            .build()
            );
        }

        // Map → DTO
        int seatRows = (Integer) m.getOrDefault("seatRows", 0);
        int seatColumns = (Integer) m.getOrDefault("seatColumns", 0);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> zoneMaps = (List<Map<String, Object>>) m.getOrDefault("zones", List.of());

        List<TicketSetupResponse.ZonePrice> zones = zoneMaps.stream()
                .map(z -> TicketSetupResponse.ZonePrice.builder()
                        .code((String) z.getOrDefault("code", ""))
                        .name((String) z.getOrDefault("name", ""))
                        .price((Integer) z.getOrDefault("price", null))
                        .build())
                .toList();

        return ResponseEntity.ok(
                TicketSetupResponse.builder()
                        .seatRows(seatRows)
                        .seatColumns(seatColumns)
                        .zones(zones)
                        .build()
        );
    }

    /**
     * CREATE/REGENERATE: ลบของเก่าและสร้างผังใหม่ตาม payload
     */
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

    /**
     * UPDATE: (ตอนนี้ใช้วิธี regenerate ทั้งชุดเหมือน POST)
     */
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

    /**
     * ใช้เรนเดอร์เก้าอี้เป็นกริดในหน้าอื่น
     */
    @GetMapping("/grid")
    public ResponseEntity<?> getSeatGrid(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(ticketSetupService.getSeatGrid(eventId));
    }

    /**
     * ดึงรายการโซนทั้งหมดของอีเวนต์ (ตามลำดับ sort)
     */
    @GetMapping("/zones")
    public ResponseEntity<?> getZones(@PathVariable("eventId") Long eventId) {
        List<SeatZones> zones = ticketSetupService.getZones(eventId);
        return ResponseEntity.ok(zones);
    }
}
