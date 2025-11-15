package com.example.devops.service;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.model.*;
import com.example.devops.repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TicketSetupServiceTest {

    SeatZonesRepository zoneRepo;
    SeatRowsRepository rowRepo;
    SeatsRepository seatsRepo;
    ZoneTicketTypesRepository zttRepo;
    TicketTypesRepository typesRepo;
    EventsNamRepository eventsRepo;
    JdbcTemplate jdbc;

    TicketSetupService service;

    @BeforeEach
    void setup() {
        zoneRepo = mock(SeatZonesRepository.class);
        rowRepo = mock(SeatRowsRepository.class);
        seatsRepo = mock(SeatsRepository.class);
        zttRepo = mock(ZoneTicketTypesRepository.class);
        typesRepo = mock(TicketTypesRepository.class);
        eventsRepo = mock(EventsNamRepository.class);
        jdbc = mock(JdbcTemplate.class);

        service = new TicketSetupService(
                zoneRepo, rowRepo, seatsRepo, zttRepo, typesRepo, eventsRepo, jdbc
        );
    }

    // ====================================================================================
    // getSetup() – happy path
    // ====================================================================================
    @Test
    void testGetSetup_normal() {

        SeatZones zone = new SeatZones();
        zone.setZoneId(1L);
        zone.setRowStart(1);
        zone.setRowEnd(3);
        zone.setZoneName("VIP");
        zone.setDescription("VIP");

        when(zoneRepo.findByEventIdOrderBySortOrderAsc(100L))
                .thenReturn(List.of(zone));

        Seats seat = new Seats();
        seat.setSeatId(10L);
        seat.setSeatNumber(1);
        when(seatsRepo.findAllSeatsByEventId(100L))
                .thenReturn(List.of(seat));

        when(seatsRepo.findOccupiedWithZoneRowColByEventId(100L))
                .thenReturn(List.of());
        when(seatsRepo.findPaidTakenSeatIdsByEvent(100L)).thenReturn(List.of());
        when(seatsRepo.findLockedSeatIdsByEvent(100L)).thenReturn(List.of());

        TicketTypes t = new TicketTypes();
        t.setPrice(BigDecimal.TEN);
        when(typesRepo.findByEventId(100L)).thenReturn(List.of(t));

        EventsNam ev = new EventsNam();
        setField(ev, "eventId", 100L);
        setField(ev, "salesStartDatetime", Instant.now());
        setField(ev, "salesEndDatetime", Instant.now());
        when(eventsRepo.findById(100L)).thenReturn(Optional.of(ev));

        Map<String, Object> result = service.getSetup(100L);

        assertThat(result).isNotNull();
        assertThat(result.get("seatRows")).isEqualTo(1);
        assertThat(result.get("seatColumns")).isEqualTo(3);
    }
    // ====================================================================================
    // getSeatGrid()
    // ====================================================================================
    @Test
    void testGetSeatGrid() {
        SeatZones z = new SeatZones();
        z.setZoneId(1L);
        z.setZoneName("Z1");
        z.setDescription("VIP");

        SeatRows r = new SeatRows();
        setField(r, "rowId", 11L);
        r.setZoneId(1L);
        r.setRowLabel("A");

        Seats s = new Seats();
        s.setSeatId(101L);
        s.setRowId(11L);
        s.setSeatLabel("A1");
        s.setSeatNumber(1);
        s.setIsActive(true);

        when(zoneRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(50L))
                .thenReturn(List.of(z));
        when(rowRepo.findAllRowsByEventId(50L)).thenReturn(List.of(r));
        when(seatsRepo.findAllSeatsByEventId(50L)).thenReturn(List.of(s));

        Map<String, Object> grid = service.getSeatGrid(50L);

        assertThat(grid.get("eventId")).isEqualTo(50L);
        assertThat((List<?>) grid.get("zones")).hasSize(1);
    }

    // ====================================================================================
    // setup() / update() – happy path ผ่าน persistSetup()
    // ====================================================================================
    @Test
    void testSetup_andUpdate() {
        EventsNam ev = new EventsNam();
        setField(ev, "eventId", 99L);
        when(eventsRepo.findById(99L)).thenReturn(Optional.of(ev));
        when(typesRepo.findByEventId(99L)).thenReturn(List.of());

        SeatZones zone = new SeatZones();
        zone.setZoneId(5L);
        zone.setRowStart(1);
        zone.setRowEnd(3);
        zone.setZoneName("VIP");
        zone.setDescription("VIP");

        when(zoneRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(99L))
                .thenReturn(List.of(zone));
        when(zoneRepo.save(any())).thenReturn(zone);

        TicketSetupRequest.ZoneDTO zd = new TicketSetupRequest.ZoneDTO();
        setField(zd, "rows", 1);
        setField(zd, "cols", 3);
        setField(zd, "price", BigDecimal.TEN);
        setField(zd, "code", "VIP");
        setField(zd, "name", "VIP");
        setField(zd, "id", 5L);

        TicketSetupRequest req = new TicketSetupRequest();
        setField(req, "zones", List.of(zd));

        Map<String, Object> result = service.setup(99L, req);
        assertThat(result.get("status")).isEqualTo("ok");

        Map<String, Object> result2 = service.update(99L, req);
        assertThat(result2.get("status")).isEqualTo("ok");
    }

    // ====================================================================================
    // generateSeatsForZone()
    // ====================================================================================
    @Test
    void testGenerateSeatsForZone() {
        SeatZones zone = new SeatZones();
        zone.setZoneId(7L);

        SeatRows savedRow = new SeatRows();
        setField(savedRow, "rowId", 200L);
        when(rowRepo.save(any())).thenReturn(savedRow);

        service.generateSeatsForZone(zone, 1, 2);

        verify(rowRepo, times(1)).save(any());
        verify(seatsRepo, times(2)).save(any());
    }

    // ====================================================================================
    // regenerateSeatsForZone() – FIX: ใช้ anyLong() แทน any()
    // ====================================================================================
    @Test
    void testRegenerateSeatsForZone() {
        SeatZones zone = new SeatZones();
        zone.setZoneId(10L);

        SeatRows savedRow = new SeatRows();
        setField(savedRow, "rowId", 999L);
        when(rowRepo.save(any())).thenReturn(savedRow);

        service.regenerateSeatsForZone(zone, 1, 1);

        // ต้นฉบับเรียก:
        // jdbc.update("DELETE FROM seats ...", zone.getZoneId());
        // jdbc.update("DELETE FROM seat_rows ...", zone.getZoneId());
        //
        // ใช้ anyLong() เพื่อไม่ให้ ambiguous กับ overload ที่รับ PreparedStatementSetter
        verify(jdbc, times(2)).update(anyString(), anyLong());

        verify(seatsRepo, atLeastOnce()).save(any());
    }

    // ====================================================================================
    // helper: ใช้ reflection set value ให้ model / dto ที่ไม่มี setter
    // ====================================================================================
    private static void setField(Object obj, String fieldName, Object value) {
        try {
            var f = obj.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(obj, value);
        } catch (Exception ignored) {}
    }
}
