package com.example.devops.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
    @JsonAlias({"salesStartDatetime"})
    private Instant salesStartDateTime;

    @JsonAlias({"salesEndDatetime"})
    private Instant salesEndDateTime;

    /* ===== Alias getters/setters เพื่อรองรับชื่อแบบ "...Datetime" (t เล็ก) ที่โค้ดฝั่ง service เรียกใช้ ===== */
    public Instant getSalesStartDatetime() { return salesStartDateTime; }
    public void setSalesStartDatetime(Instant v) { this.salesStartDateTime = v; }
    public Instant getSalesEndDatetime() { return salesEndDateTime; }
    public void setSalesEndDatetime(Instant v) { this.salesEndDateTime = v; }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ZoneDTO {
        /** zone_id (ถ้ามีจะ update, ถ้าไม่มีจะสร้าง) */
        private Long id;

        /** เช่น "VIP" / "REGULAR" / "STANDING" (ใช้เป็น description/รหัสภายใน) */
        private String code;

        /** ชื่อโซน เช่น "Zone A" */
        private String name;

        /** ราคาในโซน (บาท) – จะ sync ไป ticket_types */
        private BigDecimal price;

        /** ถ้ามีจะ map โซน → ticket_types ตามนี้ */
        private Long ticketTypeId;

        /**
         * โหมดยืน/ไม่มีผังที่นั่ง (standing)
         * - เพื่อ backward-compat: รองรับรับค่าจาก hasSeats (เก่า) ด้วย โดย "hasSeats=true" => standing=true
         */
        @JsonAlias({"hasSeats"})
        private Boolean standing;

        /** ลำดับแสดงผล (optional) */
        private Integer sortOrder;

        /** (optional) กำหนดจำนวนแถว/คอลัมน์เฉพาะโซน (จะ override ค่ากลางถ้ามี) */
        private Integer seatRows;
        private Integer seatColumns;
    }
}
