package com.example.devops.repo;

import com.example.devops.model.OrganizerSessions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class OrganizerSessionsRepositoryIT {

    @Autowired
    private OrganizerSessionsRepository repo;

    /** write field without setter */
    private void set(Object obj, String field, Object value) {
        try {
            Field f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(obj, value);
        } catch (Exception ignored) {}
    }

    /** read field without getter */
    private Object get(Object obj, String field) {
        try {
            Field f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            return f.get(obj);
        } catch (Exception e) {
            return null;
        }
    }

    @Test
    void testSaveAndFindAll() {

        OrganizerSessions s = new OrganizerSessions();
        set(s, "session_id", "ABC123");
        set(s, "organizer_id", 10L);
        set(s, "created_at", Instant.now());
        set(s, "expires_at", Instant.now().plusSeconds(3600));
        set(s, "is_active", true);
        set(s, "last_activity", Instant.now());
        set(s, "ip_address", "127.0.0.1");
        set(s, "user_agent", "JUnit Test");

        repo.save(s);

        List<OrganizerSessions> list = repo.findAll();
        assertThat(list).isNotEmpty();

        OrganizerSessions found = list.get(0);

        assertThat(get(found, "session_id")).isEqualTo("ABC123");
        assertThat(get(found, "organizer_id")).isEqualTo(10L);
        assertThat(get(found, "is_active")).isEqualTo(true);
        assertThat(get(found, "ip_address")).isEqualTo("127.0.0.1");
    }

    @Test
    void testCount() {
        long before = repo.count();

        OrganizerSessions s = new OrganizerSessions();
        set(s, "session_id", "XYZ999");
        repo.save(s);

        long after = repo.count();

        assertThat(after).isGreaterThan(before);
    }

    @Test
    void testEmptyWhenNoData() {
        repo.deleteAll();
        assertThat(repo.findAll()).isEmpty();
    }
}
