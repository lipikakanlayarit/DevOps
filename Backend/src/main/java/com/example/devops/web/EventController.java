package com.example.devops.web;

import com.example.devops.dto.EventCreateRequest;
import com.example.devops.dto.EventResponse;
import com.example.devops.dto.EventUpdateRequest;
import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

import static com.example.devops.dto.EventMapper.applyUpdate;
import static com.example.devops.dto.EventMapper.toDto;
import static com.example.devops.dto.EventMapper.toEntity;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
public class EventController {

    private final EventsNamRepository eventsRepository;
    private final OrganizerRepo organizerRepo;

    public EventController(EventsNamRepository eventsRepository, OrganizerRepo organizerRepo) {
        this.eventsRepository = eventsRepository;
        this.organizerRepo = organizerRepo;
    }

    // ------------------ CREATE ------------------
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody EventCreateRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = auth.getName();
        Optional<Organizer> organizerOpt = organizerRepo.findByUsernameIgnoreCase(username)
                .or(() -> organizerRepo.findByEmailIgnoreCase(username));

        if (organizerOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "Organizer not found or unauthorized"));
        }

        EventsNam ev = toEntity(new EventsNam(), req, organizerOpt.get().getId());
        if (ev.getStatus() == null) ev.setStatus("DRAFT");

        EventsNam saved = eventsRepository.save(ev);
        EventResponse body = toDto(saved);
        return ResponseEntity.ok(body);
    }

    // ------------------ READ ------------------
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOne(@PathVariable("id") Long id) { // 👈 ระบุชื่อ "id"
        return eventsRepository.findById(id)
                .<ResponseEntity<?>>map(ev -> ResponseEntity.ok(toDto(ev)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Event not found")));
    }

    // ------------------ UPDATE ------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id, // 👈 ระบุชื่อ "id"
                                    @Valid @RequestBody EventUpdateRequest req,
                                    Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return eventsRepository.findById(id)
                .<ResponseEntity<?>>map(ev -> {
                    EventsNam updated = applyUpdate(ev, req);
                    EventsNam saved = eventsRepository.save(updated);
                    return ResponseEntity.ok(toDto(saved));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Event not found")));
    }
}
