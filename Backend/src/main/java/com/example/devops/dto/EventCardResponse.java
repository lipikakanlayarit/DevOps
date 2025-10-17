package com.example.devops.dto;

import com.example.devops.model.EventsNam;

import java.time.Instant;

public class EventCardResponse {
    private Long id;
    private String eventName;
    private Long categoryId;
    private Instant salesStartDatetime;
    private Instant salesEndDatetime;
    private String coverUrl;
    private String venueName;

    public static EventCardResponse from(EventsNam e) {
        EventCardResponse r = new EventCardResponse();
        r.id = e.getId();
        r.eventName = e.getEventName();
        r.categoryId = e.getCategoryId();
        r.salesStartDatetime = e.getSalesStartDatetime(); // อาจเป็น null ถ้าใช้จาก VIEW ที่อิง ticket_types
        r.salesEndDatetime   = e.getSalesEndDatetime();
        r.venueName = e.getVenueName();

        String ver = (e.getCover_updated_at() != null)
                ? String.valueOf(e.getCover_updated_at().toEpochMilli())
                : null;
        r.coverUrl = "/api/public/events/" + e.getId() + "/cover" + (ver != null ? ("?v=" + ver) : "");
        return r;
    }

    public Long getId() { return id; }
    public String getEventName() { return eventName; }
    public Long getCategoryId() { return categoryId; }
    public Instant getSalesStartDatetime() { return salesStartDatetime; }
    public Instant getSalesEndDatetime() { return salesEndDatetime; }
    public String getCoverUrl() { return coverUrl; }
    public String getVenueName() { return venueName; }

    /* เซ็ตเตอร์ไม่จำเป็นสำหรับ response; ถ้าต้องการ เพิ่มได้ */
}
