package com.example.devops.repo;

import com.example.devops.model.Seats;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SeatsRepositoryIntegrationTest {

    @Autowired
    SeatsRepository seatsRepository;

    /** ⭐ Testcontainers Postgres */
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    /** ⭐ Spring Boot เชื่อม DB เข้ากับ Container */
    @DynamicPropertySource
    static void configureProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }

    @BeforeEach
    void setup() {
        // เพื่อความปลอดภัย: ถ้าตาราง seats ไม่มีข้อมูล → ให้หยุดก่อน
        List<Seats> all = seatsRepository.findAll();
        System.out.println("DEBUG -> loaded seats count = " + all.size());
    }

    @Test
    @DisplayName("findSeatIdByZoneRowCol: ค้นหาตาม zone + rowNumber + seatNo")
    void testFindSeatIdByZoneRowCol() {
        Long seatId = seatsRepository.findSeatIdByZoneRowCol(1L, 1, 1);
        assertThat(seatId).isNotNull();
    }

    @Test
    @DisplayName("findMaxSeatsPerRowByZoneId: ควรคืนค่า max seat number")
    void testFindMaxSeatsPerRowByZoneId() {
        Integer max = seatsRepository.findMaxSeatsPerRowByZoneId(1L);
        assertThat(max).isNotNull();
        assertThat(max).isGreaterThan(0);
    }

    @Test
    @DisplayName("findAllSeatsByEventId: คืนรายการ seats ทั้งหมดตาม event")
    void testFindAllSeatsByEventId() {
        List<Seats> seats = seatsRepository.findAllSeatsByEventId(1L);

        assertThat(seats).isNotNull();
        assertThat(seats.size()).isGreaterThan(0);
    }

    @Test
    @DisplayName("findSeatIdFlexible: สามารถค้นหาแบบ flexible ได้")
    void testFindSeatIdFlexible() {
        Long seatId = seatsRepository.findSeatIdFlexible(
                1L,      // zoneId
                null,    // rowId
                "A",     // rowLabel
                1        // seatNo
        );

        assertThat(seatId).isNotNull();
        assertThat(seatId).isGreaterThan(0);
    }
}
