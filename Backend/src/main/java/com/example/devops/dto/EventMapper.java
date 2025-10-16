package com.example.devops.dto;

import com.example.devops.model.EventsNam;

public class EventMapper {

    // === Entity -> DTO ===
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;
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
                .build();
    }

    // === DTO(Create) -> Entity ===
    public static EventsNam toEntity(EventsNam target, EventCreateRequest req, Long organizerId) {
        if (target == null) target = new EventsNam();
        if (organizerId != null) target.setOrganizerId(organizerId);

        target.setEventName(req.getEventName());
        target.setDescription(req.getDescription());
        target.setCategoryId(req.getCategoryId());
        target.setStartDatetime(req.getStartDateTime());
        target.setEndDatetime(req.getEndDateTime());
        target.setVenueName(req.getVenueName());
        target.setVenueAddress(req.getVenueAddress());
        target.setMaxCapacity(req.getMaxCapacity());

        // default ตอนสร้าง
        if (target.getStatus() == null || target.getStatus().isBlank()) {
            target.setStatus("PENDING");
        }
        return target;
    }

    // === DTO(Update) -> Entity ===
    public static EventsNam applyUpdate(EventsNam target, EventUpdateRequest req) {
        if (target == null || req == null) return target;

        if (req.getEventName() != null)      target.setEventName(req.getEventName());
        if (req.getDescription() != null)    target.setDescription(req.getDescription());
        if (req.getCategoryId() != null)     target.setCategoryId(req.getCategoryId());
        if (req.getStartDateTime() != null)  target.setStartDatetime(req.getStartDateTime());
        if (req.getEndDateTime() != null)    target.setEndDatetime(req.getEndDateTime());
        if (req.getVenueName() != null)      target.setVenueName(req.getVenueName());
        if (req.getVenueAddress() != null)   target.setVenueAddress(req.getVenueAddress());
        if (req.getMaxCapacity() != null)    target.setMaxCapacity(req.getMaxCapacity());
        // ไม่เปิดให้แก้ status ตรงนี้
        return target;
    }

    private static String nz(String s) { return s == null ? "" : s; }
}
