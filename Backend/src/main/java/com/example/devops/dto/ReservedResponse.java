package com.example.devops.dto;

import com.example.devops.model.Reserved;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO สำหรับตอบกลับข้อมูลใบจอง (ใช้ได้ทั้ง public / admin / payment page)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservedResponse {

    /* ====== Core Fields ====== */
    private Long reservedId;
    private Long userId;          // อาจเป็น null ถ้าเป็น guest
    private Long eventId;
    private Long ticketTypeId;    // อาจเป็น null

    private Integer quantity;

    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /* ====== Payment / Status ====== */
    /**
     * สถานะที่ระบบใช้งานจริง ณ ตอนนี้อาจมี: RESERVED, UNPAID, PAID, CANCELLED
     * (ขึ้นกับ service ของคุณ) — แนะนำให้ FE ใช้ค่าตามนี้โดยตรง
     */
    private String paymentStatus;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant registrationDatetime;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant paymentDatetime;

    private String confirmationCode;
    private String paymentMethod;  // Credit Card / Bank Transfer / QR Payment / MOCK / null
    private String notes;

    /* ====== Guest fields (for linking/claim) ====== */
    private String guestEmail;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant guestClaimedAt;
    private Boolean createdAsGuest;

    /* ====== Optional decorations (สำหรับแสดงผล) ====== */
    private String eventName;
    private String userEmail;
    private String userName;

    /* ====== Factory methods ====== */

    public static ReservedResponse from(Reserved r) {
        if (r == null) return null;

        return ReservedResponse.builder()
                .reservedId(r.getReservedId())
                .userId(r.getUserId())
                .eventId(r.getEventId())
                .ticketTypeId(r.getTicketTypeId())
                .quantity(r.getQuantity())
                .totalAmount(r.getTotalAmount() == null ? BigDecimal.ZERO : r.getTotalAmount())
                .paymentStatus(safeUpper(r.getPaymentStatus()))
                .registrationDatetime(r.getRegistrationDatetime())
                .paymentDatetime(r.getPaymentDatetime())
                .confirmationCode(r.getConfirmationCode())
                .paymentMethod(r.getPaymentMethod())
                .notes(r.getNotes())
                .guestEmail(r.getGuestEmail())
                .guestClaimedAt(r.getGuestClaimedAt())
                .createdAsGuest(r.getCreatedAsGuest())
                .build();
    }

    /** ใช้กรณีอยากแนบชื่ออีเวนต์/ผู้ใช้ที่ join มาแล้ว เพื่อลดรอบยิง API ฝั่ง FE */
    public static ReservedResponse from(Reserved r, String eventName, String userEmail, String userName) {
        ReservedResponse resp = from(r);
        if (resp != null) {
            resp.setEventName(eventName);
            resp.setUserEmail(userEmail);
            resp.setUserName(userName);
        }
        return resp;
    }

    private static String safeUpper(String s) {
        return (s == null) ? null : s.toUpperCase();
    }
}
