
package com.example.devops.web;

import com.example.devops.repo.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventsSeatingController {

    private final EventsNamRepository eventsRepo;
    private final SeatZonesRepository zonesRepo;
    private final SeatRowsRepository rowsRepo;
    private final SeatsRepository seatsRepo;
    private final ReservedSeatsRepository reservedSeatsRepo;
    private final TicketTypesRepository ticketTypesRepo;
    private final UserRepository userRepo;
    private final BookingRepository bookingRepo;

    public EventsSeatingController(EventsNamRepository eventsRepo,
                                   SeatZonesRepository zonesRepo,
                                   SeatRowsRepository rowsRepo,
                                   SeatsRepository seatsRepo,
                                   ReservedSeatsRepository reservedSeatsRepo,
                                   TicketTypesRepository ticketTypesRepo,
                                   UserRepository userRepo,
                                   BookingRepository bookingRepo) {
        this.eventsRepo = eventsRepo;
        this.zonesRepo = zonesRepo;
        this.rowsRepo = rowsRepo;
        this.seatsRepo = seatsRepo;
        this.reservedSeatsRepo = reservedSeatsRepo;
        this.ticketTypesRepo = ticketTypesRepo;
        this.userRepo = userRepo;
        this.bookingRepo = bookingRepo;
    }

    @GetMapping("/{eventId}/seating")
    public ResponseEntity<?> getSeating(@PathVariable Long eventId) {
        if (eventsRepo.findById(eventId).isEmpty()) return ResponseEntity.notFound().build();

        var zones = zonesRepo.findZonesByEventIdNative(eventId);
        var taken = reservedSeatsRepo.findTakenSeatIdsByEventIdNative(eventId);
        BigDecimal defaultPrice = ticketTypesRepo.findMinPriceByEventIdNative(eventId);

        var zonesPayload = new ArrayList<Map<String,Object>>();
        for (var z : zones) {
            var rows = rowsRepo.findRowsByZoneIdNative(z.getZoneId());
            var rowsPayload = new ArrayList<Map<String,Object>>();
            for (var r : rows) {
                var seats = seatsRepo.findSeatsByRowIdNative(r.getRowId());
                var seatsPayload = new ArrayList<Map<String,Object>>();
                for (var s : seats) {
                    boolean available = !taken.contains(s.getSeatId());
                    seatsPayload.add(Map.of(
                        "seatId", s.getSeatId(),
                        "label", s.getSeatLabel(),
                        "number", s.getSeatNumber(),
                        "available", available
                    ));
                }
                rowsPayload.add(Map.of(
                    "rowId", r.getRowId(),
                    "label", r.getRowLabel(),
                    "seats", seatsPayload
                ));
            }
            zonesPayload.add(Map.of(
                "zoneId", z.getZoneId(),
                "zoneName", z.getZoneName(),
                "price", defaultPrice,
                "rows", rowsPayload
            ));
        }
        return ResponseEntity.ok(Map.of("eventId", eventId, "zones", zonesPayload));
    }

    @PostMapping("/{eventId}/confirm")
    @Transactional
    public ResponseEntity<?> confirm(@PathVariable Long eventId,
                                     @RequestBody Map<String, Object> body,
                                     Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String username = auth.getName();
        Long userId = userRepo.findUserIdByUsernameIgnoreCaseNative(username);
        if (userId == null) return ResponseEntity.status(401).build();

        @SuppressWarnings("unchecked")
        var seatIdsObj = (List<Object>) body.get("seatIds");
        if (seatIdsObj == null || seatIdsObj.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No seats selected"));
        }
        var seatIds = new ArrayList<Long>();
        for (var o : seatIdsObj) seatIds.add(Long.valueOf(o.toString()));

        var taken = reservedSeatsRepo.findTakenSeatIdsByEventIdNative(eventId);
        for (Long sid : seatIds) {
            if (taken.contains(sid)) {
                return ResponseEntity.status(409).body(Map.of("error", "Seat already taken", "seatId", sid));
            }
        }

        BigDecimal price = ticketTypesRepo.findMinPriceByEventIdNative(eventId);
        BigDecimal total = price.multiply(BigDecimal.valueOf(seatIds.size()));

        Long reservedId = bookingRepo.insertReserved(
            userId, eventId, seatIds.size(), total, "PAID",
            java.util.UUID.randomUUID().toString().replace("-", "").substring(0,12).toUpperCase(),
            Instant.now()
        );

        for (Long sid : seatIds) bookingRepo.insertReservedSeat(reservedId, sid);

        return ResponseEntity.ok(Map.of(
            "reservedId", reservedId,
            "totalAmount", total
        ));
    }
}
