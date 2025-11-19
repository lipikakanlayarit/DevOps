package com.example.devops.repo;

import com.example.devops.model.TicketTypes;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TicketTypesRepositoryIntegrationTest {

    @Autowired
    TicketTypesRepository ticketTypesRepository;

    /** 🐳 PostgreSQL Testcontainer */
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    /** 🎯 Helper method สร้าง ticket type */
    private TicketTypes createTicket(Long eventId, String name, int qty) {
        TicketTypes t = new TicketTypes();
        t.setEventId(eventId);
        t.setTypeName(name);
        t.setDescription(name + "_desc");
        t.setPrice(new BigDecimal("500.00"));
        t.setQuantityAvailable(qty);
        t.setQuantitySold(0);
        t.setSaleStartDatetime(Instant.now());
        t.setSaleEndDatetime(Instant.now().plusSeconds(3600));
        t.setIsActive(true);
        t.setMinPerOrder(1);
        t.setMaxPerOrder(5);
        return ticketTypesRepository.save(t);
    }

    @Test
    void testFindByEventId() {
        createTicket(1L, "VIP", 100);
        createTicket(1L, "Regular", 200);
        createTicket(2L, "Other", 50);   // ไม่ควรเจอ

        List<TicketTypes> list = ticketTypesRepository.findByEventId(1L);

        assertThat(list).hasSize(2);
        assertThat(list.get(0).getTicketTypeId()).isLessThan(list.get(1).getTicketTypeId());
    }

    @Test
    void testDeleteByEventId() {
        createTicket(5L, "A", 100);
        createTicket(5L, "B", 150);

        ticketTypesRepository.deleteByEventId(5L);

        List<TicketTypes> list = ticketTypesRepository.findByEventId(5L);

        assertThat(list).isEmpty();
    }
}
