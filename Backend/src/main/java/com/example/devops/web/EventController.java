// src/main/java/com/example/devops/web/EventController.java
package com.example.devops.web;

import com.example.devops.dto.EventCreateRequest;
import com.example.devops.dto.EventResponse;
import com.example.devops.dto.EventUpdateRequest;
import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
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
        // เปลี่ยน fallback เป็น PENDING
        if (ev.getStatus() == null) ev.setStatus("PENDING");

        EventsNam saved = eventsRepository.save(ev);
        EventResponse body = toDto(saved);
        return ResponseEntity.ok(body);
    }

    // ------------------ READ ------------------
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOne(@PathVariable("id") Long id) {
        return eventsRepository.findById(id)
                .<ResponseEntity<?>>map(ev -> ResponseEntity.ok(toDto(ev)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Event not found")));
    }

    // ------------------ UPDATE ------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id,
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

    // =====================================================================
    //                             COVER IMAGE
    // =====================================================================

    @PostMapping(path = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadCover(@PathVariable("id") Long id,
                                         @RequestParam("file") MultipartFile file,
                                         Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return eventsRepository.findById(id)
                .map(ev -> {
                    try {
                        String ct = file.getContentType();
                        if (ct == null || !ct.startsWith("image/")) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
                        }
                        if (file.getSize() > 10 * 1024 * 1024) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Max file size 10MB"));
                        }

                        ev.setCover_image(file.getBytes());
                        ev.setCover_image_type(ct);
                        ev.setCover_updated_at(Instant.now());
                        eventsRepository.save(ev);

                        return ResponseEntity.ok(Map.of("status", "ok"));
                    } catch (Exception ex) {
                        return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Event not found")));
    }

    @GetMapping("/{id}/cover")
    public ResponseEntity<byte[]> getCover(@PathVariable("id") Long id) {
        Optional<EventsNam> opt = eventsRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        EventsNam ev = opt.get();
        byte[] img = ev.getCover_image();
        if (img == null || img.length == 0) return ResponseEntity.notFound().build();

        MediaType type = MediaType.IMAGE_JPEG;
        String ct = ev.getCover_image_type();
        if (ct != null && !ct.isBlank()) {
            try { type = MediaType.parseMediaType(ct); } catch (Exception ignored) {}
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600, must-revalidate")
                .contentType(type)
                .body(img);
    }

    @DeleteMapping("/{id}/cover")
    public ResponseEntity<?> deleteCover(@PathVariable("id") Long id, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return eventsRepository.findById(id)
                .map(ev -> {
                    ev.setCover_image(null);
                    ev.setCover_image_type(null);
                    ev.setCover_updated_at(null);
                    eventsRepository.save(ev);
                    return ResponseEntity.ok(Map.of("status", "deleted"));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Event not found")));
    }
}
