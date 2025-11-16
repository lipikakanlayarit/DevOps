package com.example.devops.web;

import com.example.devops.model.Reserved;
import com.example.devops.model.ReservedSeats;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PaymentPublicControllerTest {

    private PaymentPublicController controller(
            ReservedRepository reservedRepo,
            ReservedSeatsRepository reservedSeatsRepo,
            SeatsRepository seatsRepo
    ) {
        return new PaymentPublicController(reservedRepo, reservedSeatsRepo, seatsRepo);
    }

    // -----------------------------------------------------------
    // Helper setter (ไม่มี reflection)
    // -----------------------------------------------------------
    private void setReservedId(Reserved r, Long id) {
        try {
            var f = Reserved.class.getDeclaredField("reservedId");
            f.setAccessible(true);
            f.set(r, id);
        } catch (Exception ignored) {}
    }

    // -----------------------------------------------------------
    // CREATE RESERVATION (success)
    // -----------------------------------------------------------
    @Test
    void testCreateReservation_success() {
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        ReservedSeatsRepository reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        SeatsRepository seatsRepo = mock(SeatsRepository.class);

        PaymentPublicController controller = controller(reservedRepo, reservedSeatsRepo, seatsRepo);

        Map<String, Object> body = new HashMap<>();
        body.put("eventId", 5L);
        body.put("quantity", 2);
        body.put("totalAmount", 500);
        body.put("notes", "hello");

        List<Map<String, Object>> seatsReq = new ArrayList<>();
        seatsReq.add(Map.of("zoneId", 1, "row", 0, "col", 0));
        seatsReq.add(Map.of("zoneId", 1, "row", 0, "col", 1));
        body.put("seats", seatsReq);

        when(seatsRepo.findSeatIdByZoneRowCol(1L, 0, 1)).thenReturn(100L);
        when(seatsRepo.findSeatIdByZoneRowCol(1L, 0, 2)).thenReturn(101L);

        when(reservedSeatsRepo.existsBySeatId(anyLong())).thenReturn(false);

        doAnswer(inv -> {
            Reserved r = inv.getArgument(0);
            setReservedId(r, 55L);
            return r;
        }).when(reservedRepo).save(any(Reserved.class));

        ResponseEntity<?> resp = controller.createReservation(body);

        assertThat(resp.getStatusCodeValue()).isEqualTo(200);
        Map<String, Object> result = cast(resp.getBody());
        assertThat(result.get("reservedId")).isEqualTo(55L);
        assertThat(result.get("paymentStatus")).isEqualTo("UNPAID");

        verify(reservedSeatsRepo, times(1)).saveAll(anyList());
    }

    // -----------------------------------------------------------
    // CREATE RESERVATION missing fields
    // -----------------------------------------------------------
    @Test
    void testCreateReservation_missingFields() {
        PaymentPublicController controller = controller(
                mock(ReservedRepository.class),
                mock(ReservedSeatsRepository.class),
                mock(SeatsRepository.class)
        );

        Map<String, Object> body = Map.of("eventId", 10L);

        ResponseEntity<?> resp = controller.createReservation(body);

        assertThat(resp.getStatusCodeValue()).isEqualTo(400);
        Map<String, Object> m = cast(resp.getBody());
        assertThat(m.get("error")).isEqualTo("Missing required fields");
    }

    // -----------------------------------------------------------
    // GET RESERVATION success
    // -----------------------------------------------------------
    @Test
    void testGetReservation_success() {
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        ReservedSeatsRepository reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        SeatsRepository seatsRepo = mock(SeatsRepository.class);

        PaymentPublicController controller = controller(reservedRepo, reservedSeatsRepo, seatsRepo);

        Reserved r = new Reserved();
        setReservedId(r, 10L);
        r.setEventId(77L);
        r.setQuantity(1);
        r.setTotalAmount(BigDecimal.TEN);
        r.setPaymentStatus("UNPAID");
        r.setRegistrationDatetime(Instant.now());

        when(reservedRepo.findById(10L)).thenReturn(Optional.of(r));

        ResponseEntity<?> resp = controller.getReservation(10L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(200);
        assertThat(resp.getBody()).isNotNull();
    }

    // -----------------------------------------------------------
    // GET RESERVATION not found
    // -----------------------------------------------------------
    @Test
    void testGetReservation_notFound() {
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        PaymentPublicController controller =
                controller(reservedRepo, mock(ReservedSeatsRepository.class), mock(SeatsRepository.class));

        when(reservedRepo.findById(99L)).thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.getReservation(99L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(404);
        Map<String, Object> m = cast(resp.getBody());
        assertThat(m.get("error")).isEqualTo("RESERVED_NOT_FOUND");
    }

    // -----------------------------------------------------------
    // PAY success
    // -----------------------------------------------------------
    @Test
    void testPay_success() {
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        ReservedSeatsRepository reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        SeatsRepository seatsRepo = mock(SeatsRepository.class);

        PaymentPublicController controller = controller(reservedRepo, reservedSeatsRepo, seatsRepo);

        Reserved r = new Reserved();
        setReservedId(r, 50L);
        r.setEventId(88L);
        r.setPaymentStatus("UNPAID");

        when(reservedRepo.findById(50L)).thenReturn(Optional.of(r));
        when(reservedRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> body = Map.of("method", "Credit Card");

        ResponseEntity<?> resp = controller.pay(50L, body);

        assertThat(resp.getStatusCodeValue()).isEqualTo(200);
        Map<String, Object> res = cast(resp.getBody());
        assertThat(res.get("status")).isEqualTo("PAID");
        assertThat(res.get("paymentMethod")).isEqualTo("Credit Card");
        assertThat(res.get("confirmationCode")).isNotNull();
    }

    // -----------------------------------------------------------
    // PAY - not found
    // -----------------------------------------------------------
    @Test
    void testPay_notFound() {
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        PaymentPublicController controller =
                controller(reservedRepo, mock(ReservedSeatsRepository.class), mock(SeatsRepository.class));

        when(reservedRepo.findById(77L)).thenReturn(Optional.empty());

        try {
            controller.pay(77L, Map.of());
        } catch (IllegalArgumentException e) {
            assertThat(e.getMessage()).isEqualTo("RESERVED_NOT_FOUND");
        }
    }

    // -----------------------------------------------------------
    // SEAT STATUS
    // -----------------------------------------------------------
    @Test
    void testSeatStatus() {
        ReservedSeatsRepository reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        when(reservedSeatsRepo.findSoldSeatIdsByEvent(44L))
                .thenReturn(List.of(10L, 20L));

        PaymentPublicController controller =
                controller(mock(ReservedRepository.class), reservedSeatsRepo, mock(SeatsRepository.class));

        ResponseEntity<?> resp = controller.getSeatStatus(44L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(200);

        Map<String, Object> m = cast(resp.getBody());
        assertThat(m.get("soldSeatIds")).isEqualTo(List.of(10L, 20L));
    }

    @SuppressWarnings("unchecked")
    private static <T> T cast(Object o) {
        return (T) o;
    }
}
