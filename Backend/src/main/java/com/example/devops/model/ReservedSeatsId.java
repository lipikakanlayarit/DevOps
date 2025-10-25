package com.example.devops.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Embeddable
public class ReservedSeatsId implements Serializable {
    @Column(name = "reserved_id")
    private Long reserved_id;
    @Column(name = "seat_id")
    private Long seat_id;
}