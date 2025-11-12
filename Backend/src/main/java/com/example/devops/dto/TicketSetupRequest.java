package com.example.devops.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Payload จาก Organizer สำหรับตั้งค่าผังที่นั่ง/โซน/ราคา
 * รองรับ alias หลายแบบของ field ชื่อ seatRow/seatRows/rows และ seatColumn/seatColumns/cols/columns
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketSetupRequest {

    /** ค่ากลาง (ทั้งอีเวนต์) จำนวนแถว */
    @JsonAlias({"seatRow", "rows"})
    private Integer seatRows;

    /** ค่ากลาง (ทั้งอีเวนต์) จำนวนคอลัมน์ */
    @JsonAlias({"seatColumn", "cols", "columns"})
    private Integer seatColumns;

    /** รายการโซน */
    private List<ZoneDTO> zones;

    /** ค่ากลาง ticket types */
    private Integer minPerOrder;
    private Integer maxPerOrder;
    private Boolean active;

    /** sale window */
    @JsonAlias({"salesStartDatetime"})
    private Instant salesStartDateTime;

    @JsonAlias({"salesEndDatetime"})
    private Instant salesEndDateTime;

    // getters ชื่อเดิมที่ service เรียกใช้
    public Instant getSalesStartDatetime() { return salesStartDateTime; }
    public void setSalesStartDatetime(Instant v) { this.salesStartDateTime = v; }
    public Instant getSalesEndDatetime() { return salesEndDateTime; }
    public void setSalesEndDatetime(Instant v) { this.salesEndDateTime = v; }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ZoneDTO {
        /** zone_id (มี = update, ไม่มี = create) */
        private Long id;

        /** โค้ดโซน เช่น VIP / REGULAR / STANDING (เก็บใน description) */
        private String code;

        /** ชื่อแสดงผล เช่น Zone A */
        private String name;

        /** ราคา */
        private BigDecimal price;

        /** ลิงก์ไป ticket_type (ถ้ามี) */
        private Long ticketTypeId;

        /** standing mode (ไม่มีเก้าอี้) - ยังคงรองรับ alias hasSeats แบบเดิม */
        @JsonAlias({"hasSeats"})
        private Boolean standing;

        /** ลำดับแสดงผล */
        private Integer sortOrder;

        /** ขนาดต่อโซน (รองรับ alias ทุกแบบ) */
        @JsonAlias({"seatRow", "seatRows", "rows"})
        private Integer seatRows;

        @JsonAlias({"seatColumn", "seatColumns", "cols", "columns"})
        private Integer seatColumns;

        /** helper ให้ service เรียก */
        public Integer getRows() { return seatRows; }
        public Integer getCols() { return seatColumns; }
    }
}
