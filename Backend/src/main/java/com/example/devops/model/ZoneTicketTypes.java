package com.example.devops.model;

import jakarta.persistence.*;

@Entity
@Table(name = "zone_ticket_types")
public class ZoneTicketTypes {

    @EmbeddedId
    private ZoneTicketTypesId id;

    // ถ้าอยาก map relation เพิ่ม ก็ทำแบบนี้
    // @ManyToOne
    // @MapsId("zone_id")
    // @JoinColumn(name = "zone_id", insertable = false, updatable = false)
    // private Zone zone;

    // @ManyToOne
    // @MapsId("ticket_type_id")
    // @JoinColumn(name = "ticket_type_id", insertable = false, updatable = false)
    // private TicketType ticketType;

    public ZoneTicketTypes() {}

    public ZoneTicketTypes(ZoneTicketTypesId id) {
        this.id = id;
    }

    public ZoneTicketTypesId getId() {
        return id;
    }

    public void setId(ZoneTicketTypesId id) {
        this.id = id;
    }
}
