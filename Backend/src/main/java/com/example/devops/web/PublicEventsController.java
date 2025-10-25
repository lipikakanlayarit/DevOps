package com.example.devops.web;

import com.example.devops.dto.EventCardResponse;
import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.SeatsRepository;
import com.example.devops.service.TicketSetupService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/public/events")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
public class PublicEventsController {

    private final EventsNamRepository eventsRepo;
    private final TicketSetupService ticketSetupService;
    private final SeatsRepository seatsRepo;

    public PublicEventsController(EventsNamRepository eventsRepo,
                                  TicketSetupService ticketSetupService,
                                  SeatsRepository seatsRepo) {
        this.eventsRepo = eventsRepo;
        this.ticketSetupService = ticketSetupService;
        this.seatsRepo = seatsRepo;
    }

    /* Landing */
    @GetMapping(value = "/landing", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<EventCardResponse> landing(@RequestParam(defaultValue = "onSale") String section) {
        List<EventsNam> list;
        switch (section.toLowerCase()) {
            case "upcoming" -> list = eventsRepo.findUpcomingViaView();
            case "onsale" -> list = eventsRepo.findOnSaleViaView();
            default -> list = eventsRepo.findCurrentlyOnSale(Instant.now());
        }
        return list.stream().map(EventCardResponse::from).toList();
    }

    /* Event public info */
    @GetMapping(value = "/{eventId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getEventPublic(@PathVariable Long eventId) {
        return eventsRepo.findById(eventId)
                .<ResponseEntity<?>>map(e -> ResponseEntity.ok(EventPublicResponse.from(e)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(jsonError(
                        "EVENT_NOT_FOUND",
                        "Event " + eventId + " not found"
                )));
    }

    /* ✅ ผังที่นั่ง (public) — เห็นที่นั่งที่ถูกจอง/จ่ายแล้วเป็น X */
    @GetMapping(value = "/{eventId}/tickets/setup", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPublicSeatSetup(@PathVariable("eventId") Long eventId) {
        try {
            var evOpt = eventsRepo.findById(eventId);
            if (evOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(jsonError(
                        "EVENT_NOT_FOUND",
                        "Event " + eventId + " not found"
                ));
            }

            Map<String, Object> setup = null;
            try {
                setup = ticketSetupService.getSetup(eventId);
            } catch (Exception ex) {
                System.err.println("[WARN] getSetup failed: " + ex.getMessage());
            }

            if (setup == null) {
                return ResponseEntity.ok(emptySeatSetup(
                        0, 0, null, null, null,
                        evOpt.get().getSalesStartDatetime(),
                        evOpt.get().getSalesEndDatetime()
                ));
            }

            setup.putIfAbsent("zones", List.of());
            setup.putIfAbsent("seatRows", 0);
            setup.putIfAbsent("seatColumns", 0);
            setup.putIfAbsent("minPerOrder", null);
            setup.putIfAbsent("maxPerOrder", null);
            setup.putIfAbsent("salesStartDatetime", evOpt.get().getSalesStartDatetime());
            setup.putIfAbsent("salesEndDatetime", evOpt.get().getSalesEndDatetime());

            // ✅ ที่นั่งที่จองแล้ว/ชำระแล้ว และล็อกอยู่
            List<Long> takenSeatIds = seatsRepo.findPaidTakenSeatIdsByEvent(eventId);
            List<Long> lockedSeatIds = seatsRepo.findLockedSeatIdsByEvent(eventId);

            Set<Long> allIds = new LinkedHashSet<>();
            allIds.addAll(takenSeatIds);
            allIds.addAll(lockedSeatIds);

            List<Map<String, Object>> occupiedMap = new ArrayList<>();
            if (!allIds.isEmpty()) {
                try {
                    List<Object[]> rows = seatsRepo.findZoneRowColForSeatIds(eventId, allIds.toArray(Long[]::new));
                    for (Object[] r : rows) {
                        Long seatId = ((Number) r[0]).longValue();
                        Long zoneId = ((Number) r[1]).longValue();
                        int row = ((Number) r[2]).intValue() - 1; // convert to 0-based
                        int col = ((Number) r[3]).intValue() - 1;
                        occupiedMap.add(Map.of(
                                "seatId", seatId,
                                "zoneId", zoneId,
                                "r", row,
                                "c", col
                        ));
                    }
                } catch (Exception ex) {
                    System.err.println("[WARN] findZoneRowColForSeatIds failed: " + ex.getMessage());
                }
            }

            // ✅ รวมทั้งหมดเข้า response
            setup.put("takenSeatIds", takenSeatIds);
            setup.put("lockedSeatIds", lockedSeatIds);
            setup.put("occupiedSeatMap", occupiedMap);

            return ResponseEntity.ok(setup);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(emptySeatSetup(0, 0, null, null, null, null, null));
        }
    }

    /* endpoint เบา ๆ ให้ FE รีเฟรชสถานะที่นั่งอย่างเดียว */
    @GetMapping(value = "/{eventId}/seats/taken", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> seatsTaken(@PathVariable Long eventId) {
        if (eventsRepo.findById(eventId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(jsonError(
                    "EVENT_NOT_FOUND",
                    "Event " + eventId + " not found"
            ));
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("takenSeatIds", seatsRepo.findPaidTakenSeatIdsByEvent(eventId));
        m.put("lockedSeatIds", seatsRepo.findLockedSeatIdsByEvent(eventId));
        return ResponseEntity.ok(m);
    }

    /* Cover */
    @GetMapping("/{eventId}/cover")
    public ResponseEntity<byte[]> cover(@PathVariable Long eventId) {
        EventsNam e = eventsRepo.findById(eventId).orElse(null);
        if (e == null || e.getCover_image() == null || e.getCover_image().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        MediaType type = MediaType.IMAGE_JPEG;
        if (e.getCover_image_type() != null) {
            try {
                type = MediaType.parseMediaType(e.getCover_image_type());
            } catch (Exception ignore) {}
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(type);
        if (e.getCover_updated_at() != null) {
            headers.setLastModified(e.getCover_updated_at().toEpochMilli());
        }
        headers.setCacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic());
        return new ResponseEntity<>(e.getCover_image(), headers, HttpStatus.OK);
    }

    /* DTO */
    public record EventPublicResponse(
            Long id,
            String eventName,
            Long categoryId,
            Instant startDatetime,
            Instant endDatetime,
            Instant salesStartDatetime,
            Instant salesEndDatetime,
            String description,
            String venueName,
            String venueAddress,
            Integer maxCapacity,
            String status,
            Instant updatedAt,
            Instant coverUpdatedAt,
            String coverUrl
    ) {
        public static EventPublicResponse from(EventsNam e) {
            String ver = e.getCover_updated_at() != null
                    ? String.valueOf(e.getCover_updated_at().toEpochMilli())
                    : null;
            String coverUrl = "/api/public/events/" + e.getId() + "/cover" + (ver != null ? "?v=" + ver : "");

            return new EventPublicResponse(
                    e.getId(),
                    e.getEventName(),
                    e.getCategoryId(),
                    e.getStartDatetime(),
                    e.getEndDatetime(),
                    e.getSalesStartDatetime(),
                    e.getSalesEndDatetime(),
                    e.getDescription(),
                    e.getVenueName(),
                    e.getVenueAddress(),
                    e.getMaxCapacity(),
                    e.getStatus(),
                    e.getReviewed_at(),
                    e.getCover_updated_at(),
                    coverUrl
            );
        }
    }

    /* helpers */
    private static Map<String, Object> emptySeatSetup(
            Integer seatRows,
            Integer seatColumns,
            Integer minPerOrder,
            Integer maxPerOrder,
            Boolean active,
            Instant salesStartDatetime,
            Instant salesEndDatetime
    ) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("seatRows", seatRows);
        m.put("seatColumns", seatColumns);
        m.put("zones", List.of());
        m.put("minPerOrder", minPerOrder);
        m.put("maxPerOrder", maxPerOrder);
        m.put("active", active);
        m.put("salesStartDatetime", salesStartDatetime);
        m.put("salesEndDatetime", salesEndDatetime);
        m.put("occupiedSeatMap", List.of());
        return m;
    }

    private static Map<String, Object> jsonError(String code, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", code);
        m.put("message", message);
        return m;
    }
}
