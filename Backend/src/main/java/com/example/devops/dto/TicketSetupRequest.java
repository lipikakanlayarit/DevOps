package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketSetupRequest {

    // จำนวนแถว (A..), จำนวนคอลัมน์ (1..)
    private int seatRows;     // ex. 8
    private int seatColumns;  // ex. 20

    // อนุญาตหลายโซน (รองรับปุ่ม “+ Add Zone”)
    private List<ZoneConfig> zones; // [{code:"VIP", name:"VIP", rowStart:1, rowEnd:2, price:5000}, ...]

    // (ออปชัน) รูปแบบเก่า: zone/price เดียว
    private String zone;
    private Double price;

    // ---- Advanced Setting (global) ----
    private Integer minPerOrder;   // Minimum ticket per order
    private Integer maxPerOrder;   // Maximum ticket per order
    private Boolean active;        // true = Available, false = Unavailable

    // ---- Sales Period (global) ----
    private Instant salesStartDatetime; // ใช้กับ ticket_types.sale_start_datetime
    private Instant salesEndDatetime;   // ใช้กับ ticket_types.sale_end_datetime

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class ZoneConfig {
        private String code;       // "VIP" | "STANDARD"
        private String name;       // แสดงผล
        private Integer rowStart;  // 1-indexed เช่น VIP ครอบคลุมแถว 1..2 (A..B)
        private Integer rowEnd;
        private Double price;
        private Long ticketTypeId; // ถ้ามีเชื่อม ticket_types เดิม
    }
}
