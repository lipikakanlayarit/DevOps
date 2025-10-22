package com.example.devops.dto;

import com.example.devops.model.EventsNam;
import java.time.Instant;
import java.time.OffsetDateTime;

public class EventMapper {

    // === Entity -> DTO ===
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;

        // ใช้ reviewed_at เป็นตัว bust cache ก่อน (เวลาอนุมัติรีวิว)
        // ถ้าไม่มี ใช้ cover_updated_at; ถ้าไม่มีอีก ใช้ startDatetime
        Instant updatedAt =
                ev.getReviewed_at() != null ? ev.getReviewed_at()
                        : (ev.getCover_updated_at() != null ? ev.getCover_updated_at()
                        : ev.getStartDatetime());

        // สำหรับ query string cache-busting ฝั่ง FE
        String ver = ev.getCover_updated_at() != null
                ? String.valueOf(ev.getCover_updated_at().toEpochMilli())
                : (updatedAt != null ? String.valueOf(updatedAt.toEpochMilli()) : null);

        String coverUrl = "/api/public/events/" + ev.getId() + "/cover" + (ver != null ? ("?v=" + ver) : "");

        return EventResponse.builder()
                .id(ev.getId())
                .organizerId(ev.getOrganizerId())
                // organizerName จะเติมใน controller ถ้าต้องการเลี่ยง N+1
                .eventName(nz(ev.getEventName()))
                .description(nz(ev.getDescription()))
                .categoryId(ev.getCategoryId())
                .startDateTime(ev.getStartDatetime())
                .endDateTime(ev.getEndDatetime())
                // 🆕 expose sales period
                .salesStartDateTime(ev.getSalesStartDatetime())
                .salesEndDateTime(ev.getSalesEndDatetime())
                .venueName(nz(ev.getVenueName()))
                .venueAddress(nz(ev.getVenueAddress()))
                .maxCapacity(ev.getMaxCapacity())
                .status(nz(ev.getStatus()))
                .updatedAt(updatedAt)
                // 🆕 ฟิลด์รูป
                .coverUpdatedAt(ev.getCover_updated_at())
                .coverUrl(coverUrl)
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
        // 🆕 allow set on create (ถ้าไม่ได้ส่งมาก็เป็น null)
        target.setSalesStartDatetime(req.getSalesStartDateTime());
        target.setSalesEndDatetime(req.getSalesEndDateTime());
        target.setVenueName(req.getVenueName());
        target.setVenueAddress(req.getVenueAddress());
        target.setMaxCapacity(req.getMaxCapacity());
        if (target.getStatus() == null) target.setStatus("PENDING");
        return target;
    }

    // === DTO(Update) -> Entity ===
    public static EventsNam applyUpdate(EventsNam target, EventUpdateRequest req) {
        if (target == null) return null;

        if (req.getEventName() != null)       target.setEventName(req.getEventName());
        if (req.getDescription() != null)     target.setDescription(req.getDescription());
        if (req.getCategoryId() != null)      target.setCategoryId(req.getCategoryId());
        if (req.getStartDateTime() != null)   target.setStartDatetime(req.getStartDateTime());
        if (req.getEndDateTime() != null)     target.setEndDatetime(req.getEndDateTime());
        // 🆕 support sales period update (ทั้งแบบ *DateTime และ *Datetime)
        Instant salesStart = req.getSalesStartDateTime() != null
                ? req.getSalesStartDateTime()
                : req.getSalesStartDatetime();
        Instant salesEnd = req.getSalesEndDateTime() != null
                ? req.getSalesEndDateTime()
                : req.getSalesEndDatetime();
        if (salesStart != null) target.setSalesStartDatetime(salesStart);
        if (salesEnd != null)   target.setSalesEndDatetime(salesEnd);

        if (req.getVenueName() != null)       target.setVenueName(req.getVenueName());
        if (req.getVenueAddress() != null)    target.setVenueAddress(req.getVenueAddress());
        if (req.getMaxCapacity() != null)     target.setMaxCapacity(req.getMaxCapacity());
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
