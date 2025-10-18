package com.example.devops.web;

import com.example.devops.dto.ReservedResponse;
import com.example.devops.model.Reserved;
import com.example.devops.repo.ReservedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/public/reservations")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@RequiredArgsConstructor
public class PaymentPublicController {

    private final ReservedRepository reservedRepository;

    /** สร้างการจองใหม่ (CREATE) */
    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Map<String, Object> body) {
        try {
            log.info("Creating reservation with body: {}", body);

            // Parse request body with null checks
            Long eventId = parseNumber(body.get("eventId"));
            Integer quantity = parseNumber(body.get("quantity")).intValue();
            BigDecimal totalAmount = parseBigDecimal(body.get("totalAmount"));
            String notes = body.get("notes") != null ? body.get("notes").toString() : null;

            // Validate required fields
            if (eventId == null || quantity == null || totalAmount == null) {
                log.error("Missing required fields - eventId: {}, quantity: {}, totalAmount: {}",
                        eventId, quantity, totalAmount);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields",
                                "message", "eventId, quantity, and totalAmount are required"));
            }

            // สร้าง Reserved entity
            Reserved reserved = new Reserved();
            reserved.setEvent_id(eventId);
            reserved.setQuantity(quantity);
            reserved.setTotal_amount(totalAmount);
            reserved.setPayment_status("UNPAID");
            reserved.setRegistration_datetime(Instant.now());
            reserved.setNotes(notes);

            // Optional fields with safe parsing
            if (body.containsKey("userId") && body.get("userId") != null) {
                try {
                    reserved.setUser_id(parseNumber(body.get("userId")));
                } catch (Exception e) {
                    log.warn("Failed to parse userId: {}", body.get("userId"));
                }
            }

            if (body.containsKey("ticketTypeId") && body.get("ticketTypeId") != null) {
                try {
                    reserved.setTicket_type_id(parseNumber(body.get("ticketTypeId")));
                } catch (Exception e) {
                    log.warn("Failed to parse ticketTypeId: {}", body.get("ticketTypeId"));
                }
            }

            // Save to database
            log.info("Saving reservation: {}", reserved);
            Reserved saved = reservedRepository.save(reserved);
            log.info("Reservation saved successfully with ID: {}", saved.getReserved_id());

            // Return response
            return ResponseEntity.ok(ReservedResponse.from(saved));

        } catch (IllegalArgumentException e) {
            log.error("Validation error: ", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation error",
                            "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating reservation: ", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Internal server error",
                            "message", e.getMessage(),
                            "type", e.getClass().getSimpleName()));
        }
    }

    /** อ่านข้อมูลการจองไปแสดงหน้า Payment */
    @GetMapping("/{reservedId}")
    public ResponseEntity<?> getOne(@PathVariable("reservedId") Long reservedId) {
        log.info("Fetching reservation: {}", reservedId);
        Optional<Reserved> opt = reservedRepository.findById(reservedId);
        if (opt.isEmpty()) {
            log.warn("Reservation not found: {}", reservedId);
            return ResponseEntity.status(404).body(Map.of("error", "RESERVED_NOT_FOUND"));
        }
        return ResponseEntity.ok(ReservedResponse.from(opt.get()));
    }

    /** ชำระเงินแบบง่าย: เปลี่ยนสถานะ UNPAID -> PAID + ใส่ confirmation_code */
    @PostMapping("/{reservedId}/pay")
    public ResponseEntity<?> pay(@PathVariable("reservedId") Long reservedId,
                                 @RequestBody(required = false) Map<String, Object> body) {
        log.info("Processing payment for reservation: {}", reservedId);
        Optional<Reserved> opt = reservedRepository.findById(reservedId);
        if (opt.isEmpty()) {
            log.warn("Reservation not found: {}", reservedId);
            return ResponseEntity.status(404).body(Map.of("error", "RESERVED_NOT_FOUND"));
        }

        Reserved r = opt.get();
        if ("PAID".equalsIgnoreCase(r.getPayment_status())) {
            log.info("Reservation already paid: {}", reservedId);
            return ResponseEntity.ok(ReservedResponse.from(r));
        }

        // จำลองการชำระเงินสำเร็จ
        r.setPayment_status("PAID");
        r.setPayment_datetime(Instant.now());

        // ถ้ายังไม่มี confirmation_code ให้สร้าง
        if (r.getConfirmation_code() == null || r.getConfirmation_code().isBlank()) {
            String code = "CONF-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
            r.setConfirmation_code(code);
        }

        reservedRepository.save(r);
        log.info("Payment processed successfully for reservation: {}", reservedId);

        return ResponseEntity.ok(ReservedResponse.from(r));
    }

    // Helper methods
    private Long parseNumber(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        try {
            return Long.parseLong(obj.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid number format: " + obj);
        }
    }

    private BigDecimal parseBigDecimal(Object obj) {
        if (obj == null) return null;
        if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        }
        if (obj instanceof Number) {
            return BigDecimal.valueOf(((Number) obj).doubleValue());
        }
        try {
            return new BigDecimal(obj.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid decimal format: " + obj);
        }
    }
}