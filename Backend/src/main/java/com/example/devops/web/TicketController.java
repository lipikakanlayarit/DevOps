package com.example.devops.web;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.service.TicketSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/tickets")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000"}, allowCredentials = "true")
@RequiredArgsConstructor
public class TicketController {

    private final TicketSetupService ticketSetupService;

    /**
     * สร้าง/รีเจนที่นั่งตามค่าที่กรอก (rows, columns, zones, price)
     * รับได้ทั้งโหมดง่าย (zone/price เดียว) และหลายโซน (zones[])
     *
     * POST /api/events/{eventId}/tickets/setup
     */
    @PostMapping("/setup")
    public ResponseEntity<?> setupTickets(@PathVariable("eventId") Long eventId,
                                          @RequestBody TicketSetupRequest request,
                                          Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(
                    java.util.Map.of("error", "Unauthorized")
            );
        }

        // debug ไว้เช็คค่าเข้า
        System.out.println("[tickets.setup] eventId=" + eventId
                + " rows=" + request.getSeatRows()
                + " cols=" + request.getSeatColumns()
                + " zones=" + (request.getZones() == null ? 0 : request.getZones().size()));

        return ResponseEntity.ok(ticketSetupService.setup(eventId, request));
    }

    /**
     * ดึงผังที่นั่งแบบพร้อมเรนเดอร์ (group เป็นแถว)
     * GET /api/events/{eventId}/tickets/grid
     */
    @GetMapping("/grid")
    public ResponseEntity<?> getSeatGrid(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(ticketSetupService.getSeatGrid(eventId));
    }

    /**
     * ดึงรายการโซน/ราคา ของอีเวนต์ (ถ้ามีเก็บในตารางโซน)
     * GET /api/events/{eventId}/tickets/zones
     */
    @GetMapping("/zones")
    public ResponseEntity<?> getZones(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(ticketSetupService.getZones(eventId));
    }
}
