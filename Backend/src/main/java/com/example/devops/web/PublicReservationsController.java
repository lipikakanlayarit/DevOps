package com.example.devops.web;

import com.example.devops.dto.ReservationRequest;
import com.example.devops.dto.ReservedResponse;
import com.example.devops.model.User;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.UserRepository;
import com.example.devops.service.ReservationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/public/reservations")
@CrossOrigin(
        origins = { "http://localhost:5173", "http://localhost:3000", "http://localhost:4173" },
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

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createReservation(
            @RequestBody ReservationRequest req,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (req == null) return bad("BAD_REQUEST", "Body is required");
        if (req.getEventId() == null || req.getEventId() <= 0)
            return bad("BAD_REQUEST", "eventId is required");
        if (!eventsRepo.existsById(req.getEventId()))
            return notFound("EVENT_NOT_FOUND", "Event " + req.getEventId() + " not found");
        if (req.getQuantity() == null || req.getQuantity() <= 0)
            return bad("BAD_REQUEST", "quantity must be > 0");

        final List<ReservationRequest.SeatPick> picks = Optional.ofNullable(req.getSeats()).orElseGet(List::of);
        if (picks.size() != req.getQuantity())
            return bad("BAD_REQUEST", "quantity and seats count mismatch");

        // 🔐 validate picks (no negative, no duplicates)
        Set<String> uniq = new HashSet<>();
        for (ReservationRequest.SeatPick p : picks) {
            if (p == null || p.getZoneId() == null)
                return bad("BAD_REQUEST", "each seat requires zoneId,row,col");
            if (p.getRow() == null || p.getCol() == null || p.getRow() < 0 || p.getCol() < 0)
                return bad("BAD_REQUEST", "row/col must be >= 0");
            String key = p.getZoneId() + ":" + p.getRow() + ":" + p.getCol();
            if (!uniq.add(key))
                return bad("BAD_REQUEST", "duplicate seat in request: " + key);
        }

        Long userId = resolveUserId(userIdHeader, authHeader);
        log.info("Create reservation: eventId={}, quantity={}, seatCount={}, userId={}",
                req.getEventId(), req.getQuantity(), picks.size(), userId);

        if (userId == null) {
            return unauthorized("AUTH_REQUIRED", "User authentication required (JWT or X-User-Id).");
        }

        try {
            ReservedResponse created = reservationService.createReservation(userId, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException iae) {
            return bad("BAD_REQUEST", iae.getMessage());
        }
    }

    @GetMapping(value = "/{reservedId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getReservation(@PathVariable Long reservedId) {
        if (reservedId == null || reservedId <= 0)
            return bad("BAD_REQUEST", "reservedId is invalid");

        try {
            ReservedResponse res = reservationService.getReservation(reservedId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return notFound("RESERVATION_NOT_FOUND", e.getMessage());
        }
    }

    @PostMapping(
            value = "/{reservedId}/pay",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> pay(
            @PathVariable Long reservedId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        if (reservedId == null || reservedId <= 0)
            return bad("BAD_REQUEST", "reservedId is invalid");

        String method = null;
        if (body != null && body.get("method") != null)
            method = String.valueOf(body.get("method"));

        try {
            ReservedResponse res = reservationService.payMock(reservedId, method);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return notFound("RESERVATION_NOT_FOUND", e.getMessage());
        }
    }

    // ===== helpers =====
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

    private ResponseEntity<Map<String, Object>> unauthorized(String code, String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", code);
        m.put("message", msg);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(m);
    }

    private Long resolveUserId(Long userIdHeader, String authHeader) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String principal = safeTrim(auth.getName());
                if (principal != null) {
                    Optional<User> uByName = userRepo.findByUsernameIgnoreCase(principal);
                    if (uByName.isPresent()) return uByName.get().getId();
                    Optional<User> uByEmail = userRepo.findByEmailIgnoreCase(principal);
                    if (uByEmail.isPresent()) return uByEmail.get().getId();
                }
            }
        } catch (Exception e) {
            log.debug("resolveUserId: SecurityContext lookup failed: {}", e.getMessage());
        }

        Long fromJwt = resolveFromJwt(authHeader);
        if (fromJwt != null) return fromJwt;

        if (userIdHeader != null) return userIdHeader;
        return null;
    }

    private Long resolveFromJwt(String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
            String token = authHeader.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);

            Object userIdClaim = claims.get("userId");
            if (userIdClaim != null) {
                try { return Long.parseLong(String.valueOf(userIdClaim)); } catch (NumberFormatException ignore) {}
            }

            String email = safeTrim(claims.get("email"));
            if (email != null) {
                Optional<User> u = userRepo.findByEmailIgnoreCase(email);
                if (u.isPresent()) return u.get().getId();
            }

            String username = safeTrim(claims.get("sub"));
            if (username == null) username = safeTrim(claims.get("username"));
            if (username != null) {
                Optional<User> u = userRepo.findByUsernameIgnoreCase(username);
                if (u.isPresent()) return u.get().getId();
            }
        } catch (Exception e) {
            log.warn("resolveUserId/JWT: {}", e.getMessage());
        }
        return null;
    }

    private String safeTrim(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }
}
