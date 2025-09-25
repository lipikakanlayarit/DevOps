package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "seat_rows")
public class SeatRows {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "row_id")
  private Long row_id;

  @Column(name = "zone_id")
  private Long zone_id;

  @Column(name = "row_label")
  private String row_label;

  @Column(name = "sort_order")
  private Integer sort_order;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "updated_at")
  private Instant updated_at;
}
