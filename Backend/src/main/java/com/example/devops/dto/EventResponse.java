package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * DTO กลางสำหรับแสดง/ตอบกลับ Event (ใช้ทั้ง Admin และ Public)
 * - ใช้ Lombok @Builder เพื่อรองรับการเรียกแบบ builder ใน EventMapper
 * - ใส่ฟิลด์ salesStartDateTime/salesEndDateTime เผื่อแมปในอนาคต (จะมีเมธอดบน builder ให้พร้อม)
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
    private Long categoryId;          // ให้ตรงกับ entity: Long
    private String categoryLabel;     // ถ้ามีการแปลง label ใน layer อื่น

    /* ====== Times ====== */
    private Instant startDateTime;    // entity.startDatetime
    private Instant endDateTime;      // entity.endDatetime
    private Instant salesStartDateTime; // entity.salesStartDatetime (สำรอง เผื่อใช้)
    private Instant salesEndDateTime;   // entity.salesEndDatetime (สำรอง เผื่อใช้)
    private Instant submittedDate;    // ถ้าไม่ได้ใช้ ปล่อย null ได้
    private Instant updatedAt;        // ใช้จาก cover_updated_at หรืออื่นๆ ตาม mapper

    /* ====== Venue / Capacity ====== */
    private String venueName;
    private String venueAddress;
    private Integer maxCapacity;

    /* ====== Status ====== */
    private String status;            // PENDING / APPROVED / REJECTED / PUBLISHED

    /* ====== Organizer (หน้า Admin อาจใช้) ====== */
    private String organizerName;
    private String organizerEmail;
    private String organizerCompany;
    private String organizerPhone;
    private String organizerAddress;

    /* ====== Review (หน้า Admin อาจใช้) ====== */
    private String review;
    private Instant reviewedAt;
    private String reviewedBy;
}
