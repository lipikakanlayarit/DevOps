package com.example.devops.repo;

import com.example.devops.model.OrganizerSessions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class OrganizerSessionsRepositoryIT {

    @Autowired
    private OrganizerSessionsRepository repository;

    @Test
    @DisplayName("save & load OrganizerSessions ได้จริงบน DB (H2)")
    void saveAndLoadOrganizerSession() {
        OrganizerSessions session = new OrganizerSessions();

        // ใช้ Reflection เซ็ตฟิลด์ แทนการไปแก้ entity เดิม
        ReflectionTestUtils.setField(session, "session_id", "sess-123");
        ReflectionTestUtils.setField(session, "organizer_id", 99L);

        Instant now = Instant.now();
        ReflectionTestUtils.setField(session, "created_at", now);
        ReflectionTestUtils.setField(session, "expires_at", now.plusSeconds(3600));
        ReflectionTestUtils.setField(session, "is_active", true);
        ReflectionTestUtils.setField(session, "last_activity", now);
        ReflectionTestUtils.setField(session, "ip_address", "127.0.0.1");
        ReflectionTestUtils.setField(session, "user_agent", "JUnit-IT");

        // บันทึกลง H2
        repository.saveAndFlush(session);

        // ดึงกลับมาจาก DB
        List<OrganizerSessions> all = repository.findAll();
        assertThat(all).hasSize(1);

        OrganizerSessions saved = all.get(0);

        // ใช้ Reflection อ่านค่ากลับมาเช็ค (เพราะไม่มี getter)
        assertThat(ReflectionTestUtils.getField(saved, "session_id"))
                .isEqualTo("sess-123");
        assertThat(ReflectionTestUtils.getField(saved, "organizer_id"))
                .isEqualTo(99L);
        assertThat(ReflectionTestUtils.getField(saved, "is_active"))
                .isEqualTo(true);
    }
}
