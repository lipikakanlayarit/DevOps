// src/main/java/com/example/devops/dto/EventMapper.java
package com.example.devops.dto;

import com.example.devops.model.EventsNam;
import java.time.Instant;
import java.time.OffsetDateTime;

public class EventMapper {

    // === Entity -> DTO ===
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;

        // ใช้ cover_updated_at เป็น updatedAt ถ้ามี ไม่งั้น fallback เป็น startDatetime
        Instant updatedAt = ev.getCover_updated_at() != null
                ? ev.getCover_updated_at()
                : ev.getStartDatetime();

        return EventResponse.builder()
                .id(ev.getId())
                .eventName(nz(ev.getEventName()))
                .description(nz(ev.getDescription()))
                .categoryId(ev.getCategoryId())
                .startDateTime(ev.getStartDatetime())
                .endDateTime(ev.getEndDatetime())
                .venueName(nz(ev.getVenueName()))
                .venueAddress(nz(ev.getVenueAddress()))
                .maxCapacity(ev.getMaxCapacity())
                .status(nz(ev.getStatus()))
                .updatedAt(updatedAt)    // ✅ เพิ่มตรงนี้
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
        // ค่าเริ่มต้น: PENDING
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
        if (req.getEndDateTime() != null)   target.setEndDatetime(req.getEndDateTime());
        if (req.getVenueName() != null)     target.setVenueName(req.getVenueName());
        if (req.getVenueAddress() != null)  target.setVenueAddress(req.getVenueAddress());
        if (req.getMaxCapacity() != null)   target.setMaxCapacity(req.getMaxCapacity());
        // ไม่ให้แก้ status ผ่าน Update request นี้
        return target;
    }

    private static String nz(String s) { return s == null ? "" : s; }

    // (optional) เผื่อไว้ถ้ามี string ISO-8601
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
