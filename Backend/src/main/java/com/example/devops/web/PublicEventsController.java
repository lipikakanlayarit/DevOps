package com.example.devops.web;

import com.example.devops.dto.EventCardResponse;
import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.service.TicketSetupService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/events")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
public class PublicEventsController {

    private final EventsNamRepository eventsRepo;
    private final TicketSetupService ticketSetupService;

    public PublicEventsController(EventsNamRepository eventsRepo,
                                  TicketSetupService ticketSetupService) {
        this.eventsRepo = eventsRepo;
        this.ticketSetupService = ticketSetupService;
    }

    /* ============================================================
       🔹 Landing: แสดงอีเวนต์ OnSale / Upcoming
       ============================================================ */
    @GetMapping(value = "/landing", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<EventCardResponse> landing(@RequestParam(defaultValue = "onSale") String section) {
        List<EventsNam> list;
        switch (section.toLowerCase()) {
            case "upcoming" -> list = eventsRepo.findUpcomingViaView();
            case "onsale"   -> list = eventsRepo.findOnSaleViaView();
            default         -> list = eventsRepo.findCurrentlyOnSale(Instant.now());
        }
        return list.stream().map(EventCardResponse::from).toList();
    }

    /* ============================================================
       🔹 หน้า EventSelect (public): ดึงรายละเอียดอีเวนต์เดียว
       ============================================================ */
    @GetMapping(value = "/{eventId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getEventPublic(@PathVariable Long eventId) {
        return eventsRepo.findById(eventId)
                .<ResponseEntity<?>>map(e -> ResponseEntity.ok(EventPublicResponse.from(e)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(jsonError(
                        "EVENT_NOT_FOUND",
                        "Event " + eventId + " not found"
                )));
    }

    /* ============================================================
       🔹 ผังที่นั่ง (public) — กันพังและไม่ใช้ Map.of(null)
       ============================================================ */
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
                // กันพัง: ถ้า service ล้มก็ไปใช้ fallback ข้างล่าง
                System.err.println("[WARN] getSetup failed: " + ex.getMessage());
            }

            if (setup == null) {
                // ⚠️ ห้ามใช้ Map.of เพราะมีค่า null
                return ResponseEntity.ok(emptySeatSetup(
                        0, 0, null, null, null,
                        evOpt.get().getSalesStartDatetime(),
                        evOpt.get().getSalesEndDatetime()
                ));
            }

            // normalize keys ให้ครบ ป้องกัน NPE ฝั่ง FE
            setup.putIfAbsent("seatRows", 0);
            setup.putIfAbsent("seatColumns", 0);
            setup.putIfAbsent("zones", List.of());
            setup.putIfAbsent("minPerOrder", null);
            setup.putIfAbsent("maxPerOrder", null);
            setup.putIfAbsent("active", null);
            setup.putIfAbsent("salesStartDatetime", null);
            setup.putIfAbsent("salesEndDatetime", null);

            return ResponseEntity.ok(setup);
        } catch (Exception e) {
            e.printStackTrace();
            // ⚠️ ห้ามใช้ Map.of เพราะมีค่า null
            return ResponseEntity.ok(emptySeatSetup(
                    0, 0, null, null, null, null, null
            ));
        }
    }

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
        return m;
    }

    private static Map<String, Object> jsonError(String code, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", code);
        m.put("message", message);
        return m;
    }

    /* ============================================================
       🔹 รูปปก (Cover)
       ============================================================ */
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

    /* ============================================================
       🔹 DTO: ข้อมูล Event สำหรับหน้า Public
       ============================================================ */
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
}
