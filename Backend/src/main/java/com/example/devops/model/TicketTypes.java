package com.example.devops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ticket_types")
public class TicketTypes {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "ticket_type_id")
  private Long ticket_type_id;

  @Column(name = "event_id")
  private Long event_id;

  @Column(name = "type_name")
  private String type_name;

  @Column(name = "description")
  private String description;

  @Column(name = "price")
  private BigDecimal price;

  @Column(name = "quantity_available")
  private Integer quantity_available;

  @Column(name = "quantity_sold")
  private Integer quantity_sold;

  @Column(name = "sale_start_datetime")
  private Instant sale_start_datetime;

  @Column(name = "sale_end_datetime")
  private Instant sale_end_datetime;

  @Column(name = "is_active")
  private Boolean is_active;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "updated_at")
  private Instant updated_at;
}
