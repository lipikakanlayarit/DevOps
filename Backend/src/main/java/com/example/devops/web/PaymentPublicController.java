package com.example.devops.web;

import com.example.devops.model.Reserved;
import com.example.devops.model.ReservedSeats;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@RequiredArgsConstructor
public class PaymentPublicController {

    private final ReservedRepository reservedRepository;
    private final ReservedSeatsRepository reservedSeatsRepo;
    private final SeatsRepository seatsRepo;

    /* ----------------------------------------------
       CREATE RESERVATION
       POST /api/public/reservations
       body: { eventId, quantity, totalAmount, seats:[{zoneId,row,col}] }
       ---------------------------------------------- */
    @PostMapping("/reservations")
    @Transactional
    public ResponseEntity<?> createReservation(@RequestBody Map<String, Object> body) {
        log.info("Creating reservation with body: {}", body);

        Long eventId = parseLong(body.get("eventId"));
        Integer quantity = parseInt(body.get("quantity"));
        BigDecimal totalAmount = parseBigDecimal(body.get("totalAmount"));
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;

        if (eventId == null || quantity == null || totalAmount == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing required fields",
                    "message", "eventId, quantity, totalAmount are required"
            ));
        }

        Reserved r = new Reserved();
        r.setEventId(eventId);
        r.setQuantity(quantity);
        r.setTotalAmount(totalAmount);
        r.setPaymentStatus("UNPAID");
        r.setRegistrationDatetime(Instant.now());
        r.setNotes(notes);
        r = reservedRepository.save(r);
        log.info("Reservation saved successfully with ID: {}", r.getReservedId());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> seatsReq = (List<Map<String, Object>>) body.getOrDefault("seats", List.of());
        List<ReservedSeats> links = new ArrayList<>();

        for (Map<String, Object> m : seatsReq) {
            Long zoneId = parseLong(m.get("zoneId"));
            Integer row = parseInt(m.get("row")); // 0-based
            Integer col = parseInt(m.get("col")); // 0-based
            if (zoneId == null || row == null || col == null) {
                throw new IllegalArgumentException("Invalid seat payload (zoneId/row/col required)");
            }

            int seatNo = col + 1;      // seat_number เป็น 1-based
            int rowNumber = row;       // ถ้า sort_order เก็บ 0-based ให้ใช้ row ตรง ๆ

            Long seatId = seatsRepo.findSeatIdByZoneRowCol(zoneId, rowNumber, seatNo);
            if (seatId == null) {
                throw new IllegalArgumentException("Seat not found for zone=" + zoneId + " row=" + row + " col=" + col);
            }
            if (reservedSeatsRepo.existsBySeatId(seatId)) {
                throw new IllegalStateException("Seat already reserved: seatId=" + seatId);
            }

            ReservedSeats rs = new ReservedSeats();
            rs.setReservedId(r.getReservedId()); // 👈 set id ตรง ๆ
            rs.setSeatId(seatId);                // 👈 set id ตรง ๆ
            links.add(rs);
        }

        if (!links.isEmpty()) reservedSeatsRepo.saveAll(links);

        return ResponseEntity.ok(Map.of(
                "reservedId", r.getReservedId(),
                "paymentStatus", r.getPaymentStatus()
        ));
    }

    /* ----------------------------------------------
       GET RESERVATION
       ---------------------------------------------- */
    @GetMapping("/reservations/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getReservation(@PathVariable Long id) {
        log.info("Fetching reservation: {}", id);
        return reservedRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "RESERVED_NOT_FOUND")));
    }

    /* ----------------------------------------------
       MOCK PAY  (UNPAID -> PAID)
       ---------------------------------------------- */
    @PostMapping("/reservations/{id}/pay")
    @Transactional
    public ResponseEntity<?> pay(@PathVariable Long id) {
        log.info("Processing payment for reservation: {}", id);
        Reserved r = reservedRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RESERVED_NOT_FOUND"));

        if ("PAID".equalsIgnoreCase(r.getPaymentStatus())) {
            return ResponseEntity.ok(Map.of(
                    "status", "ALREADY_PAID",
                    "confirmationCode", r.getConfirmationCode()
            ));
        }

        r.setPaymentStatus("PAID");
        r.setPaymentDatetime(Instant.now());
        if (r.getConfirmationCode() == null || r.getConfirmationCode().isBlank()) {
            r.setConfirmationCode(generateConfirmationCode());
        }
        reservedRepository.save(r);

        log.info("Payment processed successfully for reservation: {}", id);
        return ResponseEntity.ok(Map.of(
                "status", "PAID",
                "confirmationCode", r.getConfirmationCode()
        ));
    }

    /* ----------------------------------------------
       SEAT STATUS สำหรับหน้าแผนผัง
       ---------------------------------------------- */
    @GetMapping("/events/{eventId}/seats/status")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getSeatStatus(@PathVariable Long eventId) {
        List<Long> soldSeatIds = reservedSeatsRepo.findSoldSeatIdsByEvent(eventId);
        return ResponseEntity.ok(Map.of(
                "soldSeatIds", soldSeatIds,
                "lockedSeatIds", List.of()
        ));
    }

    /* Helpers */
    private static final SecureRandom RAND = new SecureRandom();

    private Long parseLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        return Long.parseLong(o.toString());
    }
    private Integer parseInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        return Integer.parseInt(o.toString());
    }
    private BigDecimal parseBigDecimal(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal b) return b;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(o.toString());
    }
    private String generateConfirmationCode() {
        byte[] b = new byte[5];
        RAND.nextBytes(b);
        StringBuilder sb = new StringBuilder("CONF-");
        for (byte x : b) {
            sb.append(Character.forDigit((x >> 4) & 0xF, 16));
            sb.append(Character.forDigit((x & 0xF), 16));
        }
        return sb.toString().toUpperCase();
    }
}
