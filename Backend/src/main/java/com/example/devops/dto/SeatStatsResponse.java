// src/main/java/com/example/devops/dto/SeatStatsResponse.java
package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatStatsResponse {
    private long total;
    private long sold;
    private long reserved;
    private long available;
}
