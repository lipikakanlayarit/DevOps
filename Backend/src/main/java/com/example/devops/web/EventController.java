package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventsNamRepository eventsRepository;
    private final OrganizerRepo organizerRepo;

    public EventController(EventsNamRepository eventsRepository, OrganizerRepo organizerRepo) {
        this.eventsRepository = eventsRepository;
        this.organizerRepo = organizerRepo;
    }

    public static class CreateEventRequest {
        @NotBlank
        public String eventName;
        public String description;
        public Long categoryId; // optional
        @NotBlank
        public String startDateTime; // ISO-8601
        @NotBlank
        public String endDateTime;   // ISO-8601
        @NotBlank
        public String venueName;
        public String venueAddress;
        public Integer maxCapacity; // optional
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateEventRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = auth.getName();
        Optional<Organizer> organizerOpt = organizerRepo.findByUsernameIgnoreCase(username)
                .or(() -> organizerRepo.findByEmailIgnoreCase(username));

        if (organizerOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "Organizer not found or unauthorized"));
        }

        Instant start;
        Instant end;
        try {
            start = Instant.parse(req.startDateTime);
            end = Instant.parse(req.endDateTime);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid date time format; use ISO-8601"));
        }

        Organizer organizer = organizerOpt.get();

        EventsNam ev = new EventsNam();
        ev.setOrganizer_id(organizer.getId());
        ev.setEvent_name(req.eventName);
        ev.setDescription(req.description);
        ev.setCategory_id(req.categoryId);
        ev.setStart_datetime(start);
        ev.setEnd_datetime(end);
        ev.setVenue_name(req.venueName);
        ev.setVenue_address(req.venueAddress);
        ev.setMax_capacity(req.maxCapacity);
        ev.setStatus("DRAFT");

        EventsNam saved = eventsRepository.save(ev);

        return ResponseEntity.ok(Map.of(
                "id", saved.getEvent_id(),
                "eventName", saved.getEvent_name(),
                "status", saved.getStatus()
        ));
    }
}
