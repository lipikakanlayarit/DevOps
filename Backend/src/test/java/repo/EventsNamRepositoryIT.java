package com.example.devops.repo;

import com.example.devops.model.EventsNam;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class EventsNamRepositoryIT {

    @Autowired
    private EventsNamRepository eventsNamRepository;

    @BeforeEach
    void setUp() {
        eventsNamRepository.deleteAll();
    }

    @Test
    void testSaveAndFindById() {
        // Arrange
        EventsNam event = createEvent("Concert 2024", "PENDING", 1L);

        // Act
        EventsNam saved = eventsNamRepository.save(event);
        EventsNam found = eventsNamRepository.findById(saved.getId()).orElse(null);

        // Assert
        assertNotNull(found);
        assertEquals("Concert 2024", found.getEventName());
        assertEquals("PENDING", found.getStatus());
    }

    @Test
    void testFindByOrganizerIdOrderByIdDesc() {
        // Arrange
        EventsNam event1 = createEvent("Event A", "PENDING", 1L);
        EventsNam event2 = createEvent("Event B", "APPROVED", 1L);
        EventsNam event3 = createEvent("Event C", "PENDING", 2L);

        eventsNamRepository.save(event1);
        eventsNamRepository.save(event2);
        eventsNamRepository.save(event3);

        // Act
        List<EventsNam> org1Events = eventsNamRepository.findByOrganizerIdOrderByIdDesc(1L);
        List<EventsNam> org2Events = eventsNamRepository.findByOrganizerIdOrderByIdDesc(2L);

        // Assert
        assertEquals(2, org1Events.size());
        assertEquals(1, org2Events.size());
        assertEquals("Event B", org1Events.get(0).getEventName()); // latest first
    }

    @Test
    void testFindAllByStatus() {
        // Arrange
        EventsNam event1 = createEvent("Pending Event 1", "PENDING", 1L);
        EventsNam event2 = createEvent("Approved Event", "APPROVED", 1L);
        EventsNam event3 = createEvent("Pending Event 2", "PENDING", 2L);

        eventsNamRepository.save(event1);
        eventsNamRepository.save(event2);
        eventsNamRepository.save(event3);

        // Act
        List<EventsNam> pendingEvents = eventsNamRepository.findAllByStatus("PENDING");
        List<EventsNam> approvedEvents = eventsNamRepository.findAllByStatus("APPROVED");

        // Assert
        assertEquals(2, pendingEvents.size());
        assertEquals(1, approvedEvents.size());
    }

    @Test
    void testFindAllByStatusIgnoreCase() {
        // Arrange
        EventsNam event = createEvent("Test Event", "APPROVED", 1L);
        eventsNamRepository.save(event);

        // Act - test different cases
        List<EventsNam> lower = eventsNamRepository.findAllByStatus("approved");
        List<EventsNam> upper = eventsNamRepository.findAllByStatus("APPROVED");
        List<EventsNam> mixed = eventsNamRepository.findAllByStatus("ApProVed");

        // Assert
        assertEquals(1, lower.size());
        assertEquals(1, upper.size());
        assertEquals(1, mixed.size());
    }

    @Test
    void testFindAllByOrderByEventIdDesc() {
        // Arrange
        EventsNam event1 = createEvent("First Event", "PENDING", 1L);
        EventsNam event2 = createEvent("Second Event", "APPROVED", 1L);
        EventsNam event3 = createEvent("Third Event", "REJECTED", 2L);

        eventsNamRepository.save(event1);
        eventsNamRepository.save(event2);
        eventsNamRepository.save(event3);

        // Act
        List<EventsNam> allEvents = eventsNamRepository.findAllByOrderByEventIdDesc();

        // Assert
        assertEquals(3, allEvents.size());
        assertEquals("Third Event", allEvents.get(0).getEventName()); // latest first
        assertEquals("Second Event", allEvents.get(1).getEventName());
        assertEquals("First Event", allEvents.get(2).getEventName());
    }

    @Test
    void testApprove() {
        // Arrange
        EventsNam event = createEvent("Waiting Event", "PENDING", 1L);
        EventsNam saved = eventsNamRepository.save(event);
        Long eventId = saved.getId();

        // Act
        int updated = eventsNamRepository.approve(eventId, "Looks good!", 123);
        eventsNamRepository.flush();

        // Assert
        assertEquals(1, updated);
        EventsNam approved = eventsNamRepository.findById(eventId).orElseThrow();
        assertEquals("APPROVED", approved.getStatus());
        assertEquals("Looks good!", approved.getReview());
        assertEquals(123, approved.getReviewed_by());
        assertNotNull(approved.getReviewed_at());
    }

    @Test
    void testReject() {
        // Arrange
        EventsNam event = createEvent("Bad Event", "PENDING", 1L);
        EventsNam saved = eventsNamRepository.save(event);
        Long eventId = saved.getId();

        // Act
        int updated = eventsNamRepository.reject(eventId, "Not approved", 456);
        eventsNamRepository.flush();

        // Assert
        assertEquals(1, updated);
        EventsNam rejected = eventsNamRepository.findById(eventId).orElseThrow();
        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Not approved", rejected.getReview());
        assertEquals(456, rejected.getReviewed_by());
        assertNotNull(rejected.getReviewed_at());
    }

    @Test
    void testFindCurrentlyOnSale() {
        // Arrange
        Instant now = Instant.now();
        Instant past = now.minus(10, ChronoUnit.DAYS);
        Instant future = now.plus(10, ChronoUnit.DAYS);

        // Event on sale now
        EventsNam onSale = createEvent("On Sale Now", "APPROVED", 1L);
        onSale.setSalesStartDatetime(past);
        onSale.setSalesEndDatetime(future);

        // Event not started yet
        EventsNam upcoming = createEvent("Upcoming Sale", "APPROVED", 1L);
        upcoming.setSalesStartDatetime(future);
        upcoming.setSalesEndDatetime(future.plus(5, ChronoUnit.DAYS));

        // Event already ended
        EventsNam ended = createEvent("Ended Sale", "APPROVED", 1L);
        ended.setSalesStartDatetime(past.minus(20, ChronoUnit.DAYS));
        ended.setSalesEndDatetime(past.minus(10, ChronoUnit.DAYS));

        eventsNamRepository.save(onSale);
        eventsNamRepository.save(upcoming);
        eventsNamRepository.save(ended);

        // Act
        List<EventsNam> currentSales = eventsNamRepository.findCurrentlyOnSale(now);

        // Assert
        assertEquals(1, currentSales.size());
        assertEquals("On Sale Now", currentSales.get(0).getEventName());
    }

    @Test
    void testFindUpcomingSales() {
        // Arrange
        Instant now = Instant.now();
        Instant future1 = now.plus(5, ChronoUnit.DAYS);
        Instant future2 = now.plus(10, ChronoUnit.DAYS);
        Instant past = now.minus(5, ChronoUnit.DAYS);

        // Upcoming event 1
        EventsNam upcoming1 = createEvent("Upcoming 1", "APPROVED", 1L);
        upcoming1.setSalesStartDatetime(future1);
        upcoming1.setSalesEndDatetime(future1.plus(5, ChronoUnit.DAYS));

        // Upcoming event 2
        EventsNam upcoming2 = createEvent("Upcoming 2", "APPROVED", 1L);
        upcoming2.setSalesStartDatetime(future2);
        upcoming2.setSalesEndDatetime(future2.plus(5, ChronoUnit.DAYS));

        // Already started
        EventsNam started = createEvent("Already Started", "APPROVED", 1L);
        started.setSalesStartDatetime(past);
        started.setSalesEndDatetime(future1);

        eventsNamRepository.save(upcoming1);
        eventsNamRepository.save(upcoming2);
        eventsNamRepository.save(started);

        // Act
        List<EventsNam> upcomingSales = eventsNamRepository.findUpcomingSales(now);

        // Assert
        assertEquals(2, upcomingSales.size());
        assertEquals("Upcoming 1", upcomingSales.get(0).getEventName()); // earliest first
        assertEquals("Upcoming 2", upcomingSales.get(1).getEventName());
    }

    @Test
    void testFindTopByEventNameOrderByIdDesc() {
        // Arrange
        EventsNam event1 = createEvent("Rock Concert", "PENDING", 1L);
        EventsNam event2 = createEvent("Rock Concert", "APPROVED", 1L);
        EventsNam event3 = createEvent("Jazz Night", "PENDING", 2L);

        eventsNamRepository.save(event1);
        eventsNamRepository.save(event2);
        eventsNamRepository.save(event3);

        // Act
        Optional<EventsNam> latestRock = eventsNamRepository.findTopByEventNameOrderByIdDesc("Rock Concert");
        Optional<EventsNam> latestJazz = eventsNamRepository.findTopByEventNameOrderByIdDesc("Jazz Night");
        Optional<EventsNam> notFound = eventsNamRepository.findTopByEventNameOrderByIdDesc("Pop Concert");

        // Assert
        assertTrue(latestRock.isPresent());
        assertEquals("APPROVED", latestRock.get().getStatus()); // latest one
        assertTrue(latestJazz.isPresent());
        assertFalse(notFound.isPresent());
    }

    @Test
    void testSaveWithAllFields() {
        // Arrange
        Instant now = Instant.now();
        EventsNam event = new EventsNam();
        event.setOrganizerId(1L);
        event.setEventName("Complete Event");
        event.setDescription("Full description");
        event.setCategoryId(5L);
        event.setStartDatetime(now.plus(30, ChronoUnit.DAYS));
        event.setEndDatetime(now.plus(31, ChronoUnit.DAYS));
        event.setSalesStartDatetime(now.plus(1, ChronoUnit.DAYS));
        event.setSalesEndDatetime(now.plus(29, ChronoUnit.DAYS));
        event.setVenueName("Grand Hall");
        event.setVenueAddress("123 Main St");
        event.setMaxCapacity(1000);
        event.setStatus("APPROVED");

        // Act
        EventsNam saved = eventsNamRepository.save(event);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("Complete Event", saved.getEventName());
        assertEquals(1000, saved.getMaxCapacity());
        assertEquals("Grand Hall", saved.getVenueName());
    }

    @Test
    void testUpdateEvent() {
        // Arrange
        EventsNam event = createEvent("Old Name", "PENDING", 1L);
        EventsNam saved = eventsNamRepository.save(event);
        Long id = saved.getId();

        // Act
        EventsNam toUpdate = eventsNamRepository.findById(id).orElseThrow();
        toUpdate.setEventName("New Name");
        toUpdate.setStatus("APPROVED");
        toUpdate.setMaxCapacity(500);
        EventsNam updated = eventsNamRepository.save(toUpdate);

        // Assert
        assertEquals("New Name", updated.getEventName());
        assertEquals("APPROVED", updated.getStatus());
        assertEquals(500, updated.getMaxCapacity());
    }

    @Test
    void testDeleteEvent() {
        // Arrange
        EventsNam event = createEvent("To Delete", "PENDING", 1L);
        EventsNam saved = eventsNamRepository.save(event);
        Long id = saved.getId();

        // Act
        eventsNamRepository.deleteById(id);

        // Assert
        Optional<EventsNam> deleted = eventsNamRepository.findById(id);
        assertFalse(deleted.isPresent());
    }

    // Helper method
    private EventsNam createEvent(String eventName, String status, Long organizerId) {
        EventsNam event = new EventsNam();
        event.setEventName(eventName);
        event.setStatus(status);
        event.setOrganizerId(organizerId);
        event.setDescription("Test event description");
        event.setVenueName("Test Venue");
        event.setCategoryId(1L);
        return event;
    }
}