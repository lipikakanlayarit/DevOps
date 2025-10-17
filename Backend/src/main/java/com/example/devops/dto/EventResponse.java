package com.example.devops.dto;

import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventResponse {
    private Long id;

    // === Organizer info ===
    private Long organizerId;
    private String organizerName;

    // === Event details ===
    private String eventName;
    private String description;
    private Long categoryId;
    private Instant startDateTime;   // ISO-8601
    private Instant endDateTime;
    private String venueName;
    private String venueAddress;
    private Integer maxCapacity;
    private String status;

    // ใช้สำหรับ sort/แสดง "submitted"
    private Instant updatedAt;
}
