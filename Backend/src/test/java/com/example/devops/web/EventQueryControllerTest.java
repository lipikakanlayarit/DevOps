package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class EventQueryControllerTest {

    private EventsNamRepository eventsNamRepository;
    private OrganizerRepo organizerRepo;
    private EventQueryController controller;
    private Authentication auth;

    @BeforeEach
    void setup() {
        eventsNamRepository = mock(EventsNamRepository.class);
        organizerRepo = mock(OrganizerRepo.class);
        controller = new EventQueryController(eventsNamRepository, organizerRepo);

        auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("user@example.com");
    }

    // =====================================================================
    // 1) Unauthorized
    // =====================================================================
    @Test
    void testGetMyEvents_unauthorized_whenAuthNull() {
        ResponseEntity<?> resp = controller.getMyEvents(null, null, null);

        assertThat(resp.getStatusCode().value()).isEqualTo(401);

        Map<String,Object> body = cast(resp.getBody());
        assertThat(body).containsEntry("error", "unauthorized");
    }

    @Test
    void testGetMyEvents_unauthorized_whenNameBlank() {
        Authentication badAuth = mock(Authentication.class);
        when(badAuth.getName()).thenReturn("  ");

        ResponseEntity<?> resp = controller.getMyEvents(badAuth, null, null);

        assertThat(resp.getStatusCode().value()).isEqualTo(401);

        Map<String,Object> body = cast(resp.getBody());
        assertThat(body).containsEntry("error", "unauthorized");
    }

    // =====================================================================
    // 2) Organizer not found -> empty list
    // =====================================================================
    @Test
    void testGetMyEvents_organizerNotFound_returnsEmptyList() {
        when(organizerRepo.findIdByEmailOrUsernameIgnoreCase("user@example.com"))
                .thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.getMyEvents(auth, null, null);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);

        List<?> body = (List<?>) resp.getBody();
        assertThat(body).isEmpty();
    }

    // =====================================================================
    // 3) No filters
    // =====================================================================
    @Test
    void testGetMyEvents_noFilters() {
        when(organizerRepo.findIdByEmailOrUsernameIgnoreCase("user@example.com"))
                .thenReturn(Optional.of(10L));

        EventsNam e1 = new EventsNam();
        e1.setId(1L);
        e1.setOrganizerId(10L);
        e1.setEventName("My Concert");
        e1.setStatus("APPROVED");
        e1.setVenueName("Hall A");
        e1.setStartDatetime(Instant.now());
        e1.setEndDatetime(Instant.now());
        e1.setSalesStartDatetime(Instant.now());
        e1.setSalesEndDatetime(Instant.now());
        e1.setCover_updated_at(Instant.now());

        EventsNam e2 = new EventsNam();
        e2.setId(2L);
        e2.setOrganizerId(10L);
        e2.setEventName("Another Show");
        e2.setStatus("PENDING");
        e2.setVenueName("Hall B");

        when(eventsNamRepository.findByOrganizerIdOrderByIdDesc(10L))
                .thenReturn(List.of(e1, e2));

        ResponseEntity<?> resp = controller.getMyEvents(auth, null, null);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);

        List<Map<String, Object>> body = cast(resp.getBody());
        assertThat(body).hasSize(2);

        assertThat(body.get(0)).containsEntry("id", 1L);
        assertThat(body.get(0)).containsEntry("eventName", "My Concert");
        assertThat(body.get(0)).containsKey("updatedAt");
    }

    // =====================================================================
    // 4) Filter by status
    // =====================================================================
    @Test
    void testGetMyEvents_filterByStatus() {
        when(organizerRepo.findIdByEmailOrUsernameIgnoreCase("user@example.com"))
                .thenReturn(Optional.of(10L));

        EventsNam e1 = new EventsNam();
        e1.setId(1L);
        e1.setOrganizerId(10L);
        e1.setEventName("Approved A");
        e1.setStatus("APPROVED");

        EventsNam e2 = new EventsNam();
        e2.setId(2L);
        e2.setOrganizerId(10L);
        e2.setEventName("Pending A");
        e2.setStatus("PENDING");

        when(eventsNamRepository.findByOrganizerIdOrderByIdDesc(10L))
                .thenReturn(List.of(e1, e2));

        ResponseEntity<?> resp = controller.getMyEvents(auth, "APPROVED", null);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);

        List<Map<String,Object>> body = cast(resp.getBody());
        assertThat(body).hasSize(1);
        assertThat(body.get(0)).containsEntry("status", "APPROVED");
    }

    // =====================================================================
    // 5) Filter by keyword
    // =====================================================================
    @Test
    void testGetMyEvents_filterByKeyword() {
        when(organizerRepo.findIdByEmailOrUsernameIgnoreCase("user@example.com"))
                .thenReturn(Optional.of(10L));

        EventsNam e1 = new EventsNam();
        e1.setId(1L);
        e1.setOrganizerId(10L);
        e1.setEventName("Summer Fest");
        e1.setStatus("APPROVED");

        EventsNam e2 = new EventsNam();
        e2.setId(2L);
        e2.setOrganizerId(10L);
        e2.setEventName("Winter Gala");
        e2.setStatus("APPROVED");

        when(eventsNamRepository.findByOrganizerIdOrderByIdDesc(10L))
                .thenReturn(List.of(e1, e2));

        ResponseEntity<?> resp = controller.getMyEvents(auth, null, "summer");

        assertThat(resp.getStatusCode().value()).isEqualTo(200);

        List<Map<String,Object>> body = cast(resp.getBody());
        assertThat(body).hasSize(1);
        assertThat(body.get(0)).containsEntry("eventName", "Summer Fest");
    }

    // =====================================================================
    // Helper: safe cast
    // =====================================================================
    @SuppressWarnings("unchecked")
    private <T> T cast(Object o) {
        return (T) o;
    }
}
