package com.example.devops.repo;

import com.example.devops.model.AdminUsers;
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
class AdminUserRepositoryIT {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @BeforeEach
    void setUp() {
        adminUserRepository.deleteAll();
    }

    @Test
    void testSaveAndFindById() {
        // Arrange
        AdminUsers admin = createAdminUser("admin1", "admin1@example.com", "Admin", "User");

        // Act
        AdminUsers saved = adminUserRepository.save(admin);
        AdminUsers found = adminUserRepository.findById(saved.getId()).orElse(null);

        // Assert
        assertNotNull(found, "Admin user should be found");
        assertEquals(saved.getId(), found.getId());
        assertEquals("admin1", found.getUsername());
    }

    @Test
    void testFindByEmailIgnoreCase() {
        // Arrange
        AdminUsers admin1 = createAdminUser("john", "john@example.com", "John", "Doe");
        AdminUsers admin2 = createAdminUser("jane", "jane@example.com", "Jane", "Smith");

        adminUserRepository.save(admin1);
        adminUserRepository.save(admin2);

        // Act - test lowercase
        Optional<AdminUsers> foundLower = adminUserRepository.findByEmailIgnoreCase("john@example.com");

        // Act - test uppercase
        Optional<AdminUsers> foundUpper = adminUserRepository.findByEmailIgnoreCase("JOHN@EXAMPLE.COM");

        // Act - test mixed case
        Optional<AdminUsers> foundMixed = adminUserRepository.findByEmailIgnoreCase("JoHn@ExAmPlE.CoM");

        // Act - test not found
        Optional<AdminUsers> notFound = adminUserRepository.findByEmailIgnoreCase("notexist@example.com");

        // Assert
        assertTrue(foundLower.isPresent(), "Should find with lowercase email");
        assertTrue(foundUpper.isPresent(), "Should find with uppercase email");
        assertTrue(foundMixed.isPresent(), "Should find with mixed case email");
        assertFalse(notFound.isPresent(), "Should not find non-existent email");

        assertEquals("john", foundLower.get().getUsername());
        assertEquals("john", foundUpper.get().getUsername());
        assertEquals("john", foundMixed.get().getUsername());
    }

    @Test
    void testFindByUsernameIgnoreCase() {
        // Arrange
        AdminUsers admin1 = createAdminUser("alice", "alice@example.com", "Alice", "Wonder");
        AdminUsers admin2 = createAdminUser("bob", "bob@example.com", "Bob", "Builder");

        adminUserRepository.save(admin1);
        adminUserRepository.save(admin2);

        // Act - test lowercase
        Optional<AdminUsers> foundLower = adminUserRepository.findByUsernameIgnoreCase("alice");

        // Act - test uppercase
        Optional<AdminUsers> foundUpper = adminUserRepository.findByUsernameIgnoreCase("ALICE");

        // Act - test mixed case
        Optional<AdminUsers> foundMixed = adminUserRepository.findByUsernameIgnoreCase("AlIcE");

        // Act - test not found
        Optional<AdminUsers> notFound = adminUserRepository.findByUsernameIgnoreCase("charlie");

        // Assert
        assertTrue(foundLower.isPresent(), "Should find with lowercase username");
        assertTrue(foundUpper.isPresent(), "Should find with uppercase username");
        assertTrue(foundMixed.isPresent(), "Should find with mixed case username");
        assertFalse(notFound.isPresent(), "Should not find non-existent username");

        assertEquals("alice@example.com", foundLower.get().getEmail());
        assertEquals("alice@example.com", foundUpper.get().getEmail());
        assertEquals("alice@example.com", foundMixed.get().getEmail());
    }

    @Test
    void testSaveMultipleAndCount() {
        // Arrange & Act
        AdminUsers admin1 = createAdminUser("user1", "user1@example.com", "First", "User");
        AdminUsers admin2 = createAdminUser("user2", "user2@example.com", "Second", "User");
        AdminUsers admin3 = createAdminUser("user3", "user3@example.com", "Third", "User");

        adminUserRepository.save(admin1);
        adminUserRepository.save(admin2);
        adminUserRepository.save(admin3);

        // Assert
        long count = adminUserRepository.count();
        assertEquals(3, count, "Should have 3 admin users in database");
    }

    @Test
    void testFindAll() {
        // Arrange
        AdminUsers admin1 = createAdminUser("test1", "test1@example.com", "Test1", "User");
        AdminUsers admin2 = createAdminUser("test2", "test2@example.com", "Test2", "User");

        adminUserRepository.save(admin1);
        adminUserRepository.save(admin2);

        // Act
        List<AdminUsers> allAdmins = adminUserRepository.findAll();

        // Assert
        assertNotNull(allAdmins, "Result should not be null");
        assertEquals(2, allAdmins.size(), "Should have 2 admin users");
    }

    @Test
    void testUpdateAdminUser() {
        // Arrange
        AdminUsers admin = createAdminUser("olduser", "old@example.com", "Old", "Name");
        AdminUsers saved = adminUserRepository.save(admin);
        Long id = saved.getId();

        // Act
        AdminUsers toUpdate = adminUserRepository.findById(id).orElseThrow();
        toUpdate.setUsername("newuser");
        toUpdate.setEmail("new@example.com");
        toUpdate.setFirstName("New");
        toUpdate.setLastName("Name");

        AdminUsers updated = adminUserRepository.save(toUpdate);

        // Assert
        assertNotNull(updated);
        assertEquals("newuser", updated.getUsername());
        assertEquals("new@example.com", updated.getEmail());
        assertEquals("New", updated.getFirstName());
        assertEquals("Name", updated.getLastName());
    }

    @Test
    void testDeleteAdminUser() {
        // Arrange
        AdminUsers admin = createAdminUser("deluser", "delete@example.com", "Delete", "Me");
        AdminUsers saved = adminUserRepository.save(admin);
        Long id = saved.getId();

        // Act
        adminUserRepository.deleteById(id);

        // Assert
        AdminUsers deleted = adminUserRepository.findById(id).orElse(null);
        assertNull(deleted, "Admin user should be deleted");
    }

    @Test
    void testEmptyRepository() {
        // Act
        List<AdminUsers> admins = adminUserRepository.findAll();

        // Assert
        assertTrue(admins.isEmpty(), "Repository should be empty initially");
    }

    // Helper method using setters
    private AdminUsers createAdminUser(String username, String email, String firstName, String lastName) {
        AdminUsers admin = new AdminUsers();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setPasswordHash("hashed_password_123");
        admin.setRoleName("ADMIN");
        admin.setActive(true);
        return admin;
    }
}