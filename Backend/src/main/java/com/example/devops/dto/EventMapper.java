package com.example.devops.dto;

import com.example.devops.model.EventsNam;
import com.example.devops.service.EventStatusService;

import java.time.Instant;

public class EventMapper {

    // ใช้ instance ตรง ๆ เพื่อความง่าย
    private static final EventStatusService statusService = new EventStatusService();

    /* =========================
       Entity -> DTO
       ========================= */
    public static EventResponse toDto(EventsNam ev) {
        if (ev == null) return null;

        // เวลาอัปเดตล่าสุด: reviewed_at > cover_updated_at > startDatetime
        Instant updatedAt =
                ev.getReviewed_at() != null ? ev.getReviewed_at()
                        : (ev.getCover_updated_at() != null ? ev.getCover_updated_at()
                        : ev.getStartDatetime());

        // เวอร์ชันรูป (cache-busting)
        String ver = ev.getCover_updated_at() != null
                ? String.valueOf(ev.getCover_updated_at().toEpochMilli())
                : (updatedAt != null ? String.valueOf(updatedAt.toEpochMilli()) : null);

        // ✅ เปลี่ยนเป็น public route ให้ตรงกับ PublicEventsController
        String coverUrl = "/api/public/events/" + ev.getId() + "/cover" + (ver != null ? ("?v=" + ver) : "");

        // คำนวณสถานะขายที่มีผลจริง
        var eff = statusService.computeEffectiveStatus(
                ev.getStatus(),
                Instant.now(),
                ev.getSalesStartDatetime(),
                ev.getSalesEndDatetime()
        );
        boolean purchasable = statusService.isPurchasable(eff);

        return EventResponse.builder()
                .id(ev.getId())
                .organizerId(ev.getOrganizerId())

                .eventName(nz(ev.getEventName()))
                .description(nz(ev.getDescription()))
                .categoryId(ev.getCategoryId())

                .startDateTime(ev.getStartDatetime())
                .endDateTime(ev.getEndDatetime())
                .salesStartDateTime(ev.getSalesStartDatetime())
                .salesEndDateTime(ev.getSalesEndDatetime())

                .venueName(nz(ev.getVenueName()))
                .venueAddress(nz(ev.getVenueAddress()))
                .maxCapacity(ev.getMaxCapacity())

                .status(nz(ev.getStatus()))
                .updatedAt(updatedAt)

                .coverUpdatedAt(ev.getCover_updated_at())
                .coverUrl(coverUrl)

                .effectiveStatus(eff.name())
                .purchasable(purchasable)
                .build();
    }

    /* =========================
       DTO(Create) -> Entity
       ========================= */
    public static EventsNam toEntity(EventsNam target, EventCreateRequest req, Long organizerId) {
        if (target == null) target = new EventsNam();

        target.setOrganizerId(organizerId);
        target.setEventName(req.getEventName());
        target.setDescription(req.getDescription());
        target.setCategoryId(req.getCategoryId());

        target.setStartDatetime(req.getStartDateTime());
        target.setEndDatetime(req.getEndDateTime());
        target.setSalesStartDatetime(req.getSalesStartDateTime());
        target.setSalesEndDatetime(req.getSalesEndDateTime());

        target.setVenueName(req.getVenueName());
        target.setVenueAddress(req.getVenueAddress());
        target.setMaxCapacity(req.getMaxCapacity());

        if (target.getStatus() == null) target.setStatus("PENDING");
        return target;
    }

    /* =========================
       DTO(Update) -> Entity
       ========================= */
    public static EventsNam applyUpdate(EventsNam target, EventUpdateRequest req) {
        if (target == null) return null;

        if (req.getEventName() != null)       target.setEventName(req.getEventName());
        if (req.getDescription() != null)     target.setDescription(req.getDescription());
        if (req.getCategoryId() != null)      target.setCategoryId(req.getCategoryId());

        if (req.getStartDateTime() != null)   target.setStartDatetime(req.getStartDateTime());
        if (req.getEndDateTime() != null)     target.setEndDatetime(req.getEndDateTime());

        // ✅ ใช้เฉพาะ *Datetime (t เล็ก) ที่เรามีแน่ ๆ เพื่อกัน error "Cannot resolve method"
        Instant salesStart = req.getSalesStartDatetime();
        Instant salesEnd   = req.getSalesEndDatetime();
        if (salesStart != null) target.setSalesStartDatetime(salesStart);
        if (salesEnd   != null) target.setSalesEndDatetime(salesEnd);

        if (req.getVenueName() != null)       target.setVenueName(req.getVenueName());
        if (req.getVenueAddress() != null)    target.setVenueAddress(req.getVenueAddress());
        if (req.getMaxCapacity() != null)     target.setMaxCapacity(req.getMaxCapacity());

        return target;
    }

    private static String nz(String s) { return s == null ? "" : s; }
}
