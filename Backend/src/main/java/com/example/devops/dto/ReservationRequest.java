package com.example.devops.dto;

import java.math.BigDecimal;
import java.util.List;

/** ให้ตรงกับ payload จาก FE */
public class ReservationRequest {
    public Long eventId;
    public Integer quantity;
    public BigDecimal totalAmount;
    public List<SeatPick> seats;

    public static class SeatPick {
        public Long zoneId;   // seat_zones.zone_id (จริง)
        public Integer row;   // 0 -> 'A'
        public Integer col;   // 0 -> seat_number 1
    }
}
