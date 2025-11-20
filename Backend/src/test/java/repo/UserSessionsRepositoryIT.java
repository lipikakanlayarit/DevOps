package com.example.devops.repo;

import com.example.devops.model.UserSessions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserSessionsRepositoryIT {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserSessionsRepository userSessionsRepository;

    private UserSessions testSession;

    @BeforeEach
    void setUp() throws Exception {
        userSessionsRepository.deleteAll();

        testSession = createUserSession(
                "session-123",
                1L,
                Instant.now(),
                Instant.now().plus(1, ChronoUnit.HOURS),
                true,
                Instant.now(),
                "192.168.1.1",
                "Mozilla/5.0"
        );
    }

    @Test
    void shouldSaveUserSession() throws Exception {
        // When
        UserSessions saved = userSessionsRepository.save(testSession);
        entityManager.flush();
        entityManager.clear();

        // Then
        assertThat(saved).isNotNull();
        assertThat(getFieldValue(saved, "session_id")).isEqualTo("session-123");
        assertThat(getFieldValue(saved, "user_id")).isEqualTo(1L);
        assertThat(getFieldValue(saved, "is_active")).isEqualTo(true);
    }

    @Test
    void shouldReturnEmptyWhenSessionNotFound() {
        // When
        Optional<UserSessions> found = userSessionsRepository.findById(999L);

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void shouldFindAllUserSessions() throws Exception {
        // Given
        UserSessions session2 = createUserSession(
                "session-456",
                2L,
                Instant.now(),
                Instant.now().plus(2, ChronoUnit.HOURS),
                true,
                Instant.now(),
                "192.168.1.2",
                "Chrome/120.0"
        );

        entityManager.persist(testSession);
        entityManager.persist(session2);
        entityManager.flush();

        // When
        List<UserSessions> sessions = userSessionsRepository.findAll();

        // Then
        assertThat(sessions).hasSize(2);
        assertThat(getFieldValue(sessions.get(0), "session_id")).isIn("session-123", "session-456");
        assertThat(getFieldValue(sessions.get(1), "session_id")).isIn("session-123", "session-456");
    }


    @Test
    void shouldDeleteUserSession() {
        // Given
        entityManager.persistAndFlush(testSession);
        Long sessionId = 1L;

        // When
        userSessionsRepository.deleteById(sessionId);
        entityManager.flush();

        // Then
        Optional<UserSessions> deleted = userSessionsRepository.findById(sessionId);
        assertThat(deleted).isEmpty();
    }

    @Test
    void shouldCountUserSessions() throws Exception {
        // Given
        UserSessions session2 = createUserSession(
                "session-789",
                3L,
                Instant.now(),
                Instant.now().plus(3, ChronoUnit.HOURS),
                false,
                Instant.now(),
                "192.168.1.3",
                "Safari/17.0"
        );

        entityManager.persist(testSession);
        entityManager.persist(session2);
        entityManager.flush();

        // When
        long count = userSessionsRepository.count();

        // Then
        assertThat(count).isEqualTo(2);
    }

    @Test
    void shouldReturnFalseWhenSessionDoesNotExist() {
        // When
        boolean exists = userSessionsRepository.existsById(999L);

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void shouldSaveMultipleSessionsForSameUser() throws Exception {
        // Given
        UserSessions session1 = createUserSession(
                "session-user1-1",
                1L,
                Instant.now(),
                Instant.now().plus(1, ChronoUnit.HOURS),
                true,
                Instant.now(),
                "192.168.1.1",
                "Chrome/120.0"
        );

        UserSessions session2 = createUserSession(
                "session-user1-2",
                1L,
                Instant.now(),
                Instant.now().plus(1, ChronoUnit.HOURS),
                true,
                Instant.now(),
                "192.168.1.2",
                "Firefox/121.0"
        );

        // When
        entityManager.persist(session1);
        entityManager.persist(session2);
        entityManager.flush();

        // Then
        List<UserSessions> allSessions = userSessionsRepository.findAll();
        assertThat(allSessions).hasSize(2);
        assertThat(getFieldValue(allSessions.get(0), "user_id")).isEqualTo(1L);
        assertThat(getFieldValue(allSessions.get(1), "user_id")).isEqualTo(1L);
    }


    // Helper methods using Reflection
    private UserSessions createUserSession(
            String sessionId,
            Long userId,
            Instant createdAt,
            Instant expiresAt,
            Boolean isActive,
            Instant lastActivity,
            String ipAddress,
            String userAgent
    ) throws Exception {
        UserSessions session = new UserSessions();
        setFieldValue(session, "session_id", sessionId);
        setFieldValue(session, "user_id", userId);
        setFieldValue(session, "created_at", createdAt);
        setFieldValue(session, "expires_at", expiresAt);
        setFieldValue(session, "is_active", isActive);
        setFieldValue(session, "last_activity", lastActivity);
        setFieldValue(session, "ip_address", ipAddress);
        setFieldValue(session, "user_agent", userAgent);
        return session;
    }

    private void setFieldValue(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    private Object getFieldValue(Object obj, String fieldName) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        return field.get(obj);
    }
}