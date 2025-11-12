package com.example.devops.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "reserved")
public class Reserved {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reserved_id")
    private Long reservedId;

    @Column(name = "user_id")
    private Long userId; // อาจเป็น null ถ้าเป็น guest

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "ticket_type_id")
    private Long ticketTypeId;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "payment_status")
    private String paymentStatus; // UNPAID / PAID

    @Column(name = "registration_datetime")
    private Instant registrationDatetime;

    @Column(name = "payment_datetime")
    private Instant paymentDatetime;

    @Column(name = "confirmation_code")
    private String confirmationCode;

    @Column(name = "notes")
    private String notes;

    /** ✅ วิธีการชำระเงิน */
    @Column(name = "payment_method")
    private String paymentMethod; // Credit Card | Bank Transfer | QR Payment | null

    /** ✅ Guest fields */
    @Column(name = "guest_email")
    private String guestEmail;        // email ที่ใช้ตอนเป็น guest

    @Column(name = "guest_claimed_at")
    private Instant guestClaimedAt;   // เวลา claim เข้า user

    @Column(name = "created_as_guest")
    private Boolean createdAsGuest;   // true ถ้าสร้างตอนเป็น guest
}
