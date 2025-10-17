package com.example.devops.dto;

import com.example.devops.model.EventsNam;
import java.time.Instant;
import java.time.OffsetDateTime;

public class EventMapper {

    // === Entity -> DTO ===
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;

        // cover_updated_at ถ้ามี ใช้เป็น updatedAt ไม่งั้น fallback startDatetime
        Instant updatedAt = ev.getCover_updated_at() != null
                ? ev.getCover_updated_at()
                : ev.getStartDatetime();

        return EventResponse.builder()
                .id(ev.getId())
                .organizerId(ev.getOrganizerId())            // ✅ map organizerId
                // organizerName จะเติมใน Controller (bulk) เพื่อเลี่ยง N+1
                .eventName(nz(ev.getEventName()))
                .description(nz(ev.getDescription()))
                .categoryId(ev.getCategoryId())
                .startDateTime(ev.getStartDatetime())
                .endDateTime(ev.getEndDatetime())            // ✅ ชื่อเมธอดถูกต้อง
                .venueName(nz(ev.getVenueName()))
                .venueAddress(nz(ev.getVenueAddress()))
                .maxCapacity(ev.getMaxCapacity())
                .status(nz(ev.getStatus()))
                .updatedAt(updatedAt)
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
        target.setEndDatetime(req.getEndDateTime());         // ✅ ชื่อเมธอดถูกต้อง
        target.setVenueName(req.getVenueName());
        target.setVenueAddress(req.getVenueAddress());
        target.setMaxCapacity(req.getMaxCapacity());
        target.setStatus("PENDING");
        return target;
    }

    // === DTO(Update) -> Entity ===
    public static EventsNam applyUpdate(EventsNam target, EventUpdateRequest req) {
        if (target == null) return null;

        if (req.getEventName() != null)     target.setEventName(req.getEventName());
        if (req.getDescription() != null)   target.setDescription(req.getDescription());
        if (req.getCategoryId() != null)    target.setCategoryId(req.getCategoryId());
        if (req.getStartDateTime() != null) target.setStartDatetime(req.getStartDateTime());
        if (req.getEndDateTime() != null)   target.setEndDatetime(req.getEndDateTime()); // ✅
        if (req.getVenueName() != null)     target.setVenueName(req.getVenueName());
        if (req.getVenueAddress() != null)  target.setVenueAddress(req.getVenueAddress());
        if (req.getMaxCapacity() != null)   target.setMaxCapacity(req.getMaxCapacity());
        return target;
    }

    private static String nz(String s) { return s == null ? "" : s; }

    // (optional) parser สำหรับ string ISO-8601
    @SuppressWarnings("unused")
    private static Instant parseOffsetToInstant(String s) {
        try {
            if (s == null || s.isBlank()) return null;
            return OffsetDateTime.parse(s).toInstant();
        } catch (Exception e) {
            try { return Instant.parse(s); } catch (Exception ignore) { return null; }
        }
    }
}
