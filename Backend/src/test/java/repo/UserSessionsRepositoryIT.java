package com.example.devops.repo;

import com.example.devops.model.UserSessions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserSessionsRepositoryIntegrationTest {

    @Autowired
    UserSessionsRepository repo;

    /** ------------------------------
     *  Testcontainers: Postgres
     * ------------------------------ */
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry reg) {
        reg.add("spring.datasource.url", postgres::getJdbcUrl);
        reg.add("spring.datasource.username", postgres::getUsername);
        reg.add("spring.datasource.password", postgres::getPassword);

        reg.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    /** ------------------------------
     *  Helper สร้าง Session
     * ------------------------------ */
    private UserSessions createSession(Long id) {
        UserSessions s = new UserSessions();

        // เนื่องจาก model ไม่มี setter ให้ใช้ Reflection ช่วย
        try {
            var f1 = UserSessions.class.getDeclaredField("session_id");
            f1.setAccessible(true);
            f1.set(s, String.valueOf(id));

            var f2 = UserSessions.class.getDeclaredField("user_id");
            f2.setAccessible(true);
            f2.set(s, 10L);

            var f3 = UserSessions.class.getDeclaredField("created_at");
            f3.setAccessible(true);
            f3.set(s, Instant.now());

            var f4 = UserSessions.class.getDeclaredField("expires_at");
            f4.setAccessible(true);
            f4.set(s, Instant.now().plusSeconds(3600));

            var f5 = UserSessions.class.getDeclaredField("is_active");
            f5.setAccessible(true);
            f5.set(s, true);

            var f6 = UserSessions.class.getDeclaredField("last_activity");
            f6.setAccessible(true);
            f6.set(s, Instant.now());

            var f7 = UserSessions.class.getDeclaredField("ip_address");
            f7.setAccessible(true);
            f7.set(s, "127.0.0.1");

            var f8 = UserSessions.class.getDeclaredField("user_agent");
            f8.setAccessible(true);
            f8.set(s, "JUnit");

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return repo.save(s);
    }

    /** ------------------------------
     *  TEST CASE 1: Save & Find
     * ------------------------------ */
    @Test
    void testSaveAndFind() {

        createSession(111L);

        Optional<UserSessions> found = repo.findById(111L);

        assertThat(found).isPresent();
        assertThat(found.get()).isNotNull();
    }

    /** ------------------------------
     *  TEST CASE 2: Delete
     * ------------------------------ */
    @Test
    void testDelete() {

        createSession(222L);

        repo.deleteById(222L);

        Optional<UserSessions> after = repo.findById(222L);

        assertThat(after).isNotPresent();
    }
}
