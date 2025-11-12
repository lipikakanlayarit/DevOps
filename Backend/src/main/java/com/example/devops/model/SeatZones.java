package com.example.devops.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "seat_zones")
public class SeatZones {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    /** ถ้ามีคอลัมน์ zone_code ใน DB (มีในตารางที่คุณแสดง) เก็บไว้ด้วย */
    @Column(name = "zone_code")
    private String zoneCode;

    /** ชื่อโซน เช่น Zone A, VIP */
    @Column(name = "zone_name")
    private String zoneName;

    /** ใช้เป็น code/label ภายใน (เช่น VIP/REGULAR/STANDING) */
    @Column(name = "description")
    private String description;

    /** จำนวนแถวของโซน (Seat Row “ค่ากลาง”) -> seat_zones.row_start */
    @Column(name = "row_start")
    private Integer rowStart;

    /** จำนวนคอลัมน์ของโซน (Seat Column “ค่ากลาง”) -> seat_zones.row_end */
    @Column(name = "row_end")
    private Integer rowEnd;

    /** ราคาโซน (ถ้าเก็บที่ตารางนี้) -> seat_zones.price */
    @Column(name = "price")
    private BigDecimal price;

    /** ลำดับการแสดงผล */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** เปิดใช้งานโซนหรือไม่ */
    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
