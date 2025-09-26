package com.example.devops.model;

import jakarta.persistence.*;

@Entity
@Table(name = "reserved_seats")
public class ReservedSeats {

    @EmbeddedId
    private ReservedSeatsId id;

    // ถ้าจะทำ relation mapping เพิ่มเติม:
    // @ManyToOne
    // @MapsId("reserved_id")
    // @JoinColumn(name = "reserved_id", insertable = false, updatable = false)
    // private Reserved reserved;

    // @ManyToOne
    // @MapsId("seat_id")
    // @JoinColumn(name = "seat_id", insertable = false, updatable = false)
    // private Seat seat;

    public ReservedSeatsId getId() {
        return id;
    }

    public void setId(ReservedSeatsId id) {
        this.id = id;
    }
}
