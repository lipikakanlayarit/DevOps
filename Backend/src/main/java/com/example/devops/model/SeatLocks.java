package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "seat_locks")
public class SeatLocks {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "lock_id")
  private Long lock_id;

  @Column(name = "seat_id")
  private Long seat_id;

  @Column(name = "event_id")
  private Long event_id;

  @Column(name = "user_id")
  private Long user_id;

  @Column(name = "started_at")
  private Instant started_at;

  @Column(name = "expires_at")
  private Instant expires_at;

  @Column(name = "status")
  private String status;
}
