package com.example.devops.repo;

import com.example.devops.model.ZoneTicketTypes;
import com.example.devops.model.ZoneTicketTypesId;
import com.example.devops.model.TicketTypes;
import com.example.devops.model.SeatZones;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@Rollback
@ActiveProfiles("test")     // <<<<<< ตรงนี้คือของจริง!
class ZoneTicketTypesRepositoryIT {

    @Autowired
    private ZoneTicketTypesRepository repo;

    @Autowired
    private SeatZonesRepository seatZonesRepo;

    @Autowired
    private TicketTypesRepository ticketRepo;

    private Long zoneId;
    private Long typeA;
    private Long typeB;

    @BeforeEach
    void init() {

        // ---------- Add SeatZone ----------
        SeatZones z = new SeatZones();
        z.setEventId(100L);
        z.setZoneName("Zone A");
        z.setIsActive(true);
        z = seatZonesRepo.save(z);
        zoneId = z.getZoneId();

        // ---------- Ticket type A ----------
        TicketTypes t1 = new TicketTypes();
        t1.setEventId(100L);
        t1.setTypeName("A");
        t1.setPrice(new BigDecimal("500"));
        t1 = ticketRepo.save(t1);
        typeA = t1.getTicketTypeId();

        // ---------- Ticket type B ----------
        TicketTypes t2 = new TicketTypes();
        t2.setEventId(100L);
        t2.setTypeName("B");
        t2.setPrice(new BigDecimal("900"));
        t2 = ticketRepo.save(t2);
        typeB = t2.getTicketTypeId();

        // ---------- zone_ticket_types mapping ----------
        repo.save(new ZoneTicketTypes(new ZoneTicketTypesId(zoneId, typeA)));
        repo.save(new ZoneTicketTypes(new ZoneTicketTypesId(zoneId, typeB)));
    }

    @Test
    void testFindByEventId() {
        List<ZoneTicketTypes> list = repo.findByEventId(100L);

        assertThat(list).hasSize(2);

        assertThat(list)
                .extracting("id.ticket_type_id")
                .containsExactlyInAnyOrder(typeA, typeB);
    }

    @Test
    void testFindByZoneId() {
        List<ZoneTicketTypes> list = repo.findByZoneId(zoneId);
        assertThat(list).hasSize(2);
    }

    @Test
    void testFindTicketTypeIdsByZoneId() {
        List<Long> list = repo.findTicketTypeIdsByZoneId(zoneId);
        assertThat(list).containsExactly(typeA, typeB);
    }

    @Test
    void testDeleteByZoneId() {
        repo.deleteByZoneId(zoneId);
        assertThat(repo.findByZoneId(zoneId)).isEmpty();
    }

    @Test
    void testDeleteByEventId() {
        repo.deleteByEventId(100L);
        assertThat(repo.findByEventId(100L)).isEmpty();
    }
}
