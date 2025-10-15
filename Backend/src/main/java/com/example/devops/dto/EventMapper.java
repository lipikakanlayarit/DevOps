package com.example.devops.dto;

import com.example.devops.model.EventsNam;
import java.time.Instant;
import java.time.OffsetDateTime;

public class EventMapper {

    // === Entity -> DTO ===
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;
        return EventResponse.builder()
                .id(ev.getId()) // <-- ใช้ id ตรงกับ DTO
                .eventName(nz(ev.getEventName()))
                .description(nz(ev.getDescription()))
                .categoryId(ev.getCategoryId())
                .startDateTime(ev.getStartDatetime())
                .endDateTime(ev.getEndDatetime())
                .venueName(nz(ev.getVenueName()))
                .venueAddress(nz(ev.getVenueAddress()))
                .maxCapacity(ev.getMaxCapacity())
                .status(nz(ev.getStatus()))
                .build();
    }

    // === DTO(Create) -> Entity ===
    public static EventsNam toEntity(EventsNam target, EventCreateRequest req, Long organizerId) {
        if (target == null) target = new EventsNam();
        target.setOrganizerId(organizerId);
        target.setEventName(req.getEventName());
        target.setDescription(req.getDescription());
        target.setCategoryId(req.getCategoryId());
        target.setStartDatetime(req.getStartDateTime());
        target.setEndDatetime(req.getEndDateTime());
        target.setVenueName(req.getVenueName());
        target.setVenueAddress(req.getVenueAddress());
        target.setMaxCapacity(req.getMaxCapacity());
        target.setStatus("DRAFT");
        return target;
    }

    // === DTO(Update) -> Entity ===
    public static EventsNam applyUpdate(EventsNam target, EventUpdateRequest req) {
        if (target == null) return null;

        if (req.getEventName() != null)    target.setEventName(req.getEventName());
        if (req.getDescription() != null)  target.setDescription(req.getDescription());
        if (req.getCategoryId() != null)   target.setCategoryId(req.getCategoryId());
        if (req.getStartDateTime() != null) target.setStartDatetime(req.getStartDateTime());
        if (req.getEndDateTime() != null)   target.setEndDatetime(req.getEndDateTime());
        if (req.getVenueName() != null)    target.setVenueName(req.getVenueName());
        if (req.getVenueAddress() != null) target.setVenueAddress(req.getVenueAddress());
        if (req.getMaxCapacity() != null)  target.setMaxCapacity(req.getMaxCapacity());
        // ✅ EventUpdateRequest ไม่มี status → ข้ามไป
        return target;
    }

    private static String nz(String s) { return s == null ? "" : s; }

    // (optional) เผื่อไว้ถ้ามี string ISO-8601
    private static Instant parseOffsetToInstant(String s) {
        try {
            if (s == null || s.isBlank()) return null;
            return OffsetDateTime.parse(s).toInstant();
        } catch (Exception e) {
            try { return Instant.parse(s); } catch (Exception ignore) { return null; }
        }
    }
}
