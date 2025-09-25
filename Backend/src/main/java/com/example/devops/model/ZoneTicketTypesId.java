package com.example.devops.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Embeddable
public class ZoneTicketTypesId implements Serializable {
  @Column(name = "zone_id")
  private Long zone_id;
  @Column(name = "ticket_type_id")
  private Long ticket_type_id;
}
