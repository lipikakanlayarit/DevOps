package com.example.devops.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO ที่ FE ส่งมาเวลาทำการจองที่นั่ง (สร้าง reservation)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationRequest {

    private Long eventId;
    private Integer quantity;
    private BigDecimal totalAmount;
    private List<SeatPick> seats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatPick {
        /** zone_id จริงจาก seat_zones */
        private Long zoneId;

        /** แถว (0-based, FE -> DB mapping: 0 → 'A') */
        private Integer row;

        /** คอลัมน์ (0-based, FE -> DB mapping: 0 → seat_number = 1) */
        private Integer col;
    }
}
