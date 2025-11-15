package com.example.devops.repo;

import com.example.devops.model.SeatZones;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SeatZonesRepositoryIntegrationTest {

    @Autowired
    SeatZonesRepository seatZonesRepository;

    /** 🐳 PostgreSQL Testcontainer */
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    /** 🎯 Helper function สร้าง seed test data */
    private SeatZones createZone(Long eventId, String name, Integer order) {
        SeatZones z = new SeatZones();
        z.setEventId(eventId);
        z.setZoneCode(name.substring(0, 1).toUpperCase());
        z.setZoneName(name);
        z.setDescription(name + "_desc");
        z.setRowStart(1);
        z.setRowEnd(10);
        z.setPrice(new BigDecimal("100.00"));
        z.setSortOrder(order);
        z.setIsActive(true);
        return seatZonesRepository.save(z);
    }

    @Test
    void testFindByEventIdOrderBySortOrderAsc() {

        createZone(1L, "VIP", 2);
        createZone(1L, "A", 1);
        createZone(1L, "B", 3);

        List<SeatZones> list = seatZonesRepository.findByEventIdOrderBySortOrderAsc(1L);

        assertThat(list).hasSize(3);
        assertThat(list.get(0).getZoneName()).isEqualTo("A");
        assertThat(list.get(1).getZoneName()).isEqualTo("VIP");
    }

    @Test
    void testFindByZoneId() {
        SeatZones zone = createZone(5L, "C", 1);

        var found = seatZonesRepository.findByZoneId(zone.getZoneId());

        assertThat(found).isPresent();
        assertThat(found.get().getZoneName()).isEqualTo("C");
    }

    @Test
    void testExistsByEventIdAndZoneNameIgnoreCase() {
        createZone(10L, "VIP", 1);

        boolean exists = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(10L, "vip");
        boolean notExists = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(10L, "other");

        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    void testDeleteByEventId() {
        createZone(99L, "X", 1);
        createZone(99L, "Y", 2);

        seatZonesRepository.deleteByEventId(99L);

        List<SeatZones> list = seatZonesRepository.findByEventIdOrderBySortOrderAsc(99L);
        assertThat(list).isEmpty();
    }
}
