package com.example.devops.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
@Entity
@Table(name = "ticket_types")
public class TicketTypes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_type_id")
    private Long ticketTypeId;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "type_name")
    private String typeName;

    @Column(name = "description")
    private String description;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "quantity_available")
    private Integer quantityAvailable;

    @Column(name = "quantity_sold")
    private Integer quantitySold;

    @Column(name = "sale_start_datetime")
    private Instant saleStartDatetime;

    @Column(name = "sale_end_datetime")
    private Instant saleEndDatetime;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "min_per_order")
    private Integer minPerOrder;

    @Column(name = "max_per_order")
    private Integer maxPerOrder;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
