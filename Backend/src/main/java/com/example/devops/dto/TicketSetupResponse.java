package com.example.devops.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * ใช้ตอบกลับข้อมูล setup ที่นั่ง/โซน/ราคา/ช่วงขาย
 * ให้สอดคล้องกับ TicketController.java
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class TicketSetupResponse {

    /* ====== ข้อมูลผังที่นั่ง ====== */
    private Integer seatRows;        // ✅ ใช้ใน controller.seatRows()
    private Integer seatColumns;     // ✅ ใช้ใน controller.seatColumns()

    /* ====== รายการโซนและราคา ====== */
    private List<ZonePrice> zones;   // ✅ ใช้ใน controller.zones(...)

    /* ====== การสั่งซื้อ ====== */
    private Integer minPerOrder;     // ✅ ใช้ใน builder.minPerOrder()
    private Integer maxPerOrder;     // ✅ ใช้ใน builder.maxPerOrder()
    private Boolean active;          // ✅ ใช้ใน builder.active()

    /* ====== ช่วงเวลาขายบัตร ====== */
    private Instant salesStartDatetime;   // ✅ ใช้ใน builder.salesStartDatetime()
    private Instant salesEndDatetime;     // ✅ ใช้ใน builder.salesEndDatetime()

    /* ====== โครงสร้างภายใน: โซนแต่ละอัน ====== */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder(toBuilder = true)
    public static class ZonePrice {
        private String code;          // ✅ ใช้ใน controller.ZonePrice.builder().code(...)
        private String name;          // ✅ ใช้ใน controller.ZonePrice.builder().name(...)
        private BigDecimal price;     // ✅ ใช้ BigDecimal เสมอ
        private Integer rows;         // optional เผื่ออนาคต
        private Integer cols;         // optional เผื่ออนาคต
    }
}
