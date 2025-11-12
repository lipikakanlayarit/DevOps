package com.example.devops.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.time.Instant;

/**
 * DTO สำหรับสร้างอีเวนต์ใหม่ (Organizer ใช้ตอน Create)
 * รองรับ Sales Period ด้วย (salesStartDateTime / salesEndDateTime)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventCreateRequest {

    @NotBlank
    private String eventName;

    private String description;

    private Long categoryId;

    @NotNull
    private Instant startDateTime; // ISO-8601 (มี offset)

    @NotNull
    private Instant endDateTime;

    // ✅ เพิ่มฟิลด์ Sales Period
    private Instant salesStartDateTime;

    private Instant salesEndDateTime;

    @NotBlank
    private String venueName;

    private String venueAddress;

    private Integer maxCapacity;
}
