package com.example.devops.dto;

import com.example.devops.model.EventsNam;

import java.time.Instant;
import java.time.OffsetDateTime;

public class EventMapper {

    // === Entity -> DTO ===
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;
        EventResponse dto = new EventResponse();
        dto.setId(ev.getEvent_id());
        dto.setEventName(nz(ev.getEvent_name()));
        dto.setDescription(nz(ev.getDescription()));
        dto.setCategoryId(ev.getCategory_id());

        // ถ้า EventResponse ใช้ Instant:
        dto.setStartDateTime(ev.getStart_datetime()); // Instant ใน entity -> ใส่ตรง ๆ
        dto.setEndDateTime(ev.getEnd_datetime());

        // ถ้า EventResponse ของคุณตั้งเป็น String ให้เปลี่ยนเป็น:
        // dto.setStartDateTime(ev.getStart_datetime() != null ? ev.getStart_datetime().toString() : null);
        // dto.setEndDateTime(ev.getEnd_datetime() != null ? ev.getEnd_datetime().toString() : null);

        dto.setVenueName(nz(ev.getVenue_name()));
        dto.setVenueAddress(nz(ev.getVenue_address()));
        dto.setMaxCapacity(ev.getMax_capacity());
        dto.setStatus(nz(ev.getStatus()));
        return dto;
    }

    // === DTO(Create) -> Entity ===
    public static EventsNam toEntity(EventsNam target, EventCreateRequest req, Long organizerId) {
        if (target == null) target = new EventsNam();
        target.setOrganizer_id(organizerId);
        target.setEvent_name(req.getEventName());
        target.setDescription(req.getDescription());
        target.setCategory_id(req.getCategoryId());

        // ถ้า EventCreateRequest ใช้ Instant อยู่แล้ว (แนะนำ):
        target.setStart_datetime(req.getStartDateTime());
        target.setEnd_datetime(req.getEndDateTime());

        // ถ้า EventCreateRequest ของคุณยังเป็น String แก้เป็น:
        // target.setStart_datetime(parseOffsetToInstant(req.getStartDateTime()));
        // target.setEnd_datetime(parseOffsetToInstant(req.getEndDateTime()));

        target.setVenue_name(req.getVenueName());
        target.setVenue_address(req.getVenueAddress());
        target.setMax_capacity(req.getMaxCapacity());
        if (target.getStatus() == null) target.setStatus("DRAFT");
        return target;
    }

    // === DTO(Update) -> Entity ===
    public static EventsNam applyUpdate(EventsNam target, EventUpdateRequest req) {
        if (target == null) return null;
        target.setEvent_name(req.getEventName());
        target.setDescription(req.getDescription());
        target.setCategory_id(req.getCategoryId());

        // ถ้า EventUpdateRequest ใช้ Instant:
        target.setStart_datetime(req.getStartDateTime());
        target.setEnd_datetime(req.getEndDateTime());

        // ถ้าเป็น String:
        // target.setStart_datetime(parseOffsetToInstant(req.getStartDateTime()));
        // target.setEnd_datetime(parseOffsetToInstant(req.getEndDateTime()));

        target.setVenue_name(req.getVenueName());
        target.setVenue_address(req.getVenueAddress());
        target.setMax_capacity(req.getMaxCapacity());
        return target;
    }

    // ===== helpers =====
    private static Instant parseOffsetToInstant(String s) {
        try {
            if (s == null || s.isBlank()) return null;
            // รองรับ "2025-10-30T19:00:00+07:00"
            return OffsetDateTime.parse(s).toInstant();
        } catch (Exception e) {
            // ถ้าพาร์สไม่ได้ ให้ลองสุดท้ายด้วย Instant.parse (รองรับสายที่เป็น Z)
            try {
                return Instant.parse(s);
            } catch (Exception ignore) {
                return null;
            }
        }
    }

    private static String nz(String s) { return s == null ? "" : s; }
}
