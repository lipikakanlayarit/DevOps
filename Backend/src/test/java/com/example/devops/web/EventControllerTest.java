package com.example.devops.web;

import com.example.devops.dto.EventCreateRequest;
import com.example.devops.dto.EventResponse;
import com.example.devops.dto.EventUpdateRequest;
import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class EventControllerTest {

    EventsNamRepository eventsRepo;
    OrganizerRepo organizerRepo;
    EventController controller;

    Authentication auth;

    @BeforeEach
    void setup() {
        eventsRepo = mock(EventsNamRepository.class);
        organizerRepo = mock(OrganizerRepo.class);
        controller = new EventController(eventsRepo, organizerRepo);

        auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("tester");
    }

    // ======================================================================================
    // CREATE
    // ======================================================================================
    @Test
    void testCreate_Unauthorized() {
        ResponseEntity<?> r = controller.create(new EventCreateRequest(), null);
        assertThat(r.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void testCreate_OrganizerNotFound() {
        when(organizerRepo.findByUsernameIgnoreCase("tester"))
                .thenReturn(Optional.empty());
        when(organizerRepo.findByEmailIgnoreCase("tester"))
                .thenReturn(Optional.empty());

        ResponseEntity<?> r = controller.create(new EventCreateRequest(), auth);

        assertThat(r.getStatusCode().value()).isEqualTo(403);
    }

    @Test
    void testCreate_Success() {
        Organizer org = new Organizer();
        org.setId(1L);
        org.setUsername("tester");
        org.setEmail("t@t.com");
        org.setCompanyName("TestCo");

        when(organizerRepo.findByUsernameIgnoreCase("tester"))
                .thenReturn(Optional.of(org));

        EventCreateRequest req = new EventCreateRequest();
        set(req, "eventName", "MyEvent");

        EventsNam saved = new EventsNam();
        saved.setId(55L);
        saved.setEventName("MyEvent");
        saved.setOrganizerId(1L);

        when(eventsRepo.save(any())).thenReturn(saved);

        ResponseEntity<?> r = controller.create(req, auth);

        assertThat(r.getStatusCode().value()).isEqualTo(200);

        EventResponse dto = (EventResponse) r.getBody();
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(55L);
        assertThat(dto.getOrganizerId()).isEqualTo(1L);
    }

    // ======================================================================================
    // GET ONE
    // ======================================================================================
    @Test
    void testGetOne_NotFound() {
        when(eventsRepo.findById(1L)).thenReturn(Optional.empty());

        var r = controller.getOne(1L);

        assertThat(r.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void testGetOne_Success() {
        EventsNam ev = new EventsNam();
        ev.setId(5L);
        ev.setEventName("Hello");
        ev.setOrganizerId(2L);

        Organizer org = new Organizer();
        org.setId(2L);
        org.setUsername("owner");
        org.setEmail("own@x.com");

        when(eventsRepo.findById(5L)).thenReturn(Optional.of(ev));
        when(organizerRepo.findById(2L)).thenReturn(Optional.of(org));

        var r = controller.getOne(5L);

        assertThat(r.getStatusCode().value()).isEqualTo(200);

        EventResponse dto = (EventResponse) r.getBody();
        assertThat(dto.getOrganizerId()).isEqualTo(2L);
    }

    // ======================================================================================
    // UPDATE
    // ======================================================================================
    @Test
    void testUpdate_Unauthorized() {
        var r = controller.update(2L, new EventUpdateRequest(), null);
        assertThat(r.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void testUpdate_NotFound() {
        when(eventsRepo.findById(99L)).thenReturn(Optional.empty());

        var r = controller.update(99L, new EventUpdateRequest(), auth);
        assertThat(r.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void testUpdate_Success() {
        EventsNam ev = new EventsNam();
        ev.setId(10L);
        ev.setEventName("Old");

        when(eventsRepo.findById(10L)).thenReturn(Optional.of(ev));
        when(eventsRepo.save(any())).thenAnswer(a -> a.getArgument(0));

        EventUpdateRequest req = new EventUpdateRequest();
        set(req, "eventName", "New");

        var r = controller.update(10L, req, auth);
        assertThat(r.getStatusCode().value()).isEqualTo(200);

        EventResponse dto = (EventResponse) r.getBody();
        assertThat(dto.getEventName()).isEqualTo("New");
    }

    // ======================================================================================
    // UPLOAD COVER
    // ======================================================================================
    @Test
    void testUploadCover_Unauthorized() {
        MultipartFile f = mock(MultipartFile.class);
        var r = controller.uploadCover(1L, f, null);
        assertThat(r.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void testUploadCover_NotFound() {
        MultipartFile f = mock(MultipartFile.class);
        when(eventsRepo.findById(1L)).thenReturn(Optional.empty());

        var r = controller.uploadCover(1L, f, auth);
        assertThat(r.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void testUploadCover_InvalidFile() throws Exception {
        MultipartFile f = mock(MultipartFile.class);
        when(eventsRepo.findById(1L)).thenReturn(Optional.of(new EventsNam()));
        when(f.getContentType()).thenReturn("text/plain");

        var r = controller.uploadCover(1L, f, auth);
        assertThat(r.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void testUploadCover_Success() throws Exception {
        MultipartFile f = mock(MultipartFile.class);
        when(f.getContentType()).thenReturn("image/png");
        when(f.getSize()).thenReturn(500L);
        when(f.getBytes()).thenReturn(new byte[]{1,2,3});

        EventsNam ev = new EventsNam();
        ev.setId(1L);

        when(eventsRepo.findById(1L)).thenReturn(Optional.of(ev));
        when(eventsRepo.save(any())).thenAnswer(a -> a.getArgument(0));

        var r = controller.uploadCover(1L, f, auth);

        assertThat(r.getStatusCode().value()).isEqualTo(200);
    }

    // ======================================================================================
    // GET COVER
    // ======================================================================================
    @Test
    void testGetCover_NotFoundEvent() {
        when(eventsRepo.findById(1L)).thenReturn(Optional.empty());
        var r = controller.getCover(1L);
        assertThat(r.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void testGetCover_NoImage() {
        EventsNam ev = new EventsNam();
        when(eventsRepo.findById(1L)).thenReturn(Optional.of(ev));

        var r = controller.getCover(1L);
        assertThat(r.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void testGetCover_Success() {
        EventsNam ev = new EventsNam();
        ev.setCover_image(new byte[]{1,2,3});
        ev.setCover_image_type("image/png");

        when(eventsRepo.findById(1L)).thenReturn(Optional.of(ev));

        var r = controller.getCover(1L);
        assertThat(r.getStatusCode().value()).isEqualTo(200);
        assertThat(r.getBody()).containsExactly(1,2,3);
    }

    // ======================================================================================
    // DELETE COVER
    // ======================================================================================
    @Test
    void testDeleteCover_Unauthorized() {
        var r = controller.deleteCover(1L, null);
        assertThat(r.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void testDeleteCover_NotFound() {
        when(eventsRepo.findById(1L)).thenReturn(Optional.empty());
        var r = controller.deleteCover(1L, auth);
        assertThat(r.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void testDeleteCover_Success() {
        EventsNam ev = new EventsNam();
        when(eventsRepo.findById(1L)).thenReturn(Optional.of(ev));
        when(eventsRepo.save(any())).thenAnswer(a -> a.getArgument(0));

        var r = controller.deleteCover(1L, auth);
        assertThat(r.getStatusCode().value()).isEqualTo(200);
        assertThat(((Map<?, ?>) r.getBody()).get("status")).isEqualTo("deleted");
    }

    // ======================================================================================
    // Reflection setter helper
    // ======================================================================================
    private static void set(Object target, String field, Object value) {
        try {
            var f = target.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception ignored) {}
    }
}
