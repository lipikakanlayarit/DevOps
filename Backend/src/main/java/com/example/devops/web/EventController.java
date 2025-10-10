package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
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

    /**
     * Create a new event (only for ORGANIZER role)
     */
    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> eventData, 
                                          Authentication authentication) {
        try {
            // Get the username from JWT token
            String username = authentication.getName();
            
            // Find the organizer by username
            Optional<Organizer> organizerOpt = organizerRepo.findByUsernameIgnoreCase(username);
            if (organizerOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Organizer not found"));
            }
            
            Organizer organizer = organizerOpt.get();
            
            // Create new event
            EventsNam event = new EventsNam();
            event.setOrganizer_id(organizer.getId());
            event.setEvent_name((String) eventData.get("event_name"));
            event.setDescription((String) eventData.get("description"));
            
            // Handle category_id
            if (eventData.get("category_id") != null) {
                event.setCategory_id(Long.valueOf(eventData.get("category_id").toString()));
            }
            
            // Handle datetime fields - expect ISO 8601 strings
            if (eventData.get("start_datetime") != null) {
                event.setStart_datetime(Instant.parse((String) eventData.get("start_datetime")));
            }
            if (eventData.get("end_datetime") != null) {
                event.setEnd_datetime(Instant.parse((String) eventData.get("end_datetime")));
            }
            
            event.setVenue_name((String) eventData.get("venue_name"));
            event.setVenue_address((String) eventData.get("venue_address"));
            event.setCover_image_url((String) eventData.get("cover_image_url"));
            
            // Handle max_capacity
            if (eventData.get("max_capacity") != null) {
                event.setMax_capacity(Integer.valueOf(eventData.get("max_capacity").toString()));
            }
            
            // Set default status if not provided
            String status = (String) eventData.getOrDefault("status", "draft");
            event.setStatus(status);
            
            // Set timestamps
            Instant now = Instant.now();
            event.setCreated_at(now);
            event.setUpdated_at(now);
            
            // Save to database
            EventsNam savedEvent = eventsRepository.save(event);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Event created successfully",
                "event_id", savedEvent.getEvent_id(),
                "event_name", savedEvent.getEvent_name(),
                "status", savedEvent.getStatus()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to create event: " + e.getMessage()));
        }
    }

    /**
     * Get all events (authenticated users)
     */
    @GetMapping
    public ResponseEntity<?> getAllEvents() {
        List<EventsNam> events = eventsRepository.findAll();
        return ResponseEntity.ok(events);
    }

    /**
     * Get event by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        Optional<EventsNam> event = eventsRepository.findById(id);
        if (event.isPresent()) {
            return ResponseEntity.ok(event.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Event not found"));
        }
    }

    /**
     * Update event (only for ORGANIZER role and must be owner)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, 
                                          @RequestBody Map<String, Object> eventData,
                                          Authentication authentication) {
        try {
            String username = authentication.getName();
            Optional<Organizer> organizerOpt = organizerRepo.findByUsernameIgnoreCase(username);
            if (organizerOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Organizer not found"));
            }
            
            Organizer organizer = organizerOpt.get();
            Optional<EventsNam> eventOpt = eventsRepository.findById(id);
            
            if (eventOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found"));
            }
            
            EventsNam event = eventOpt.get();
            
            // Check if the organizer owns this event
            if (!event.getOrganizer_id().equals(organizer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only update your own events"));
            }
            
            // Update fields
            if (eventData.containsKey("event_name")) {
                event.setEvent_name((String) eventData.get("event_name"));
            }
            if (eventData.containsKey("description")) {
                event.setDescription((String) eventData.get("description"));
            }
            if (eventData.containsKey("category_id")) {
                event.setCategory_id(Long.valueOf(eventData.get("category_id").toString()));
            }
            if (eventData.containsKey("start_datetime")) {
                event.setStart_datetime(Instant.parse((String) eventData.get("start_datetime")));
            }
            if (eventData.containsKey("end_datetime")) {
                event.setEnd_datetime(Instant.parse((String) eventData.get("end_datetime")));
            }
            if (eventData.containsKey("venue_name")) {
                event.setVenue_name((String) eventData.get("venue_name"));
            }
            if (eventData.containsKey("venue_address")) {
                event.setVenue_address((String) eventData.get("venue_address"));
            }
            if (eventData.containsKey("cover_image_url")) {
                event.setCover_image_url((String) eventData.get("cover_image_url"));
            }
            if (eventData.containsKey("max_capacity")) {
                event.setMax_capacity(Integer.valueOf(eventData.get("max_capacity").toString()));
            }
            if (eventData.containsKey("status")) {
                event.setStatus((String) eventData.get("status"));
            }
            
            event.setUpdated_at(Instant.now());
            
            EventsNam updatedEvent = eventsRepository.save(event);
            
            return ResponseEntity.ok(Map.of(
                "message", "Event updated successfully",
                "event_id", updatedEvent.getEvent_id()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to update event: " + e.getMessage()));
        }
    }

    /**
     * Delete event (only for ORGANIZER role and must be owner)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication.getName();
            Optional<Organizer> organizerOpt = organizerRepo.findByUsernameIgnoreCase(username);
            if (organizerOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Organizer not found"));
            }
            
            Organizer organizer = organizerOpt.get();
            Optional<EventsNam> eventOpt = eventsRepository.findById(id);
            
            if (eventOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found"));
            }
            
            EventsNam event = eventOpt.get();
            
            // Check if the organizer owns this event
            if (!event.getOrganizer_id().equals(organizer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only delete your own events"));
            }
            
            eventsRepository.delete(event);
            
            return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete event: " + e.getMessage()));
        }
    }
}
