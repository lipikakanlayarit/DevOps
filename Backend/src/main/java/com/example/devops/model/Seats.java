package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "seats")
public class Seats {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "seat_id")
  private Long seat_id;

  @Column(name = "row_id")
  private Long row_id;

  @Column(name = "seat_number")
  private Integer seat_number;

  @Column(name = "seat_label")
  private String seat_label;

  @Column(name = "is_active")
  private Boolean is_active;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "updated_at")
  private Instant updated_at;
}
