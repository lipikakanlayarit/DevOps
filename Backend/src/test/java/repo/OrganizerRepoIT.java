package com.example.devops.repo;

import com.example.devops.model.Organizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class OrganizerRepoIT {

    @Autowired
    private OrganizerRepo organizerRepo;

    @BeforeEach
    void setUp() {
        organizerRepo.deleteAll();
    }

    @Test
    void testSaveAndFindById() {
        // Arrange
        Organizer organizer = createOrganizer("john", "john@example.com", "John", "Doe");

        // Act
        Organizer saved = organizerRepo.save(organizer);
        Organizer found = organizerRepo.findById(saved.getId()).orElse(null);

        // Assert
        assertNotNull(found);
        assertEquals("john", found.getUsername());
        assertEquals("john@example.com", found.getEmail());
    }

    @Test
    void testFindByEmailIgnoreCase() {
        // Arrange
        Organizer org1 = createOrganizer("alice", "alice@example.com", "Alice", "Smith");
        Organizer org2 = createOrganizer("bob", "bob@example.com", "Bob", "Jones");

        organizerRepo.save(org1);
        organizerRepo.save(org2);

        // Act - test lowercase
        Optional<Organizer> foundLower = organizerRepo.findByEmailIgnoreCase("alice@example.com");

        // Act - test uppercase
        Optional<Organizer> foundUpper = organizerRepo.findByEmailIgnoreCase("ALICE@EXAMPLE.COM");

        // Act - test mixed case
        Optional<Organizer> foundMixed = organizerRepo.findByEmailIgnoreCase("AlIcE@ExAmPlE.CoM");

        // Act - test not found
        Optional<Organizer> notFound = organizerRepo.findByEmailIgnoreCase("notexist@example.com");

        // Assert
        assertTrue(foundLower.isPresent());
        assertTrue(foundUpper.isPresent());
        assertTrue(foundMixed.isPresent());
        assertFalse(notFound.isPresent());

        assertEquals("alice", foundLower.get().getUsername());
        assertEquals("alice", foundUpper.get().getUsername());
        assertEquals("alice", foundMixed.get().getUsername());
    }

    @Test
    void testFindByUsernameIgnoreCase() {
        // Arrange
        Organizer org1 = createOrganizer("charlie", "charlie@example.com", "Charlie", "Brown");
        Organizer org2 = createOrganizer("david", "david@example.com", "David", "Wilson");

        organizerRepo.save(org1);
        organizerRepo.save(org2);

        // Act - test lowercase
        Optional<Organizer> foundLower = organizerRepo.findByUsernameIgnoreCase("charlie");

        // Act - test uppercase
        Optional<Organizer> foundUpper = organizerRepo.findByUsernameIgnoreCase("CHARLIE");

        // Act - test mixed case
        Optional<Organizer> foundMixed = organizerRepo.findByUsernameIgnoreCase("ChArLiE");

        // Act - test not found
        Optional<Organizer> notFound = organizerRepo.findByUsernameIgnoreCase("notexist");

        // Assert
        assertTrue(foundLower.isPresent());
        assertTrue(foundUpper.isPresent());
        assertTrue(foundMixed.isPresent());
        assertFalse(notFound.isPresent());

        assertEquals("charlie@example.com", foundLower.get().getEmail());
        assertEquals("charlie@example.com", foundUpper.get().getEmail());
        assertEquals("charlie@example.com", foundMixed.get().getEmail());
    }

    @Test
    void testFindIdByEmailOrUsernameIgnoreCase_WithEmail() {
        // Arrange
        Organizer organizer = createOrganizer("testuser", "test@example.com", "Test", "User");
        Organizer saved = organizerRepo.save(organizer);
        Long expectedId = saved.getId();

        // Act - test with email lowercase
        Optional<Long> foundByEmailLower = organizerRepo.findIdByEmailOrUsernameIgnoreCase("test@example.com");

        // Act - test with email uppercase
        Optional<Long> foundByEmailUpper = organizerRepo.findIdByEmailOrUsernameIgnoreCase("TEST@EXAMPLE.COM");

        // Act - test with email mixed case
        Optional<Long> foundByEmailMixed = organizerRepo.findIdByEmailOrUsernameIgnoreCase("TeSt@ExAmPlE.CoM");

        // Assert
        assertTrue(foundByEmailLower.isPresent());
        assertTrue(foundByEmailUpper.isPresent());
        assertTrue(foundByEmailMixed.isPresent());

        assertEquals(expectedId, foundByEmailLower.get());
        assertEquals(expectedId, foundByEmailUpper.get());
        assertEquals(expectedId, foundByEmailMixed.get());
    }

    @Test
    void testFindIdByEmailOrUsernameIgnoreCase_WithUsername() {
        // Arrange
        Organizer organizer = createOrganizer("testuser", "test@example.com", "Test", "User");
        Organizer saved = organizerRepo.save(organizer);
        Long expectedId = saved.getId();

        // Act - test with username lowercase
        Optional<Long> foundByUsernameLower = organizerRepo.findIdByEmailOrUsernameIgnoreCase("testuser");

        // Act - test with username uppercase
        Optional<Long> foundByUsernameUpper = organizerRepo.findIdByEmailOrUsernameIgnoreCase("TESTUSER");

        // Act - test with username mixed case
        Optional<Long> foundByUsernameMixed = organizerRepo.findIdByEmailOrUsernameIgnoreCase("TeStUsEr");

        // Assert
        assertTrue(foundByUsernameLower.isPresent());
        assertTrue(foundByUsernameUpper.isPresent());
        assertTrue(foundByUsernameMixed.isPresent());

        assertEquals(expectedId, foundByUsernameLower.get());
        assertEquals(expectedId, foundByUsernameUpper.get());
        assertEquals(expectedId, foundByUsernameMixed.get());
    }

    @Test
    void testFindIdByEmailOrUsernameIgnoreCase_NotFound() {
        // Arrange
        Organizer organizer = createOrganizer("john", "john@example.com", "John", "Doe");
        organizerRepo.save(organizer);

        // Act
        Optional<Long> notFoundByEmail = organizerRepo.findIdByEmailOrUsernameIgnoreCase("notexist@example.com");
        Optional<Long> notFoundByUsername = organizerRepo.findIdByEmailOrUsernameIgnoreCase("notexist");

        // Assert
        assertFalse(notFoundByEmail.isPresent());
        assertFalse(notFoundByUsername.isPresent());
    }

    @Test
    void testSaveMultipleAndCount() {
        // Arrange & Act
        Organizer org1 = createOrganizer("user1", "user1@example.com", "User1", "Test");
        Organizer org2 = createOrganizer("user2", "user2@example.com", "User2", "Test");
        Organizer org3 = createOrganizer("user3", "user3@example.com", "User3", "Test");

        organizerRepo.save(org1);
        organizerRepo.save(org2);
        organizerRepo.save(org3);

        // Assert
        long count = organizerRepo.count();
        assertEquals(3, count);
    }

    @Test
    void testFindAll() {
        // Arrange
        Organizer org1 = createOrganizer("org1", "org1@example.com", "Org1", "Name");
        Organizer org2 = createOrganizer("org2", "org2@example.com", "Org2", "Name");

        organizerRepo.save(org1);
        organizerRepo.save(org2);

        // Act
        List<Organizer> allOrganizers = organizerRepo.findAll();

        // Assert
        assertNotNull(allOrganizers);
        assertEquals(2, allOrganizers.size());
    }

    @Test
    void testUpdateOrganizer() {
        // Arrange
        Organizer organizer = createOrganizer("olduser", "old@example.com", "Old", "Name");
        Organizer saved = organizerRepo.save(organizer);
        Long id = saved.getId();

        // Act
        Organizer toUpdate = organizerRepo.findById(id).orElseThrow();
        toUpdate.setUsername("newuser");
        toUpdate.setEmail("new@example.com");
        toUpdate.setFirstName("New");
        toUpdate.setLastName("Name");
        toUpdate.setCompanyName("New Company");
        toUpdate.setVerificationStatus("VERIFIED");

        Organizer updated = organizerRepo.save(toUpdate);

        // Assert
        assertEquals("newuser", updated.getUsername());
        assertEquals("new@example.com", updated.getEmail());
        assertEquals("New", updated.getFirstName());
        assertEquals("New Company", updated.getCompanyName());
        assertEquals("VERIFIED", updated.getVerificationStatus());
    }

    @Test
    void testDeleteOrganizer() {
        // Arrange
        Organizer organizer = createOrganizer("deluser", "delete@example.com", "Delete", "Me");
        Organizer saved = organizerRepo.save(organizer);
        Long id = saved.getId();

        // Act
        organizerRepo.deleteById(id);

        // Assert
        Optional<Organizer> deleted = organizerRepo.findById(id);
        assertFalse(deleted.isPresent());
    }

    @Test
    void testSaveWithAllFields() {
        // Arrange
        Organizer organizer = new Organizer();
        organizer.setUsername("fulluser");
        organizer.setEmail("full@example.com");
        organizer.setPasswordHash("hashed_password");
        organizer.setFirstName("Full");
        organizer.setLastName("Name");
        organizer.setPhoneNumber("0812345678");
        organizer.setAddress("123 Main Street, Bangkok");
        organizer.setCompanyName("Full Company Ltd.");
        organizer.setTaxId("1234567890123");
        organizer.setVerificationStatus("PENDING");

        // Act
        Organizer saved = organizerRepo.save(organizer);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("fulluser", saved.getUsername());
        assertEquals("0812345678", saved.getPhoneNumber());
        assertEquals("Full Company Ltd.", saved.getCompanyName());
        assertEquals("1234567890123", saved.getTaxId());
        assertEquals("PENDING", saved.getVerificationStatus());
    }

    @Test
    void testEmptyRepository() {
        // Act
        List<Organizer> organizers = organizerRepo.findAll();

        // Assert
        assertTrue(organizers.isEmpty());
    }

    @Test
    void testUniqueConstraints() {
        // Arrange
        Organizer org1 = createOrganizer("unique", "unique@example.com", "First", "User");
        organizerRepo.save(org1);

        // Act & Assert - duplicate username
        Organizer org2 = createOrganizer("unique", "different@example.com", "Second", "User");
        assertThrows(Exception.class, () -> {
            organizerRepo.save(org2);
            organizerRepo.flush();
        });
    }

    // Helper method
    private Organizer createOrganizer(String username, String email, String firstName, String lastName) {
        Organizer organizer = new Organizer();
        organizer.setUsername(username);
        organizer.setEmail(email);
        organizer.setPasswordHash("hashed_password_123");
        organizer.setFirstName(firstName);
        organizer.setLastName(lastName);
        organizer.setVerificationStatus("PENDING");
        return organizer;
    }
}