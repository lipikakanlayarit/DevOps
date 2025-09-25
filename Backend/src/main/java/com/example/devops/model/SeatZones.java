package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "seat_zones")
public class SeatZones {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "zone_id")
  private Long zone_id;

  @Column(name = "event_id")
  private Long event_id;

  @Column(name = "zone_name")
  private String zone_name;

  @Column(name = "description")
  private String description;

  @Column(name = "sort_order")
  private Integer sort_order;

  @Column(name = "is_active")
  private Boolean is_active;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "updated_at")
  private Instant updated_at;
}
