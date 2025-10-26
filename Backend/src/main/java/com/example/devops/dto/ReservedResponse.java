package com.example.devops.dto;

import com.example.devops.model.Reserved;
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
    private Long userId;
    private Long eventId;
    private Long ticketTypeId;
    private Integer quantity;
    private BigDecimal totalAmount;

    /* ====== Payment ====== */
    private String paymentStatus;      // UNPAID / PAID
    private Instant registrationDatetime;
    private Instant paymentDatetime;
    private String confirmationCode;
    private String paymentMethod;      // Credit Card / Bank Transfer / QR Payment
    private String notes;

    /* ====== Optional (สำหรับ future use / admin display) ====== */
    private String eventName;
    private String userEmail;
    private String userName;

    public static ReservedResponse from(Reserved r) {
        if (r == null) return null;

        return ReservedResponse.builder()
                .reservedId(r.getReservedId())
                .userId(r.getUserId())
                .eventId(r.getEventId())
                .ticketTypeId(r.getTicketTypeId())
                .quantity(r.getQuantity())
                .totalAmount(r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO)
                .paymentStatus(safeUpper(r.getPaymentStatus()))
                .registrationDatetime(r.getRegistrationDatetime())
                .paymentDatetime(r.getPaymentDatetime())
                .confirmationCode(r.getConfirmationCode())
                .paymentMethod(r.getPaymentMethod())
                .notes(r.getNotes())
                .build();
    }

    private static String safeUpper(String s) {
        return s == null ? null : s.toUpperCase();
    }
}
