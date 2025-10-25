package com.example.devops.dto;

import com.example.devops.model.Reserved;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservedResponse {
    private Long reservedId;
    private Long userId;
    private Long eventId;
    private Long ticketTypeId;
    private Integer quantity;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private Instant registrationDatetime;
    private Instant paymentDatetime;
    private String confirmationCode;
    private String notes;

    public static ReservedResponse from(Reserved r) {
        return ReservedResponse.builder()
                .reservedId(r.getReservedId())
                .userId(r.getUserId())
                .eventId(r.getEventId())
                .ticketTypeId(r.getTicketTypeId())
                .quantity(r.getQuantity())
                .totalAmount(r.getTotalAmount())
                .paymentStatus(r.getPaymentStatus())
                .registrationDatetime(r.getRegistrationDatetime())
                .paymentDatetime(r.getPaymentDatetime())
                .confirmationCode(r.getConfirmationCode())
                .notes(r.getNotes())
                .build();
    }
}
