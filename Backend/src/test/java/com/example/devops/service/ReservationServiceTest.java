package com.example.devops.service;

import com.example.devops.dto.ReservationRequest;
import com.example.devops.dto.ReservedResponse;
import com.example.devops.model.Reserved;
import com.example.devops.repo.*;
import org.junit.jupiter.api.*;
import org.mockito.Mockito;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReservationService_createReservationTest {

    ReservedRepository reservedRepo;
    ReservedSeatsRepository reservedSeatsRepo;
    SeatsRepository seatsRepo;
    PaymentsRepository paymentsRepo;
    JdbcTemplate jdbc;

    ReservationService service;

    @BeforeEach
    void setup() {
        reservedRepo = mock(ReservedRepository.class);
        reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        seatsRepo = mock(SeatsRepository.class);
        paymentsRepo = mock(PaymentsRepository.class);
        jdbc = mock(JdbcTemplate.class);

        service = Mockito.spy(new ReservationService(
                reservedRepo, reservedSeatsRepo, seatsRepo, paymentsRepo, jdbc
        ));
    }

    @Test
    @DisplayName("invalid payload → throw error")
    void invalidPayload() {
        ReservationRequest r = new ReservationRequest();
        assertThatThrownBy(() -> service.createReservation(null, r))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("duplicate seat in request → error")
    void duplicateSeat() {
        ReservationRequest.SeatPick sp = new ReservationRequest.SeatPick();
        sp.setZoneId(1L);
        sp.setRow(0);
        sp.setCol(0);

        ReservationRequest req = new ReservationRequest();
        req.setEventId(1L);
        req.setQuantity(2);
        req.setSeats(List.of(sp, sp));

        assertThatThrownBy(() -> service.createReservation(1L, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("seat not found → throw")
    void seatNotFound() {
        ReservationRequest.SeatPick sp = new ReservationRequest.SeatPick();
        sp.setZoneId(1L);
        sp.setRow(0);
        sp.setCol(0);

        when(seatsRepo.findSeatIdByZoneRowCol(anyLong(), anyInt(), anyInt())).thenReturn(null);
        when(seatsRepo.findSeatIdFlexible(anyLong(), any(), any(), anyInt())).thenReturn(null);

        ReservationRequest req = new ReservationRequest();
        req.setEventId(10L);
        req.setQuantity(1);
        req.setSeats(List.of(sp));

        assertThatThrownBy(() -> service.createReservation(1L, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("seat locked → throw")
    void seatLocked() {
        ReservationRequest.SeatPick sp = new ReservationRequest.SeatPick();
        sp.setZoneId(1L);
        sp.setRow(0);
        sp.setCol(0);

        when(seatsRepo.findSeatIdByZoneRowCol(anyLong(), anyInt(), anyInt())).thenReturn(100L);
        when(seatsRepo.findPaidTakenAmong(anyLong(), any())).thenReturn(List.of());
        when(seatsRepo.findLockedSeatIdsByEvent(1L)).thenReturn(List.of(100L));

        ReservationRequest req = new ReservationRequest();
        req.setEventId(1L);
        req.setQuantity(1);
        req.setSeats(List.of(sp));

        assertThatThrownBy(() -> service.createReservation(1L, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

}
