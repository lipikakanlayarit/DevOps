package com.example.devops.web;

import com.example.devops.dto.EventCardResponse;
import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.SeatsRepository;
import com.example.devops.service.TicketSetupService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PublicEventsControllerTest {

    // ---------------------------------------------------------
    // Helper for injecting ID without setters
    // ---------------------------------------------------------
    private void setId(EventsNam e, Long id) {
        try {
            var f = EventsNam.class.getDeclaredField("eventId");
            f.setAccessible(true);
            f.set(e, id);
        } catch (Exception ignored) {}
    }

    private PublicEventsController controller(
            EventsNamRepository eventsRepo,
            TicketSetupService ticketService,
            SeatsRepository seatsRepo
    ) {
        return new PublicEventsController(eventsRepo, ticketService, seatsRepo);
    }

    // =========================================================
    // GET /{eventId}
    // =========================================================
    @Test
    void testGetEventPublic_found() {
        EventsNamRepository repo = mock(EventsNamRepository.class);

        EventsNam e = new EventsNam();
        setId(e, 100L);
        e.setEventName("Mega Show");

        when(repo.findById(100L)).thenReturn(Optional.of(e));

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), mock(SeatsRepository.class));

        ResponseEntity<?> resp = ctrl.getEventPublic(100L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(200);
    }

    @Test
    void testGetEventPublic_notFound() {
        EventsNamRepository repo = mock(EventsNamRepository.class);
        when(repo.findById(99L)).thenReturn(Optional.empty());

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), mock(SeatsRepository.class));

        ResponseEntity<?> resp = ctrl.getEventPublic(99L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(404);
    }

    // =========================================================
    // GET seat map setup
    // =========================================================
    @Test
    void testGetPublicSeatSetup_noEvent() {
        EventsNamRepository repo = mock(EventsNamRepository.class);
        when(repo.findById(1L)).thenReturn(Optional.empty());

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), mock(SeatsRepository.class));

        ResponseEntity<?> resp = ctrl.getPublicSeatSetup(1L);
        assertThat(resp.getStatusCodeValue()).isEqualTo(404);
    }

    // =========================================================
    // seats/taken
    // =========================================================
    @Test
    void testSeatsTaken_notFound() {
        EventsNamRepository repo = mock(EventsNamRepository.class);
        when(repo.findById(300L)).thenReturn(Optional.empty());

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), mock(SeatsRepository.class));

        ResponseEntity<?> resp = ctrl.seatsTaken(300L);
        assertThat(resp.getStatusCodeValue()).isEqualTo(404);
    }

    @Test
    void testSeatsTaken_ok() {
        EventsNamRepository repo = mock(EventsNamRepository.class);
        SeatsRepository seats = mock(SeatsRepository.class);

        EventsNam e = new EventsNam();
        setId(e, 40L);
        when(repo.findById(40L)).thenReturn(Optional.of(e));

        when(seats.findPaidTakenSeatIdsByEvent(40L)).thenReturn(List.of(1L, 2L, 3L));
        when(seats.findLockedSeatIdsByEvent(40L)).thenReturn(List.of(9L));

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), seats);

        ResponseEntity<?> resp = ctrl.seatsTaken(40L);
        assertThat(resp.getStatusCodeValue()).isEqualTo(200);

        Map<String, Object> m = (Map<String, Object>) resp.getBody();
        assertThat(m.get("takenSeatIds")).isEqualTo(List.of(1L, 2L, 3L));
        assertThat(m.get("lockedSeatIds")).isEqualTo(List.of(9L));
    }

    // =========================================================
    // cover()
    // =========================================================
    @Test
    void testCover_notFound() {
        EventsNamRepository repo = mock(EventsNamRepository.class);
        when(repo.findById(10L)).thenReturn(Optional.empty());

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), mock(SeatsRepository.class));

        ResponseEntity<byte[]> resp = ctrl.cover(10L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(404);
    }

    @Test
    void testCover_success() {
        EventsNamRepository repo = mock(EventsNamRepository.class);

        EventsNam e = new EventsNam();
        setId(e, 55L);
        e.setCover_image("data".getBytes());
        e.setCover_image_type(MediaType.IMAGE_PNG_VALUE);
        e.setCover_updated_at(Instant.now());

        when(repo.findById(55L)).thenReturn(Optional.of(e));

        PublicEventsController ctrl = controller(repo, mock(TicketSetupService.class), mock(SeatsRepository.class));

        ResponseEntity<byte[]> resp = ctrl.cover(55L);

        assertThat(resp.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.OK);
        assertThat(resp.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(resp.getBody()).isEqualTo("data".getBytes());
    }
}
