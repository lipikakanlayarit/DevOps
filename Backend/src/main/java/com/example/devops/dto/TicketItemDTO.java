package com.example.devops.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Payload ที่ส่งให้ frontend: /api/auth/my-tickets */
public class TicketItemDTO {
    private Long reservedId;
    private Long eventId;
    private String eventName;
    private String venueName;
    private String coverImageUrl;
    private String startDatetime; // ISO string
    private Integer quantity;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String confirmationCode;
    private String ticketTypeName;
    private List<String> seats = new ArrayList<>();

    public TicketItemDTO() {}

    public TicketItemDTO(Long reservedId, Long eventId, String eventName, String venueName, String coverImageUrl,
                         String startDatetime, Integer quantity, BigDecimal totalAmount, String paymentStatus,
                         String confirmationCode, String ticketTypeName, List<String> seats) {
        this.reservedId = reservedId;
        this.eventId = eventId;
        this.eventName = eventName;
        this.venueName = venueName;
        this.coverImageUrl = coverImageUrl;
        this.startDatetime = startDatetime;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus;
        this.confirmationCode = confirmationCode;
        this.ticketTypeName = ticketTypeName;
        if (seats != null) this.seats = seats;
    }

    public Long getReservedId() { return reservedId; }
    public void setReservedId(Long reservedId) { this.reservedId = reservedId; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getStartDatetime() { return startDatetime; }
    public void setStartDatetime(String startDatetime) { this.startDatetime = startDatetime; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getConfirmationCode() { return confirmationCode; }
    public void setConfirmationCode(String confirmationCode) { this.confirmationCode = confirmationCode; }

    public String getTicketTypeName() { return ticketTypeName; }
    public void setTicketTypeName(String ticketTypeName) { this.ticketTypeName = ticketTypeName; }

    public List<String> getSeats() { return seats; }
    public void setSeats(List<String> seats) { this.seats = seats; }
}
