package com.example.devops.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@Entity
@Table(name = "reserved_seats")
public class ReservedSeats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reserved_seat_id")
    private Long reservedSeatId;

    @Column(name = "reserved_id", nullable = false)
    private Long reservedId;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;
}
