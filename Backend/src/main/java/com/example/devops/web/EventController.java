package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class EventController {

    @Autowired
    private EventsNamRepository eventsRepo;
    
    @Autowired
    private OrganizerRepo organizerRepo;

    // สร้าง Event ใหม่
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody EventRequest request) {
        try {
            // ✅ Validate required fields
            if (request.getOrganizerId() == null) {
                return ResponseEntity.badRequest()
                        .body("Organizer ID is required");
            }
            
            // ✅ Validate organizer exists in database
            if (!organizerRepo.existsById(request.getOrganizerId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Organizer with ID " + request.getOrganizerId() + " does not exist. " +
                              "Please make sure you are logged in as a valid organizer.");
            }
            
            if (request.getEventName() == null || request.getEventName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Event name is required");
            }

            EventsNam event = new EventsNam();
            event.setOrganizer_id(request.getOrganizerId());
            event.setEvent_name(request.getEventName());
            event.setDescription(request.getDescription());
            event.setCategory_id(request.getCategoryId());
            event.setStart_datetime(request.getStartDatetime());
            event.setEnd_datetime(request.getEndDatetime());
            event.setVenue_name(request.getVenueName());
            event.setVenue_address(request.getLocationName());
            event.setCover_image_url(request.getCoverImageUrl());
            event.setStatus("DRAFT");
            event.setCreated_at(Instant.now());
            event.setUpdated_at(Instant.now());

            EventsNam saved = eventsRepo.save(event);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            // แสดง stack trace เต็มๆ
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating event: " + e.getMessage());
        }
    }

    // ดึงรายการ Event ทั้งหมด
    @GetMapping
    public ResponseEntity<List<EventsNam>> getAllEvents() {
        List<EventsNam> events = eventsRepo.findAll();
        return ResponseEntity.ok(events);
    }

    // ดึง Event ตาม ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        return eventsRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // อัพเดท Event
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody EventRequest request) {
        return eventsRepo.findById(id)
                .map(event -> {
                    if (request.getEventName() != null) event.setEvent_name(request.getEventName());
                    if (request.getDescription() != null) event.setDescription(request.getDescription());
                    if (request.getCategoryId() != null) event.setCategory_id(request.getCategoryId());
                    if (request.getStartDatetime() != null) event.setStart_datetime(request.getStartDatetime());
                    if (request.getEndDatetime() != null) event.setEnd_datetime(request.getEndDatetime());
                    if (request.getVenueName() != null) event.setVenue_name(request.getVenueName());
                    if (request.getLocationName() != null) event.setVenue_address(request.getLocationName());
                    if (request.getCoverImageUrl() != null) event.setCover_image_url(request.getCoverImageUrl());
                    event.setUpdated_at(Instant.now());

                    return ResponseEntity.ok(eventsRepo.save(event));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ลบ Event
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        if (eventsRepo.existsById(id)) {
            eventsRepo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}

// DTO สำหรับรับข้อมูล
class EventRequest {
    private Long organizerId;
    private String eventName;
    private String description;
    private Long categoryId;
    private Instant startDatetime;
    private Instant endDatetime;
    private String venueName;
    private String locationName;
    private String coverImageUrl;

    // Getters and Setters
    public Long getOrganizerId() { return organizerId; }
    public void setOrganizerId(Long organizerId) { this.organizerId = organizerId; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Instant getStartDatetime() { return startDatetime; }
    public void setStartDatetime(Instant startDatetime) { this.startDatetime = startDatetime; }

    public Instant getEndDatetime() { return endDatetime; }
    public void setEndDatetime(Instant endDatetime) { this.endDatetime = endDatetime; }

    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }
}