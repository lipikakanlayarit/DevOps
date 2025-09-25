package com.example.devops.model;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ZoneTicketTypesId implements Serializable {

    private Long zone_id;
    private Long ticket_type_id;

    public ZoneTicketTypesId() {}

    public ZoneTicketTypesId(Long zone_id, Long ticket_type_id) {
        this.zone_id = zone_id;
        this.ticket_type_id = ticket_type_id;
    }

    public Long getZone_id() {
        return zone_id;
    }

    public void setZone_id(Long zone_id) {
        this.zone_id = zone_id;
    }

    public Long getTicket_type_id() {
        return ticket_type_id;
    }

    public void setTicket_type_id(Long ticket_type_id) {
        this.ticket_type_id = ticket_type_id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ZoneTicketTypesId)) return false;
        ZoneTicketTypesId that = (ZoneTicketTypesId) o;
        return Objects.equals(zone_id, that.zone_id) &&
               Objects.equals(ticket_type_id, that.ticket_type_id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(zone_id, ticket_type_id);
    }
}
