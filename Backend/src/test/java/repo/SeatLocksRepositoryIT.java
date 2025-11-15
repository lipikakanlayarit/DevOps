package com.example.devops.repo;

import com.example.devops.model.SeatLocks;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class SeatLocksRepositoryIT {

    @Autowired
    private SeatLocksRepository repo;

    /** Utility: set field แบบไม่ต้องแก้ model */
    private void set(Object obj, String field, Object value) {
        try {
            Field f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(obj, value);
        } catch (Exception ignored) {}
    }

    @Test
    void testSaveAndFind() {
        SeatLocks lock = new SeatLocks();
        set(lock, "seatId", 10L);
        set(lock, "eventId", 1L);
        set(lock, "userId", 99L);
        set(lock, "startedAt", Instant.now());
        set(lock, "expiresAt", Instant.now().plusSeconds(300));
        set(lock, "status", "LOCKED");

        repo.saveAndFlush(lock);

        List<SeatLocks> list = repo.findAll();
        assertThat(list).isNotEmpty();
        assertThat(list.get(0).getSeatId()).isEqualTo(10L);
        assertThat(list.get(0).getStatus()).isEqualTo("LOCKED");
    }

    @Test
    void testFindById() {
        SeatLocks lock = new SeatLocks();
        set(lock, "seatId", 20L);
        set(lock, "eventId", 2L);

        SeatLocks saved = repo.saveAndFlush(lock);
        Long id = saved.getLockId();

        SeatLocks found = repo.findById(id).orElse(null);

        assertThat(found).isNotNull();
        assertThat(found.getSeatId()).isEqualTo(20L);
    }

    @Test
    void testDelete() {
        SeatLocks lock = new SeatLocks();
        set(lock, "seatId", 33L);

        SeatLocks saved = repo.saveAndFlush(lock);
        Long id = saved.getLockId();

        repo.deleteById(id);

        assertThat(repo.findById(id)).isEmpty();
    }

    @Test
    void testCount() {
        SeatLocks l1 = new SeatLocks();
        SeatLocks l2 = new SeatLocks();

        set(l1, "seatId", 5L);
        set(l2, "seatId", 6L);

        repo.saveAndFlush(l1);
        repo.saveAndFlush(l2);

        assertThat(repo.count()).isGreaterThanOrEqualTo(2);
    }
}
