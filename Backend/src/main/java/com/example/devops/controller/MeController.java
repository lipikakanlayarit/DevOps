package com.example.devops.controller;

import com.example.devops.dto.TicketItemDTO;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedRepository.TicketRowProjection;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class MeController {

    private final ReservedRepository reservedRepository;

    public MeController(ReservedRepository reservedRepository) {
        this.reservedRepository = reservedRepository;
    }

    @GetMapping("/api/auth/my-tickets")
    public ResponseEntity<Map<String, Object>> getMyTickets(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated"));
        }
        String username = authentication.getName();

        List<TicketRowProjection> rows = reservedRepository.findTicketsByUsername(username);

        List<TicketItemDTO> tickets = rows.stream().map(r -> {
            List<String> seatList = Optional.ofNullable(r.getSeatLabels())
                    .map(s -> Arrays.stream(s.split(","))
                            .map(String::trim)
                            .filter(x -> !x.isEmpty())
                            .collect(Collectors.toList()))
                    .orElseGet(ArrayList::new);

            Integer qty = Optional.ofNullable(r.getQuantity()).orElse(0);
            if (seatList.isEmpty() && qty > 0) {
                // ถ้าไม่มี seat mapping ให้สร้าง placeholder เท่ากับจำนวนใบ
                seatList = new ArrayList<>();
                for (int i = 0; i < qty; i++) seatList.add("-");
            }

            OffsetDateTime startDt = r.getStartDatetime();
            String startIso = startDt != null ? startDt.toString() : null;

            BigDecimal total = r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO;

            return new TicketItemDTO(
                    r.getReservedId(),
                    r.getEventId(),
                    r.getEventName(),
                    r.getVenueName(),
                    r.getCoverImageUrl(),
                    startIso,
                    r.getQuantity(),
                    total,
                    r.getPaymentStatus(),
                    r.getConfirmationCode(),
                    r.getTicketTypeName(),
                    seatList
            );
        }).toList();

        Map<String, Object> body = new HashMap<>();
        body.put("tickets", tickets);
        return ResponseEntity.ok(body);
    }
}
