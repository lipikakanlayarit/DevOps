// src/main/java/com/example/devops/web/PublicReservationsController.java
package com.example.devops.web;

import com.example.devops.dto.ReservationRequest;
import com.example.devops.dto.ReservedResponse;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.UserRepository;
import com.example.devops.service.ReservationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/reservations")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"},
        allowCredentials = "true"
)
public class PublicReservationsController {

    private static final Logger log = LoggerFactory.getLogger(PublicReservationsController.class);

    private final ReservationService reservationService;
    private final EventsNamRepository eventsRepo;
    private final UserRepository userRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PublicReservationsController(ReservationService reservationService,
                                        EventsNamRepository eventsRepo,
                                        UserRepository userRepo) {
        this.reservationService = reservationService;
        this.eventsRepo = eventsRepo;
        this.userRepo = userRepo;
    }

    /* ============================================================
       POST /api/public/reservations
       ============================================================ */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createReservation(
            @RequestBody ReservationRequest req,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (req == null) {
            return bad("BAD_REQUEST", "Body is required");
        }
        if (req.getEventId() == null || req.getEventId() <= 0) {
            return bad("BAD_REQUEST", "eventId is required");
        }
        if (!eventsRepo.existsById(req.getEventId())) {
            return notFound("EVENT_NOT_FOUND", "Event " + req.getEventId() + " not found");
        }
        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            return bad("BAD_REQUEST", "quantity must be > 0");
        }
        int seatCount = (req.getSeats() != null) ? req.getSeats().size() : 0;
        if (seatCount != req.getQuantity()) {
            return bad("BAD_REQUEST", "quantity and seats count mismatch");
        }

        // ✅ หา userId จาก X-User-Id หรือจาก JWT (Authorization: Bearer ...)
        Long userId = resolveUserId(userIdHeader, authHeader);

        log.info("Create reservation: eventId={}, quantity={}, seatCount={}, userId={}",
                req.getEventId(), req.getQuantity(), seatCount, userId);

        try {
            ReservedResponse created = reservationService.createReservation(userId, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException iae) {
            return bad("BAD_REQUEST", iae.getMessage());
        }
    }

    /* ============================================================
       GET /api/public/reservations/{reservedId}
       ============================================================ */
    @GetMapping(value = "/{reservedId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getReservation(@PathVariable Long reservedId) {
        if (reservedId == null || reservedId <= 0) {
            return bad("BAD_REQUEST", "reservedId is invalid");
        }
        try {
            ReservedResponse res = reservationService.getReservation(reservedId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return notFound("RESERVATION_NOT_FOUND", e.getMessage());
        }
    }

    /* ============================================================
       POST /api/public/reservations/{reservedId}/pay
       body: { "method": "Credit Card" | "Bank Transfer" | "QR Payment" }
       ============================================================ */
    @PostMapping(value = "/{reservedId}/pay",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> pay(
            @PathVariable Long reservedId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        if (reservedId == null || reservedId <= 0) {
            return bad("BAD_REQUEST", "reservedId is invalid");
        }
        String method = null;
        if (body != null && body.get("method") != null) {
            method = String.valueOf(body.get("method"));
        }
        try {
            ReservedResponse res = reservationService.payMock(reservedId, method);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return notFound("RESERVATION_NOT_FOUND", e.getMessage());
        }
    }

    /* ===================== helpers (JSON error) ===================== */
    private ResponseEntity<Map<String, Object>> bad(String code, String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", code);
        m.put("message", msg);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(m);
    }

    private ResponseEntity<Map<String, Object>> notFound(String code, String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", code);
        m.put("message", msg);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(m);
    }

    /* ===================== userId resolver ===================== */
    private Long resolveUserId(Long userIdHeader, String authHeader) {
        if (userIdHeader != null) return userIdHeader;

        // ลองอ่านจาก JWT (ไม่ verify ลายเซ็น — ใช้เพื่อ mapping ผู้ใช้เท่านั้น)
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
            String token = authHeader.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);

            // 1) ถ้ามี userId ใน claims ใช้ตรง ๆ
            Object userIdClaim = claims.get("userId");
            if (userIdClaim != null) {
                try {
                    return Long.parseLong(String.valueOf(userIdClaim));
                } catch (NumberFormatException ignore) {}
            }

            // 2) ลองจาก email
            String email = optString(claims.get("email"));
            if (email != null) {
                Optional<com.example.devops.model.User> u = userRepo.findByEmailIgnoreCase(email);
                if (u.isPresent()) return u.get().getId();
            }

            // 3) ลองจาก subject/username
            String username = optString(claims.get("sub"));
            if (username == null) username = optString(claims.get("username"));
            if (username != null) {
                Optional<com.example.devops.model.User> u = userRepo.findByUsernameIgnoreCase(username);
                if (u.isPresent()) return u.get().getId();
            }
        } catch (Exception e) {
            log.warn("resolveUserId: cannot extract from JWT: {}", e.getMessage());
        }
        return null;
    }

    private String optString(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }
}
