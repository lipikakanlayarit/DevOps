package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * DTO กลางสำหรับแสดง/ตอบกลับ Event (ใช้ทั้ง Admin และ Public)
 * -------------------------------------------------------------
 * - รองรับ builder (จาก EventMapper)
 * - ใช้ได้กับหน้า: Admin Permission, Organizer Dashboard, Landing Page
 * - มีฟิลด์รูป (coverUrl, coverUpdatedAt) เพื่อให้ FE แสดงภาพได้ตรงๆ
 * -------------------------------------------------------------
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
    private String categoryLabel; // optional – ใช้เวลา join category table

    /* ====== Times ====== */
    private Instant startDateTime;       // event.startDatetime
    private Instant endDateTime;         // event.endDatetime
    private Instant salesStartDateTime;  // event.salesStartDatetime
    private Instant salesEndDateTime;    // event.salesEndDatetime
    private Instant submittedDate;       // optional
    private Instant updatedAt;           // ใช้จาก cover_updated_at / reviewed_at / startDatetime

    /* ====== Venue / Capacity ====== */
    private String venueName;
    private String venueAddress;
    private Integer maxCapacity;

    /* ====== Status ====== */
    private String status; // PENDING / APPROVED / REJECTED / PUBLISHED

    /* ====== Organizer Info (หน้า Admin ใช้) ====== */
    private String organizerName;
    private String organizerEmail;
    private String organizerCompany;
    private String organizerPhone;
    private String organizerAddress;

    /* ====== Review Info (หน้า Admin ใช้) ====== */
    private String review;
    private Instant reviewedAt;
    private String reviewedBy;

    /* ====== 🖼️ Cover Image Info (ใหม่) ====== */
    private Instant coverUpdatedAt;   // ใช้ bust cache
    private String coverUrl;          // เช่น "/api/public/events/1/cover?v=1690000000000"
}
