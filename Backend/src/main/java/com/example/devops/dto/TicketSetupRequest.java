package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Payload ที่ FE ส่งมาเพื่อ setup/update ผังที่นั่งและรายละเอียดตั๋วของอีเวนต์
 * โครงสร้างให้สอดคล้องกับ keys ที่ getSetup() ส่งกลับ (seatRows, seatColumns, zones, ฯลฯ)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketSetupRequest {

    /** จำนวนแถว (ค่า default รวมๆ สำหรับสร้าง seat_rows/labels) */
    private Integer seatRows;

    /** จำนวนคอลัมน์ (ค่า default รวมๆ สำหรับสร้าง seats 1..N) */
    private Integer seatColumns;

    /** รายการโซนที่ต้องการกำหนดราคา / mapping ticket type (ถ้าไม่ได้ส่ง id จะสร้างโซนใหม่) */
    private List<ZoneDTO> zones;

    /** ค่ากลางสำหรับประเภทตั๋ว (จะ apply ให้ ticket_types ทั้งอีเวนต์) */
    private Integer minPerOrder;           // min ต่อคำสั่งซื้อ
    private Integer maxPerOrder;           // max ต่อคำสั่งซื้อ
    private Boolean active;                // สถานะเปิดขาย/ปิดขาย

    /** sales window (ค่ากลาง) – จะอัปเดตทั้ง ticket_types และซ้ำลง events_nam */
    private Instant salesStartDatetime;
    private Instant salesEndDatetime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ZoneDTO {
        private Long id;               // zone_id (ถ้ามีจะ update, ถ้าไม่มีจะสร้าง)
        private String code;           // เช่น "VIP" / "REGULAR" / "STANDING" (ใช้เป็น description)
        private String name;           // ชื่อโซน เช่น "Zone A"
        private Integer price;         // ราคาในโซน (int บาท) – จะ sync ไป ticket_types
        private Long ticketTypeId;     // ถ้ามีจะ map โซน→ticket_types ตามนี้

        /** ถ้า false/ไม่ได้ส่ง และ code != STANDING -> จะสร้าง seat rows/columns ให้ตามค่ากลาง */
        private Boolean hasSeats;      // true = ไม่มีที่นั่งแบบ fixed (standing)
        private Integer sortOrder;     // ลำดับแสดงผล (optional)
    }
}
