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
public class SeatLocksRepositoryIT {

    @Autowired
    SeatLocksRepository repo;

    @Test
void testFindAll() {
        List<SeatLocks> all = repo.findAll();
        assertThat(all).hasSize(2);
}

    @Test
    void testSaveNewLock() {
        SeatLocks lock = new SeatLocks();
        lock.setSeatId(20L);
        lock.setEventId(200L);
        lock.setUserId(77L);
        lock.setStartedAt(Instant.now());
        lock.setExpiresAt(Instant.now().plusSeconds(300));
        lock.setStatus("LOCKED");

        SeatLocks saved = repo.save(lock);

        assertThat(saved.getLockId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo("LOCKED");
}

    @Test
    void testFindById() {
        SeatLocks l = repo.findById(1L).orElse(null);
        assertThat(l).isNotNull();
        assertThat(l.getSeatId()).isEqualTo(10L);
}

    @Test
    void testDelete() {
        repo.deleteById(1L);
        assertThat(repo.findById(1L)).isEmpty();
}
}
