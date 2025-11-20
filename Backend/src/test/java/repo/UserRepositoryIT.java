package com.example.devops.repo;

import com.example.devops.model.User;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UserRepositoryIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser1;
    private User testUser2;
    private User testUser3;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // User 1: Admin
        testUser1 = new User();
        testUser1.setUsername("admin");
        testUser1.setEmail("admin@example.com");
        testUser1.setPassword("$2a$10$hashedPassword1");
        testUser1.setRole("ADMIN");
        testUser1.setFirstName("John");
        testUser1.setLastName("Doe");
        testUser1.setPhoneNumber("0812345678");
        testUser1.setIdCardPassport("1234567890123");

        // User 2: Regular User
        testUser2 = new User();
        testUser2.setUsername("user1");
        testUser2.setEmail("user1@example.com");
        testUser2.setPassword("$2a$10$hashedPassword2");
        testUser2.setRole("USER");
        testUser2.setFirstName("Jane");
        testUser2.setLastName("Smith");
        testUser2.setPhoneNumber("0823456789");
        testUser2.setIdCardPassport("9876543210987");

        // User 3: Another User with mixed case email
        testUser3 = new User();
        testUser3.setUsername("TestUser");
        testUser3.setEmail("TestUser@Example.COM");
        testUser3.setPassword("$2a$10$hashedPassword3");
        testUser3.setRole("USER");
        testUser3.setFirstName("Bob");
        testUser3.setLastName("Johnson");
        testUser3.setPhoneNumber("0834567890");
        testUser3.setIdCardPassport("1111222233334");
    }

    @Test
    @Order(1)
    @DisplayName("✅ ค้นหา User ด้วย email (ignore case) - พบ User")
    void testFindByEmailIgnoreCase_Found() {
        // Given
        userRepository.save(testUser1);

        // When
        Optional<User> result1 = userRepository.findByEmailIgnoreCase("admin@example.com");
        Optional<User> result2 = userRepository.findByEmailIgnoreCase("ADMIN@EXAMPLE.COM");
        Optional<User> result3 = userRepository.findByEmailIgnoreCase("Admin@Example.Com");

        // Then
        assertThat(result1).isPresent();
        assertThat(result1.get().getEmail()).isEqualTo("admin@example.com");
        assertThat(result1.get().getUsername()).isEqualTo("admin");

        assertThat(result2).isPresent();
        assertThat(result2.get().getId()).isEqualTo(result1.get().getId());

        assertThat(result3).isPresent();
        assertThat(result3.get().getId()).isEqualTo(result1.get().getId());
    }

    @Test
    @Order(2)
    @DisplayName("✅ ค้นหา User ด้วย email (ignore case) - ไม่พบ User")
    void testFindByEmailIgnoreCase_NotFound() {
        // Given
        userRepository.save(testUser1);

        // When
        Optional<User> result = userRepository.findByEmailIgnoreCase("notfound@example.com");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @Order(3)
    @DisplayName("✅ ค้นหา User ด้วย username (ignore case) - พบ User")
    void testFindByUsernameIgnoreCase_Found() {
        // Given
        userRepository.save(testUser1);

        // When
        Optional<User> result1 = userRepository.findByUsernameIgnoreCase("admin");
        Optional<User> result2 = userRepository.findByUsernameIgnoreCase("ADMIN");
        Optional<User> result3 = userRepository.findByUsernameIgnoreCase("Admin");

        // Then
        assertThat(result1).isPresent();
        assertThat(result1.get().getUsername()).isEqualTo("admin");
        assertThat(result1.get().getEmail()).isEqualTo("admin@example.com");

        assertThat(result2).isPresent();
        assertThat(result2.get().getId()).isEqualTo(result1.get().getId());

        assertThat(result3).isPresent();
        assertThat(result3.get().getId()).isEqualTo(result1.get().getId());
    }

    @Test
    @Order(4)
    @DisplayName("✅ ค้นหา User ด้วย username (ignore case) - ไม่พบ User")
    void testFindByUsernameIgnoreCase_NotFound() {
        // Given
        userRepository.save(testUser1);

        // When
        Optional<User> result = userRepository.findByUsernameIgnoreCase("nonexistentuser");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @Order(5)
    @DisplayName("✅ ค้นหา User ด้วย mixed case email ที่บันทึกไว้")
    void testFindByEmailIgnoreCase_MixedCaseStored() {
        // Given
        userRepository.save(testUser3); // Email: TestUser@Example.COM

        // When
        Optional<User> result1 = userRepository.findByEmailIgnoreCase("testuser@example.com");
        Optional<User> result2 = userRepository.findByEmailIgnoreCase("TESTUSER@EXAMPLE.COM");
        Optional<User> result3 = userRepository.findByEmailIgnoreCase("TestUser@Example.COM");

        // Then
        assertThat(result1).isPresent();
        assertThat(result1.get().getEmail()).isEqualTo("TestUser@Example.COM");

        assertThat(result2).isPresent();
        assertThat(result2.get().getId()).isEqualTo(result1.get().getId());

        assertThat(result3).isPresent();
        assertThat(result3.get().getId()).isEqualTo(result1.get().getId());
    }

    @Test
    @Order(6)
    @DisplayName("✅ ค้นหา User ด้วย mixed case username ที่บันทึกไว้")
    void testFindByUsernameIgnoreCase_MixedCaseStored() {
        // Given
        userRepository.save(testUser3); // Username: TestUser

        // When
        Optional<User> result1 = userRepository.findByUsernameIgnoreCase("testuser");
        Optional<User> result2 = userRepository.findByUsernameIgnoreCase("TESTUSER");
        Optional<User> result3 = userRepository.findByUsernameIgnoreCase("TestUser");

        // Then
        assertThat(result1).isPresent();
        assertThat(result1.get().getUsername()).isEqualTo("TestUser");

        assertThat(result2).isPresent();
        assertThat(result2.get().getId()).isEqualTo(result1.get().getId());

        assertThat(result3).isPresent();
        assertThat(result3.get().getId()).isEqualTo(result1.get().getId());
    }

    @Test
    @Order(7)
    @DisplayName("✅ ตรวจสอบ User fields ครบถ้วน")
    void testFindByEmail_VerifyAllFields() {
        // Given
        User savedUser = userRepository.save(testUser1);

        // When
        Optional<User> result = userRepository.findByEmailIgnoreCase("admin@example.com");

        // Then
        assertThat(result).isPresent();
        User retrievedUser = result.get();

        assertThat(retrievedUser.getId()).isEqualTo(savedUser.getId());
        assertThat(retrievedUser.getUsername()).isEqualTo("admin");
        assertThat(retrievedUser.getEmail()).isEqualTo("admin@example.com");
        assertThat(retrievedUser.getPassword()).isEqualTo("$2a$10$hashedPassword1");
        assertThat(retrievedUser.getRole()).isEqualTo("ADMIN");
        assertThat(retrievedUser.getFirstName()).isEqualTo("John");
        assertThat(retrievedUser.getLastName()).isEqualTo("Doe");
        assertThat(retrievedUser.getPhoneNumber()).isEqualTo("0812345678");
        assertThat(retrievedUser.getIdCardPassport()).isEqualTo("1234567890123");
    }

    @Test
    @Order(8)
    @DisplayName("✅ ทดสอบ unique constraint สำหรับ email")
    void testUniqueEmailConstraint() {
        // Given
        userRepository.save(testUser1);

        // When
        User duplicateEmailUser = new User();
        duplicateEmailUser.setUsername("another_user");
        duplicateEmailUser.setEmail("admin@example.com"); // Duplicate email
        duplicateEmailUser.setPassword("$2a$10$hashedPassword");
        duplicateEmailUser.setRole("USER");

        // Then
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(duplicateEmailUser);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Order(9)
    @DisplayName("✅ ทดสอบ unique constraint สำหรับ username")
    void testUniqueUsernameConstraint() {
        // Given
        userRepository.save(testUser1);

        // When
        User duplicateUsernameUser = new User();
        duplicateUsernameUser.setUsername("admin"); // Duplicate username
        duplicateUsernameUser.setEmail("another@example.com");
        duplicateUsernameUser.setPassword("$2a$10$hashedPassword");
        duplicateUsernameUser.setRole("USER");

        // Then
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(duplicateUsernameUser);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Order(10)
    @DisplayName("✅ ทดสอบ nullable constraints")
    void testNullableConstraints() {
        // When - Missing username
        User userWithoutUsername = new User();
        userWithoutUsername.setEmail("test@example.com");
        userWithoutUsername.setPassword("$2a$10$hashedPassword");
        userWithoutUsername.setRole("USER");

        // Then
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(userWithoutUsername);
        }).isInstanceOf(DataIntegrityViolationException.class);

        // When - Missing email
        User userWithoutEmail = new User();
        userWithoutEmail.setUsername("testuser");
        userWithoutEmail.setPassword("$2a$10$hashedPassword");
        userWithoutEmail.setRole("USER");

        // Then
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(userWithoutEmail);
        }).isInstanceOf(DataIntegrityViolationException.class);

        // When - Missing password
        User userWithoutPassword = new User();
        userWithoutPassword.setUsername("testuser");
        userWithoutPassword.setEmail("test@example.com");
        userWithoutPassword.setRole("USER");

        // Then
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(userWithoutPassword);
        }).isInstanceOf(DataIntegrityViolationException.class);

        // When - Missing role
        User userWithoutRole = new User();
        userWithoutRole.setUsername("testuser");
        userWithoutRole.setEmail("test@example.com");
        userWithoutRole.setPassword("$2a$10$hashedPassword");

        // Then
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(userWithoutRole);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Order(11)
    @DisplayName("✅ ทดสอบ User with optional fields เป็น null")
    void testUserWithNullOptionalFields() {
        // Given
        User userWithMinimalInfo = new User();
        userWithMinimalInfo.setUsername("minimaluser");
        userWithMinimalInfo.setEmail("minimal@example.com");
        userWithMinimalInfo.setPassword("$2a$10$hashedPassword");
        userWithMinimalInfo.setRole("USER");
        // firstName, lastName, phoneNumber, idCardPassport are NULL

        // When
        User savedUser = userRepository.save(userWithMinimalInfo);

        // Then
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getFirstName()).isNull();
        assertThat(savedUser.getLastName()).isNull();
        assertThat(savedUser.getPhoneNumber()).isNull();
        assertThat(savedUser.getIdCardPassport()).isNull();

        // Verify retrieval
        Optional<User> retrieved = userRepository.findByEmailIgnoreCase("minimal@example.com");
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getFirstName()).isNull();
        assertThat(retrieved.get().getLastName()).isNull();
    }

    @Test
    @Order(12)
    @DisplayName("✅ ทดสอบหลาย Users ในระบบ")
    void testMultipleUsers() {
        // Given
        userRepository.save(testUser1);
        userRepository.save(testUser2);
        userRepository.save(testUser3);

        // When
        Optional<User> admin = userRepository.findByUsernameIgnoreCase("admin");
        Optional<User> user1 = userRepository.findByUsernameIgnoreCase("user1");
        Optional<User> testUser = userRepository.findByUsernameIgnoreCase("testuser");

        // Then
        assertThat(admin).isPresent();
        assertThat(admin.get().getRole()).isEqualTo("ADMIN");

        assertThat(user1).isPresent();
        assertThat(user1.get().getRole()).isEqualTo("USER");

        assertThat(testUser).isPresent();
        assertThat(testUser.get().getEmail()).isEqualTo("TestUser@Example.COM");

        assertThat(userRepository.findAll()).hasSize(3);
    }

    @Test
    @Order(13)
    @DisplayName("✅ ทดสอบการอัปเดต User")
    void testUpdateUser() {
        // Given
        User savedUser = userRepository.save(testUser1);
        Long userId = savedUser.getId();

        // When
        savedUser.setFirstName("UpdatedJohn");
        savedUser.setLastName("UpdatedDoe");
        savedUser.setPhoneNumber("0999999999");
        userRepository.save(savedUser);

        // Then
        Optional<User> updated = userRepository.findById(userId);
        assertThat(updated).isPresent();
        assertThat(updated.get().getFirstName()).isEqualTo("UpdatedJohn");
        assertThat(updated.get().getLastName()).isEqualTo("UpdatedDoe");
        assertThat(updated.get().getPhoneNumber()).isEqualTo("0999999999");
        assertThat(updated.get().getUsername()).isEqualTo("admin"); // Unchanged
    }

    @Test
    @Order(14)
    @DisplayName("✅ ทดสอบการลบ User")
    void testDeleteUser() {
        // Given
        User savedUser = userRepository.save(testUser1);
        Long userId = savedUser.getId();

        assertThat(userRepository.findById(userId)).isPresent();

        // When
        userRepository.delete(savedUser);
        userRepository.flush();

        // Then
        assertThat(userRepository.findById(userId)).isEmpty();
        assertThat(userRepository.findByEmailIgnoreCase("admin@example.com")).isEmpty();
        assertThat(userRepository.findByUsernameIgnoreCase("admin")).isEmpty();
    }

    @Test
    @Order(15)
    @DisplayName("✅ ทดสอบ different roles")
    void testDifferentRoles() {
        // Given
        testUser1.setRole("ADMIN");
        testUser2.setRole("USER");

        User moderator = new User();
        moderator.setUsername("moderator");
        moderator.setEmail("mod@example.com");
        moderator.setPassword("$2a$10$hashedPassword");
        moderator.setRole("MODERATOR");

        userRepository.save(testUser1);
        userRepository.save(testUser2);
        userRepository.save(moderator);

        // When
        Optional<User> admin = userRepository.findByUsernameIgnoreCase("admin");
        Optional<User> user = userRepository.findByUsernameIgnoreCase("user1");
        Optional<User> mod = userRepository.findByUsernameIgnoreCase("moderator");

        // Then
        assertThat(admin.get().getRole()).isEqualTo("ADMIN");
        assertThat(user.get().getRole()).isEqualTo("USER");
        assertThat(mod.get().getRole()).isEqualTo("MODERATOR");
    }
}