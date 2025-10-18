package com.example.devops.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "reserved")
public class Reserved {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reserved_id")
    private Long reserved_id;

    @Column(name = "user_id")
    private Long user_id;

    @Column(name = "event_id")
    private Long event_id;

    @Column(name = "ticket_type_id")
    private Long ticket_type_id;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "total_amount")
    private BigDecimal total_amount;

    @Column(name = "payment_status")
    private String payment_status; // UNPAID / PAID

    @Column(name = "registration_datetime")
    private Instant registration_datetime;

    @Column(name = "payment_datetime")
    private Instant payment_datetime;

    @Column(name = "confirmation_code")
    private String confirmation_code;

    @Column(name = "notes")
    private String notes;
}
