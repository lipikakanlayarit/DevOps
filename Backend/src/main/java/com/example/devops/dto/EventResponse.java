package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String eventName;
    private String description;
    private Long categoryId;
    private Instant startDateTime;
    private Instant endDateTime;
    private String venueName;
    private String venueAddress;
    private Integer maxCapacity;
    private String status;
}
