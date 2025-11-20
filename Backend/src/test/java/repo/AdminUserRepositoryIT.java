package com.example.devops.repo;

import com.example.devops.model.AdminUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(properties = {
        // ใช้ H2 + ให้ Hibernate สร้างตารางจาก Entity (ไม่ใช้ Flyway)
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class AdminUserRepositoryIT {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @BeforeEach
    void setUp() {
        // ล้างข้อมูลทุกครั้งกัน Test ชนกัน
        adminUserRepository.deleteAll();
    }

    // ========== HELPER ==========
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

    // ========== TEST CASES ==========

    @Test
    @DisplayName("บันทึก Admin แล้ว findById ได้")
    void testSaveAndFindById() {
        // Arrange
        AdminUsers admin = createAdminUser("admin1", "admin1@example.com", "Admin", "User");

        // Act
        AdminUsers saved = adminUserRepository.save(admin);
        Optional<AdminUsers> foundOpt = adminUserRepository.findById(saved.getId());

        // Assert
        assertTrue(foundOpt.isPresent(), "ควรหาเจอจาก findById");
        AdminUsers found = foundOpt.get();
        assertEquals(saved.getId(), found.getId());
        assertEquals("admin1", found.getUsername());
        assertEquals("admin1@example.com", found.getEmail());
    }

    @Test
    @DisplayName("findByEmailIgnoreCase ทำงานได้ทั้ง lower / upper / mixed case")
    void testFindByEmailIgnoreCase() {
        // Arrange
        AdminUsers admin = createAdminUser("john", "john@example.com", "John", "Doe");
        adminUserRepository.save(admin);

        // Act
        Optional<AdminUsers> lower = adminUserRepository.findByEmailIgnoreCase("john@example.com");
        Optional<AdminUsers> upper = adminUserRepository.findByEmailIgnoreCase("JOHN@EXAMPLE.COM");
        Optional<AdminUsers> mixed = adminUserRepository.findByEmailIgnoreCase("JoHn@ExAmPlE.CoM");
        Optional<AdminUsers> notFound = adminUserRepository.findByEmailIgnoreCase("nope@example.com");

        // Assert
        assertAll(
                () -> assertTrue(lower.isPresent(), "lowercase ควรหาเจอ"),
                () -> assertTrue(upper.isPresent(), "UPPERCASE ควรหาเจอ"),
                () -> assertTrue(mixed.isPresent(), "MiXeD case ควรหาเจอ"),
                () -> assertEquals("john", lower.get().getUsername()),
                () -> assertEquals("john", upper.get().getUsername()),
                () -> assertEquals("john", mixed.get().getUsername()),
                () -> assertFalse(notFound.isPresent(), "อีเมลที่ไม่มีในระบบต้องไม่เจอ")
        );
    }

    @Test
    @DisplayName("findByUsernameIgnoreCase ทำงานได้ทั้ง lower / upper / mixed case")
    void testFindByUsernameIgnoreCase() {
        // Arrange
        AdminUsers admin = createAdminUser("alice", "alice@example.com", "Alice", "Wonderland");
        adminUserRepository.save(admin);

        // Act
        Optional<AdminUsers> lower = adminUserRepository.findByUsernameIgnoreCase("alice");
        Optional<AdminUsers> upper = adminUserRepository.findByUsernameIgnoreCase("ALICE");
        Optional<AdminUsers> mixed = adminUserRepository.findByUsernameIgnoreCase("AlIcE");
        Optional<AdminUsers> notFound = adminUserRepository.findByUsernameIgnoreCase("bob");

        // Assert
        assertAll(
                () -> assertTrue(lower.isPresent(), "lowercase ควรหาเจอ"),
                () -> assertTrue(upper.isPresent(), "UPPERCASE ควรหาเจอ"),
                () -> assertTrue(mixed.isPresent(), "MiXeD case ควรหาเจอ"),
                () -> assertEquals("alice@example.com", lower.get().getEmail()),
                () -> assertEquals("alice@example.com", upper.get().getEmail()),
                () -> assertEquals("alice@example.com", mixed.get().getEmail()),
                () -> assertFalse(notFound.isPresent(), "username ที่ไม่มี ต้องไม่เจอ")
        );
    }

    @Test
    @DisplayName("บันทึกหลาย record แล้ว count() ต้องถูก")
    void testSaveMultipleAndCount() {
        // Arrange
        adminUserRepository.save(createAdminUser("user1", "user1@example.com", "First", "User"));
        adminUserRepository.save(createAdminUser("user2", "user2@example.com", "Second", "User"));
        adminUserRepository.save(createAdminUser("user3", "user3@example.com", "Third", "User"));

        // Act
        long count = adminUserRepository.count();

        // Assert
        assertEquals(3, count, "ควรมี 3 แถวใน table admin_users");
    }

    @Test
    @DisplayName("findAll จะคืน List ตามจำนวนที่บันทึก")
    void testFindAll() {
        // Arrange
        adminUserRepository.save(createAdminUser("test1", "test1@example.com", "Test1", "User"));
        adminUserRepository.save(createAdminUser("test2", "test2@example.com", "Test2", "User"));

        // Act
        List<AdminUsers> all = adminUserRepository.findAll();

        // Assert
        assertNotNull(all);
        assertEquals(2, all.size(), "ต้องเจอ 2 แถว");
    }

    @Test
    @DisplayName("อัปเดตข้อมูล Admin แล้วค่าต้องเปลี่ยนจริงใน DB")
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
        toUpdate.setActive(false);

        AdminUsers updated = adminUserRepository.save(toUpdate);

        // Assert
        assertAll(
                () -> assertEquals("newuser", updated.getUsername()),
                () -> assertEquals("new@example.com", updated.getEmail()),
                () -> assertEquals("New", updated.getFirstName()),
                () -> assertEquals("Name", updated.getLastName()),
                () -> assertFalse(updated.isActive())
        );
    }

    @Test
    @DisplayName("ลบ Admin แล้ว findById ต้องไม่เจอ")
    void testDeleteAdminUser() {
        // Arrange
        AdminUsers admin = createAdminUser("deluser", "delete@example.com", "Delete", "Me");
        AdminUsers saved = adminUserRepository.save(admin);
        Long id = saved.getId();

        // Act
        adminUserRepository.deleteById(id);
        Optional<AdminUsers> deleted = adminUserRepository.findById(id);

        // Assert
        assertFalse(deleted.isPresent(), "ลบแล้วไม่ควรหาเจอ");
    }

    @Test
    @DisplayName("ตอนเริ่มต้น repository ควรเป็นค่าว่าง")
    void testEmptyRepository() {
        // Act
        List<AdminUsers> admins = adminUserRepository.findAll();

        // Assert
        assertTrue(admins.isEmpty(), "ตอนเริ่มต้นควรยังไม่มีข้อมูล");
    }
}
