package com.example.devops.dto;

import lombok.*;

import java.time.Instant;

/**
 * DTO กลางสำหรับแสดง/ตอบกลับ Event (ใช้ทั้ง Admin และ Public)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {

    /* ====== Keys ====== */
    private Long id;
    private Long organizerId;

    /* ====== Basics ====== */
    private String eventName;
    private String description;
    private Long categoryId;
    private String categoryLabel; // optional

    /* ====== Times ====== */
    private Instant startDateTime;       // entity.startDatetime
    private Instant endDateTime;         // entity.endDatetime
    private Instant salesStartDateTime;  // entity.salesStartDatetime
    private Instant salesEndDateTime;    // entity.salesEndDatetime
    private Instant submittedDate;
    private Instant updatedAt;

    /* ====== Venue / Capacity ====== */
    private String venueName;
    private String venueAddress;
    private Integer maxCapacity;

    /* ====== Raw Status (DB) ====== */
    private String status; // PENDING / APPROVED / REJECTED / PUBLISHED / UPCOMING

    /* ====== Organizer Info (optional) ====== */
    private String organizerName;
    private String organizerEmail;
    private String organizerCompany;
    private String organizerPhone;
    private String organizerAddress;

    /* ====== Review Info (optional) ====== */
    private String review;
    private Instant reviewedAt;
    private String reviewedBy;

    /* ====== Cover ====== */
    private Instant coverUpdatedAt;
    private String coverUrl;

    /* ====== Derived (NEW) ====== */
    private String effectiveStatus; // ONSALE | OFFSALE | UPCOMING
    private boolean purchasable;    // true when ONSALE
}