package com.example.devops.web;

import com.example.devops.dto.ReservationRequest;
import com.example.devops.dto.ReservedResponse;
import com.example.devops.model.User;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.UserRepository;
import com.example.devops.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PublicReservationsControllerTest {

    ReservationService reservationService;
    EventsNamRepository eventsRepo;
    UserRepository userRepo;

    PublicReservationsController controller;

    @BeforeEach
    void setup() {
        reservationService = mock(ReservationService.class);
        eventsRepo = mock(EventsNamRepository.class);
        userRepo = mock(UserRepository.class);

        controller = new PublicReservationsController(reservationService, eventsRepo, userRepo);
    }

    /* ======================================================
       createReservation()
       ====================================================== */

    @Test
    void testCreateReservation_nullBody() {
        ResponseEntity<?> resp = controller.createReservation(null, null, null);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testCreateReservation_eventNotFound() {
        ReservationRequest req = new ReservationRequest();
        req.setEventId(1L);
        req.setQuantity(1);

        when(eventsRepo.existsById(1L)).thenReturn(false);

        ResponseEntity<?> resp = controller.createReservation(req, null, null);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testCreateReservation_duplicateSeat() {
        ReservationRequest req = new ReservationRequest();
        req.setEventId(1L);
        req.setQuantity(2);

        req.setSeats(List.of(
                new ReservationRequest.SeatPick(10L, 0, 0),
                new ReservationRequest.SeatPick(10L, 0, 0) // duplicate
        ));

        when(eventsRepo.existsById(1L)).thenReturn(true);

        ResponseEntity<?> resp = controller.createReservation(req, null, null);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testCreateReservation_success_guest() {
        ReservationRequest req = new ReservationRequest();
        req.setEventId(1L);
        req.setQuantity(1);
        req.setGuestEmail("guest@test.com");
        req.setSeats(List.of(new ReservationRequest.SeatPick(10L, 0, 0)));

        when(eventsRepo.existsById(1L)).thenReturn(true);
        when(reservationService.createReservation(eq(null), eq(req)))
                .thenReturn(mock(ReservedResponse.class));

        ResponseEntity<?> resp = controller.createReservation(req, null, null);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    /* ======================================================
       getReservation()
       ====================================================== */
    @Test
    void testGetReservation_invalid() {
        ResponseEntity<?> resp = controller.getReservation(0L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testGetReservation_notFound() {
        when(reservationService.getReservation(55L))
                .thenThrow(new IllegalArgumentException("not found"));

        ResponseEntity<?> resp = controller.getReservation(55L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testGetReservation_success() {
        when(reservationService.getReservation(5L))
                .thenReturn(mock(ReservedResponse.class));

        ResponseEntity<?> resp = controller.getReservation(5L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    /* ======================================================
       pay()
       ====================================================== */
    @Test
    void testPay_invalid() {
        ResponseEntity<?> resp = controller.pay(0L, null);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testPay_notFound() {
        when(reservationService.payMock(eq(10L), any()))
                .thenThrow(new IllegalArgumentException("not found"));

        ResponseEntity<?> resp = controller.pay(10L, Map.of());
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testPay_success() {
        when(reservationService.payMock(eq(10L), any()))
                .thenReturn(mock(ReservedResponse.class));

        ResponseEntity<?> resp = controller.pay(10L, Map.of("method", "CARD"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    /* ======================================================
       resolveUserId() via JWT
       ====================================================== */

    @Test
    void testResolveUserId_jwt() throws Exception {
        PublicReservationsController spyCtl = Mockito.spy(controller);

        String payload = Base64.getUrlEncoder().encodeToString(
                "{\"userId\":123}".getBytes()
        );

        String jwt = "Bearer AAA." + payload + ".BBB";

        var m = PublicReservationsController.class
                .getDeclaredMethod("resolveUserId", Long.class, String.class);

        m.setAccessible(true);
        Long uid = (Long) m.invoke(spyCtl, null, jwt);

        assertThat(uid).isEqualTo(123L);
    }

    @Test
    void testResolveUserId_header() throws Exception {
        PublicReservationsController spyCtl = Mockito.spy(controller);

        var m = PublicReservationsController.class
                .getDeclaredMethod("resolveUserId", Long.class, String.class);

        m.setAccessible(true);
        Long uid = (Long) m.invoke(spyCtl, 77L, null);

        assertThat(uid).isEqualTo(77L);
    }
}
