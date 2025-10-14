package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private List<ZoneConfig> zones; // ex. [{code:"VIP", name:"VIP", rowStart:1, rowEnd:2, price:5000}, ...]

    // (ออปชัน) ถ้าฟอร์มส่ง zone/price เดี่ยวๆ ก็ใส่ไว้เผื่อ
    private String zone;
    private Double price;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class ZoneConfig {
        private String code;      // "VIP" | "STANDARD"
        private String name;      // แสดงผล
        private Integer rowStart; // 1-indexed เช่น VIP ครอบคลุมแถว 1..2 (A..B)
        private Integer rowEnd;
        private Double price;
        private Long ticketTypeId; // ถ้ามีเชื่อม TicketTypes
    }
}
