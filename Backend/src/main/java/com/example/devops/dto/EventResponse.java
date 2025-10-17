// EventResponse.java
package com.example.devops.dto;

import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventResponse {
    private Long id;
    private String eventName;
    private String description;
    private Long categoryId;
    private Instant startDateTime; // ส่งเป็น ISO-8601 อัตโนมัติ
    private Instant endDateTime;
    private String venueName;
    private String venueAddress;
    private Integer maxCapacity;
    private String status;
    private Instant updatedAt;
}
