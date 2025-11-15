package com.example.devops.repo;

import com.example.devops.model.ZoneTicketTypes;
import com.example.devops.model.ZoneTicketTypesId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ZoneTicketTypesRepositoryIntegrationTest {

    @Autowired
    ZoneTicketTypesRepository repo;

    /** -----------------------------
     *   Testcontainers: Postgres
     * ----------------------------- */
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

    /** -----------------------------
     *   Helper: Insert test data
     * ----------------------------- */
    private void insertZoneTicket(Long zoneId, Long ttId) {

        ZoneTicketTypesId pk = new ZoneTicketTypesId(zoneId, ttId);
        ZoneTicketTypes ztt = new ZoneTicketTypes();

        try {
            Field f = ZoneTicketTypes.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(ztt, pk);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        repo.save(ztt);
    }

    /** -----------------------------
     *   TEST CASE 1: findByZoneId
     * ----------------------------- */
    @Test
    void testFindByZoneId() {
        insertZoneTicket(1L, 100L);
        insertZoneTicket(1L, 101L);

        List<ZoneTicketTypes> list = repo.findByZoneId(1L);

        assertThat(list).hasSize(2);
    }

    /** -----------------------------
     *   TEST CASE 2: findTicketTypeIdsByZoneId
     * ----------------------------- */
    @Test
    void testFindTicketTypeIds() {
        insertZoneTicket(2L, 200L);
        insertZoneTicket(2L, 201L);

        List<Long> ids = repo.findTicketTypeIdsByZoneId(2L);

        assertThat(ids).containsExactly(200L, 201L);
    }

    /** -----------------------------
     *   TEST CASE 3: deleteByZoneId
     * ----------------------------- */
    @Test
    void testDeleteByZoneId() {
        insertZoneTicket(3L, 300L);

        repo.deleteByZoneId(3L);

        List<ZoneTicketTypes> after = repo.findByZoneId(3L);
        assertThat(after).isEmpty();
    }
}
