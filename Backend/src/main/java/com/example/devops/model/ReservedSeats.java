package com.example.devops.model;

import jakarta.persistence.*;

@Entity
@Table(name = "reserved_seats")
public class ReservedSeats {
  @EmbeddedId
  private ReservedSeatsId id;
  @Column(name = "reserved_id")
  private Long reserved_id;

  @Column(name = "seat_id")
  private Long seat_id;
}
