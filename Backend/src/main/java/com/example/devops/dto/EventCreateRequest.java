// EventCreateRequest.java
package com.example.devops.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventCreateRequest {
    @NotBlank private String eventName;
    private String description;
    private Long categoryId;

    @NotNull private Instant startDateTime; // รับ ISO-8601 (มี offset) → map เป็น Instant
    @NotNull private Instant endDateTime;

    @NotBlank private String venueName;
    private String venueAddress;
    private Integer maxCapacity;
}
