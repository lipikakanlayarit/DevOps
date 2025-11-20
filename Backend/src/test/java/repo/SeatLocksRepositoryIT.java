package com.example.devops.repo;

import com.example.devops.model.SeatLocks;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource("classpath:application-test.properties")
@Sql(scripts = {
        "/schema_seat_locks_test.sql",
        "/data_seat_locks_test.sql"
})
class SeatLocksRepositoryIT {

    @Autowired
    SeatLocksRepository repo;

    @Test
    void testFindAll() {
        List<SeatLocks> all = repo.findAll();
        assertThat(all).hasSize(2);
    }

    @Test
    void testFindById() {
        SeatLocks lock = repo.findById(1L).orElse(null);
        assertThat(lock).isNotNull();
        assertThat(lock.getStatus()).isEqualTo("LOCKED");
    }

    @Test
    void testSaveNewLock() {
        SeatLocks lock = new SeatLocks();
        lock.setSeatId(50L);
        lock.setEventId(200L);
        lock.setUserId(999L);
        lock.setStartedAt(Instant.now());
        lock.setExpiresAt(Instant.now().plusSeconds(600));
        lock.setStatus("LOCKED");

        SeatLocks saved = repo.save(lock);

        assertThat(saved.getLockId()).isNotNull();
        assertThat(repo.findAll()).hasSize(3);
    }

    @Test
    void testDelete() {
        repo.deleteById(1L);
        assertThat(repo.findById(1L)).isEmpty();
    }
}

