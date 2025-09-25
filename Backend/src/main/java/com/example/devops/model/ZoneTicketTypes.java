package com.example.devops.model;

import jakarta.persistence.*;

@Entity
@Table(name = "zone_ticket_types")
public class ZoneTicketTypes {
  @EmbeddedId
  private ZoneTicketTypesId id;
  @Column(name = "zone_id")
  private Long zone_id;

  @Column(name = "ticket_type_id")
  private Long ticket_type_id;
}
