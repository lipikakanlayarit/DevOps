package com.example.devops.repo;

import com.example.devops.model.SeatZones;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SeatZonesRepositoryIntegrationTest {

    @Autowired
    private SeatZonesRepository seatZonesRepository;

    private Long testEventId1;
    private Long testEventId2;
    private SeatZones zone1;
    private SeatZones zone2;
    private SeatZones zone3;
    private SeatZones zoneWithNullSort;

    @BeforeEach
    void setUp() {
        seatZonesRepository.deleteAll();

        testEventId1 = 100L;
        testEventId2 = 200L;

        // Zone 1: VIP Zone
        zone1 = new SeatZones();
        zone1.setEventId(testEventId1);
        zone1.setZoneCode("VIP");
        zone1.setZoneName("VIP Zone");
        zone1.setDescription("VIP");
        zone1.setRowStart(1);
        zone1.setRowEnd(10);
        zone1.setPrice(new BigDecimal("5000.00"));
        zone1.setSortOrder(1);
        zone1.setIsActive(true);
        zone1.setCreatedAt(Instant.now());
        zone1.setUpdatedAt(Instant.now());

        // Zone 2: Regular Zone
        zone2 = new SeatZones();
        zone2.setEventId(testEventId1);
        zone2.setZoneCode("REG");
        zone2.setZoneName("Regular Zone");
        zone2.setDescription("REGULAR");
        zone2.setRowStart(11);
        zone2.setRowEnd(20);
        zone2.setPrice(new BigDecimal("3000.00"));
        zone2.setSortOrder(2);
        zone2.setIsActive(true);
        zone2.setCreatedAt(Instant.now());
        zone2.setUpdatedAt(Instant.now());

        // Zone 3: Standing Zone (for different event)
        zone3 = new SeatZones();
        zone3.setEventId(testEventId2);
        zone3.setZoneCode("STD");
        zone3.setZoneName("Standing Zone");
        zone3.setDescription("STANDING");
        zone3.setRowStart(1);
        zone3.setRowEnd(5);
        zone3.setPrice(new BigDecimal("1500.00"));
        zone3.setSortOrder(1);
        zone3.setIsActive(true);
        zone3.setCreatedAt(Instant.now());
        zone3.setUpdatedAt(Instant.now());

        // Zone with NULL sort_order
        zoneWithNullSort = new SeatZones();
        zoneWithNullSort.setEventId(testEventId1);
        zoneWithNullSort.setZoneCode("BACK");
        zoneWithNullSort.setZoneName("Back Zone");
        zoneWithNullSort.setDescription("BACK");
        zoneWithNullSort.setRowStart(21);
        zoneWithNullSort.setRowEnd(30);
        zoneWithNullSort.setPrice(new BigDecimal("1000.00"));
        zoneWithNullSort.setSortOrder(null); // NULL sort_order
        zoneWithNullSort.setIsActive(true);
        zoneWithNullSort.setCreatedAt(Instant.now());
        zoneWithNullSort.setUpdatedAt(Instant.now());
    }

    @Test
    @Order(1)
    @DisplayName("✅ ดึงโซนทั้งหมดของอีเวนต์ เรียงตาม sort_order (ค่า NULL จะอยู่ท้าย)")
    void testFindByEventIdOrderBySortOrderAsc() {
        // Given
        seatZonesRepository.save(zone1);
        seatZonesRepository.save(zone2);
        seatZonesRepository.save(zoneWithNullSort);
        seatZonesRepository.save(zone3); // Different event

        // When
        List<SeatZones> zones = seatZonesRepository.findByEventIdOrderBySortOrderAsc(testEventId1);

        // Then
        assertThat(zones).hasSize(3);
        assertThat(zones.get(0).getZoneName()).isEqualTo("VIP Zone");
        assertThat(zones.get(0).getSortOrder()).isEqualTo(1);
        assertThat(zones.get(1).getZoneName()).isEqualTo("Regular Zone");
        assertThat(zones.get(1).getSortOrder()).isEqualTo(2);
        assertThat(zones.get(2).getZoneName()).isEqualTo("Back Zone");
        assertThat(zones.get(2).getSortOrder()).isNull();
    }

    @Test
    @Order(2)
    @DisplayName("✅ ดึงโซนทั้งหมดของอีเวนต์ เรียงตาม sort_order และ zone_id")
    void testFindByEventIdOrderBySortOrderAscZoneIdAsc() {
        // Given
        seatZonesRepository.save(zone1);
        seatZonesRepository.save(zone2);
        seatZonesRepository.save(zoneWithNullSort);

        // When
        List<SeatZones> zones = seatZonesRepository.findByEventIdOrderBySortOrderAscZoneIdAsc(testEventId1);

        // Then
        assertThat(zones).hasSize(3);
        assertThat(zones.get(0).getSortOrder()).isEqualTo(1);
        assertThat(zones.get(1).getSortOrder()).isEqualTo(2);
        assertThat(zones.get(2).getSortOrder()).isNull();

        // Verify zone_id ordering within same sort_order if needed
        for (int i = 0; i < zones.size() - 1; i++) {
            Integer currentSort = zones.get(i).getSortOrder();
            Integer nextSort = zones.get(i + 1).getSortOrder();
            if (currentSort != null && nextSort != null && currentSort.equals(nextSort)) {
                assertThat(zones.get(i).getZoneId()).isLessThan(zones.get(i + 1).getZoneId());
            }
        }
    }

    @Test
    @Order(3)
    @DisplayName("✅ ดึงโซนทั้งหมดของอีเวนต์ที่ไม่มีโซน")
    void testFindByEventIdOrderBySortOrderAsc_EmptyResult() {
        // Given
        Long nonExistentEventId = 999L;

        // When
        List<SeatZones> zones = seatZonesRepository.findByEventIdOrderBySortOrderAsc(nonExistentEventId);

        // Then
        assertThat(zones).isEmpty();
    }

    @Test
    @Order(4)
    @DisplayName("✅ ดึงข้อมูลโซนเดี่ยวตาม zoneId สำเร็จ")
    void testFindByZoneId_Found() {
        // Given
        SeatZones savedZone = seatZonesRepository.save(zone1);

        // When
        Optional<SeatZones> result = seatZonesRepository.findByZoneId(savedZone.getZoneId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getZoneName()).isEqualTo("VIP Zone");
        assertThat(result.get().getZoneCode()).isEqualTo("VIP");
        assertThat(result.get().getPrice()).isEqualByComparingTo(new BigDecimal("5000.00"));
    }

    @Test
    @Order(5)
    @DisplayName("✅ ดึงข้อมูลโซนเดี่ยวตาม zoneId ไม่พบ")
    void testFindByZoneId_NotFound() {
        // Given
        Long nonExistentZoneId = 999L;

        // When
        Optional<SeatZones> result = seatZonesRepository.findByZoneId(nonExistentZoneId);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @Order(6)
    @DisplayName("✅ ตรวจสอบชื่อโซนซ้ำภายใน event (พบชื่อซ้ำ)")
    void testExistsByEventIdAndZoneNameIgnoreCase_Exists() {
        // Given
        seatZonesRepository.save(zone1);

        // When
        boolean exists1 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId1, "VIP Zone");
        boolean exists2 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId1, "vip zone");
        boolean exists3 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId1, "VIP ZONE");

        // Then
        assertThat(exists1).isTrue();
        assertThat(exists2).isTrue();
        assertThat(exists3).isTrue();
    }

    @Test
    @Order(7)
    @DisplayName("✅ ตรวจสอบชื่อโซนซ้ำภายใน event (ไม่พบชื่อซ้ำ)")
    void testExistsByEventIdAndZoneNameIgnoreCase_NotExists() {
        // Given
        seatZonesRepository.save(zone1);

        // When
        boolean exists1 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId1, "Premium Zone");
        boolean exists2 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId2, "VIP Zone");

        // Then
        assertThat(exists1).isFalse();
        assertThat(exists2).isFalse();
    }

    @Test
    @Order(8)
    @DisplayName("✅ ตรวจสอบชื่อโซนซ้ำ - ชื่อเดียวกันคนละ event ไม่ถือว่าซ้ำ")
    void testExistsByEventIdAndZoneNameIgnoreCase_DifferentEvents() {
        // Given
        seatZonesRepository.save(zone1); // event1, "VIP Zone"
        zone3.setZoneName("VIP Zone"); // event2, "VIP Zone"
        seatZonesRepository.save(zone3);

        // When
        boolean existsInEvent1 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId1, "VIP Zone");
        boolean existsInEvent2 = seatZonesRepository.existsByEventIdAndZoneNameIgnoreCase(testEventId2, "VIP Zone");

        // Then
        assertThat(existsInEvent1).isTrue();
        assertThat(existsInEvent2).isTrue();
    }

    @Test
    @Order(9)
    @DisplayName("✅ ลบข้อมูลโซนทั้งหมดในอีเวนต์")
    void testDeleteByEventId() {
        // Given
        seatZonesRepository.save(zone1);
        seatZonesRepository.save(zone2);
        seatZonesRepository.save(zoneWithNullSort);
        seatZonesRepository.save(zone3); // Different event

        assertThat(seatZonesRepository.findAll()).hasSize(4);

        // When
        seatZonesRepository.deleteByEventId(testEventId1);
        seatZonesRepository.flush(); // Force immediate execution

        // Then
        List<SeatZones> remainingZones = seatZonesRepository.findAll();
        assertThat(remainingZones).hasSize(1);
        assertThat(remainingZones.get(0).getEventId()).isEqualTo(testEventId2);
    }

    @Test
    @Order(10)
    @DisplayName("✅ ลบข้อมูลโซนจากอีเวนต์ที่ไม่มีโซน")
    void testDeleteByEventId_NoZones() {
        // Given
        Long nonExistentEventId = 999L;

        // When & Then (should not throw exception)
        assertThatCode(() -> {
            seatZonesRepository.deleteByEventId(nonExistentEventId);
            seatZonesRepository.flush();
        }).doesNotThrowAnyException();
    }

    @Test
    @Order(11)
    @DisplayName("✅ ทดสอบการเรียงลำดับโซนที่มี sort_order เท่ากัน")
    void testSortOrderWithSameValues() {
        // Given
        zone1.setSortOrder(1);
        zone2.setSortOrder(1);
        zoneWithNullSort.setSortOrder(1);

        seatZonesRepository.save(zone1);
        seatZonesRepository.save(zone2);
        seatZonesRepository.save(zoneWithNullSort);

        // When
        List<SeatZones> zones = seatZonesRepository.findByEventIdOrderBySortOrderAscZoneIdAsc(testEventId1);

        // Then
        assertThat(zones).hasSize(3);
        assertThat(zones.get(0).getSortOrder()).isEqualTo(1);
        assertThat(zones.get(1).getSortOrder()).isEqualTo(1);
        assertThat(zones.get(2).getSortOrder()).isEqualTo(1);

        // Verify zone_id ascending order
        assertThat(zones.get(0).getZoneId()).isLessThan(zones.get(1).getZoneId());
        assertThat(zones.get(1).getZoneId()).isLessThan(zones.get(2).getZoneId());
    }

    @Test
    @Order(12)
    @DisplayName("✅ ทดสอบโซนที่มี sort_order เป็น NULL ทั้งหมด")
    void testAllNullSortOrder() {
        // Given
        zone1.setSortOrder(null);
        zone2.setSortOrder(null);
        zoneWithNullSort.setSortOrder(null);

        seatZonesRepository.save(zone1);
        seatZonesRepository.save(zone2);
        seatZonesRepository.save(zoneWithNullSort);

        // When
        List<SeatZones> zones = seatZonesRepository.findByEventIdOrderBySortOrderAsc(testEventId1);

        // Then
        assertThat(zones).hasSize(3);
        assertThat(zones).allMatch(z -> z.getSortOrder() == null);
    }
}