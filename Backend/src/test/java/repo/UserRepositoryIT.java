package com.example.devops.repo;

import com.example.devops.model.User;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryIntegrationTest {

    @Autowired
    UserRepository userRepository;

    /** 🐳 PostgreSQL Testcontainer */
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    /** 📌 Spring ให้ใช้ datasource จาก container */
    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    /** 🎯 helper function สำหรับสร้าง user test */
    private User createUser(String username, String email) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword("hashed_pw");
        u.setRole("USER");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setPhoneNumber("0000000000");
        u.setIdCardPassport("A1234567");
        return userRepository.save(u);
    }

    @Test
    void testFindByEmailIgnoreCase() {
        createUser("testuser", "test@example.com");

        Optional<User> found = userRepository.findByEmailIgnoreCase("TEST@EXAMPLE.COM");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void testFindByUsernameIgnoreCase() {
        createUser("john", "john@example.com");

        Optional<User> found = userRepository.findByUsernameIgnoreCase("JOHN");

        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("john");
    }

    @Test
    void testNotFoundCases() {
        Optional<User> u1 = userRepository.findByEmailIgnoreCase("none@example.com");
        Optional<User> u2 = userRepository.findByUsernameIgnoreCase("notexist");

        assertThat(u1).isNotPresent();
        assertThat(u2).isNotPresent();
    }
}
