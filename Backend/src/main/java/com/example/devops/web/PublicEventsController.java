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
            case "onsale" -> list = eventsRepo.findOnSaleViaView();
            default -> list = eventsRepo.findCurrentlyOnSale(Instant.now());
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
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "error", "EVENT_NOT_FOUND",
                        "message", "Event " + eventId + " not found"
                )));
    }

    /* ============================================================
       🔹 ผังที่นั่ง (public)
       ============================================================ */
    @GetMapping(value = "/{eventId}/tickets/setup", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPublicSeatSetup(@PathVariable("eventId") Long eventId) {
        var evOpt = eventsRepo.findById(eventId);
        if (evOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "EVENT_NOT_FOUND",
                    "message", "Event " + eventId + " not found"
            ));
        }

        Map<String, Object> setup = ticketSetupService.getSetup(eventId);
        if (setup == null) {
            // โครงเปล่าที่ FE รับมือได้
            return ResponseEntity.ok(Map.of(
                    "seatRows", 0,
                    "seatColumns", 0,
                    "zones", List.of(),
                    "minPerOrder", null,
                    "maxPerOrder", null,
                    "active", null,
                    "salesStartDatetime", null,
                    "salesEndDatetime", null
            ));
        }
        return ResponseEntity.ok(setup);
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
            Instant updatedAt,       // ใช้ reviewed_at แทน updated_at
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
                    e.getReviewed_at(),     // ✅ แก้จุดนี้
                    e.getCover_updated_at(),
                    coverUrl
            );
        }
    }
}
