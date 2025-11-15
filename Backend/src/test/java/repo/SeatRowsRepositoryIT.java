package com.example.devops.repo;

import com.example.devops.model.SeatRows;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Transactional
class SeatRowsRepositoryIT {

    @Autowired
    private SeatRowsRepository seatRowsRepository;

    @Autowired
    private SeatZonesRepository seatZonesRepository; // ใช้สำหรับ setup zone

    // --------------------------------------------------------
    // 🟦 test 1: countByZoneId()
    // --------------------------------------------------------
    @Test
    void testCountByZoneId() {
        // zone 1 มีข้อมูลจาก schema.sql อยู่แล้ว
        int count = seatRowsRepository.countByZoneId(1L);

        assertThat(count)
                .as("zone 1 ต้องมี seat rows อย่างน้อย 1 แถวจาก schema.sql")
                .isGreaterThan(0);
    }

    // --------------------------------------------------------
    // 🟩 test 2: findAllRowsByEventId()
    // --------------------------------------------------------
    @Test
    void testFindAllRowsByEventId() {
        List<SeatRows> rows = seatRowsRepository.findAllRowsByEventId(1L);

        assertThat(rows)
                .as("event_id = 1 ต้องมี seat rows จาก schema.sql")
                .isNotEmpty();

        // ต้องเรียงจาก sort_order ตาม schema.sql
        assertThat(rows.get(0).getSortOrder()).isEqualTo(1);
        assertThat(rows.get(1).getSortOrder()).isEqualTo(2);
    }

    // --------------------------------------------------------
    // 🟥 test 3: deleteByEventId()
    // --------------------------------------------------------
    @Test
    void testDeleteByEventId() {

        // event_id = 99 มี zone_id = 2 และ seat_rows อยู่ใน schema.sql
        int before = seatRowsRepository.countByZoneId(2L);
        assertThat(before).isGreaterThan(0); // มีอยู่จริง

        // ลบทั้งหมดของ event 99
        seatRowsRepository.deleteByEventId(99L);

        int after = seatRowsRepository.countByZoneId(2L);
        assertThat(after).isZero();
    }
}
