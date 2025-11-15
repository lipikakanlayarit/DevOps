package com.example.devops.controller;

import com.example.devops.model.SeatZones;
import com.example.devops.repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ✅ Unit Test สำหรับ AdminEventZoneController
 * ครอบคลุมทุก endpoint:
 *   - /{eventId}/zones
 *   - /{eventId}/seat-stats
 *   - /{eventId}/reservations
 *
 * ใช้ @WebMvcTest โหลดเฉพาะ controller layer
 */
@WebMvcTest(AdminEventZoneController.class)
@WithMockUser(roles = "ADMIN") // จำลอง Admin ที่ผ่าน Security
class AdminEventZoneControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private SeatZonesRepository seatZonesRepo;
    @MockBean private SeatRowsRepository seatRowsRepo;
    @MockBean private SeatsRepository seatsRepo;
    @MockBean private ZoneTicketTypesRepository zttRepo;
    @MockBean private ReservedRepository reservedRepo;
    @MockBean private JdbcTemplate jdbc;

    private SeatZones mockZone;

    @BeforeEach
    void setup() {
        mockZone = new SeatZones();
        ReflectionTestUtils.setField(mockZone, "zoneId", 1L);
        ReflectionTestUtils.setField(mockZone, "zoneName", "VIP Zone");
        // sortOrder ไม่จำเป็นต้อง mock
    }

    // ============================================================
    // TEST 1: /api/admin/events/{eventId}/zones
    // ============================================================

    @Test
    @DisplayName("✅ listZonesSummary() → คืนค่าโซนพร้อมข้อมูลครบ")
    void testListZonesSummary() throws Exception {
        when(seatZonesRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(100L))
                .thenReturn(List.of(mockZone));

        when(seatRowsRepo.countByZoneId(1L)).thenReturn(5);
        when(seatsRepo.findMaxSeatsPerRowByZoneId(1L)).thenReturn(10);
        when(zttRepo.findFirstPriceByZoneId(1L)).thenReturn(BigDecimal.valueOf(999));
        when(seatsRepo.countSeatsInZone(1L)).thenReturn(50);
        when(seatsRepo.countSoldSeatsInZone(1L)).thenReturn(20);
        when(seatsRepo.countReservedSeatsInZone(1L)).thenReturn(5);

        mockMvc.perform(get("/api/admin/events/100/zones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].zone").value("VIP Zone"))
                .andExpect(jsonPath("$[0].price").value("999"))
                .andExpect(jsonPath("$[0].sold").value(20))
                .andExpect(jsonPath("$[0].reserved").value(5))
                .andExpect(jsonPath("$[0].available").value(25))
                .andExpect(jsonPath("$[0].total").value(50));

        verify(seatZonesRepo).findByEventIdOrderBySortOrderAscZoneIdAsc(100L);
    }

    @Test
    @DisplayName("✅ listZonesSummary() → ไม่มีโซน → คืน array ว่าง")
    void testListZonesSummaryEmpty() throws Exception {
        when(seatZonesRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(100L))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/admin/events/100/zones"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    // ============================================================
    // TEST 2: /api/admin/events/{eventId}/seat-stats
    // ============================================================

    @Test
    @DisplayName("✅ getSeatStats() → คืนค่าตัวเลขสรุปครบ")
    void testGetSeatStats() throws Exception {
        when(seatsRepo.countTotalSeatsByEvent(200L)).thenReturn(100L);
        when(seatsRepo.countSoldSeatsByEvent(200L)).thenReturn(40L);
        when(seatsRepo.countReservedSeatSlotsByEvent(200L)).thenReturn(10L);

        mockMvc.perform(get("/api/admin/events/200/seat-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(100))
                .andExpect(jsonPath("$.sold").value(40))
                .andExpect(jsonPath("$.reserved").value(10))
                .andExpect(jsonPath("$.available").value(50));

        verify(seatsRepo).countTotalSeatsByEvent(200L);
        verify(seatsRepo).countSoldSeatsByEvent(200L);
        verify(seatsRepo).countReservedSeatSlotsByEvent(200L);
    }

    // ============================================================
    // TEST 3: /api/admin/events/{eventId}/reservations
    // ============================================================

    @Test
    @DisplayName("✅ listReservations() → คืนค่า reservation list ครบ")
    void testListReservations() throws Exception {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", 1);
        row.put("reserved_code", "ABC123");
        row.put("status", "PAID");
        row.put("total", 500);
        row.put("username", "Alice");
        row.put("date", "01 Jan 2025");
        row.put("seat_label", "A1, A2");
        row.put("payment_method", "CREDIT");

        when(jdbc.queryForList(any(String.class), any(Long.class)))
                .thenReturn(List.of(row));

        mockMvc.perform(get("/api/admin/events/300/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("ABC123"))
                .andExpect(jsonPath("$[0].user").value("Alice"))
                .andExpect(jsonPath("$[0].seat_label").value("A1, A2"))
                .andExpect(jsonPath("$[0].payment_method").value("CREDIT"));

        verify(jdbc).queryForList(any(String.class), eq(300L));
    }

    @Test
    @DisplayName("✅ listReservations() → ไม่มีข้อมูล → คืน array ว่าง")
    void testListReservationsEmpty() throws Exception {
        when(jdbc.queryForList(any(String.class), any(Long.class)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/admin/events/400/reservations"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
