package com.example.devops.dto;

import com.example.devops.model.Reserved;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ReservedResponse {
    private Long reservedId;
    private Long userId;
    private Long eventId;
    private Long ticketTypeId;
    private Integer quantity;
    private BigDecimal totalAmount;
    private String paymentStatus;     // UNPAID / PAID
    private Instant registrationDatetime;
    private Instant paymentDatetime;
    private String confirmationCode;
    private String notes;

    public static ReservedResponse from(Reserved r) {
        return ReservedResponse.builder()
                .reservedId(r.getReserved_id())
                .userId(r.getUser_id())
                .eventId(r.getEvent_id())
                .ticketTypeId(r.getTicket_type_id())
                .quantity(r.getQuantity())
                .totalAmount(r.getTotal_amount())
                .paymentStatus(r.getPayment_status())
                .registrationDatetime(r.getRegistration_datetime())
                .paymentDatetime(r.getPayment_datetime())
                .confirmationCode(r.getConfirmation_code())
                .notes(r.getNotes())
                .build();
    }
}
