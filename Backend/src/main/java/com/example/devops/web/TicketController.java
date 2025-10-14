package com.example.devops.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
public class TicketController {

    @PostMapping("/{eventId}/tickets/setup")
    public ResponseEntity<?> setupTickets(@PathVariable Long eventId,
                                          @RequestBody Map<String, Object> payload,
                                          Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        // TODO: เขียน logic บันทึก ticket จริง ๆ: zone/price/qty ฯลฯ
        // สมมติบันทึกเสร็จ
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "eventId", eventId,
                "saved", payload
        ));
    }
}
