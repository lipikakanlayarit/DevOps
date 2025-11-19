package com.example.devops.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SeatLockServiceTest {

    JdbcTemplate jdbc;
    SeatLockService service;

    @BeforeEach
    void setup() {
        jdbc = mock(JdbcTemplate.class);
        service = new SeatLockService(jdbc);
    }

    // =====================================================================
    // cleanupExpiredLocks()
    // =====================================================================

    @Test
    @DisplayName("cleanupExpiredLocks() – success path")
    void testCleanupExpiredLocks_success() {
        // 1) update expired locks
        when(jdbc.update(startsWith("UPDATE seat_locks"))).thenReturn(3);

        // 2) cancel reservations
        when(jdbc.update(startsWith("UPDATE reserved"))).thenReturn(2);

        // 3) delete reserved_seats
        when(jdbc.update(startsWith("DELETE FROM reserved_seats"))).thenReturn(5);

        service.cleanupExpiredLocks();

        verify(jdbc, times(3)).update(anyString());
    }

    @Test
    @DisplayName("cleanupExpiredLocks() – exception should not crash service")
    void testCleanupExpiredLocks_exception() {
        when(jdbc.update(anyString())).thenThrow(new RuntimeException("DB error"));

        // should not throw
        service.cleanupExpiredLocks();
    }

    // =====================================================================
    // countExpiredLocksNow()
    // =====================================================================

    @Test
    @DisplayName("countExpiredLocksNow() – return correct count")
    void testCountExpiredLocksNow() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class))).thenReturn(7);

        int count = service.countExpiredLocksNow();
        assertThat(count).isEqualTo(7);
    }

    @Test
    @DisplayName("countExpiredLocksNow() – null -> return 0")
    void testCountExpiredLocksNow_null() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class))).thenReturn(null);

        int count = service.countExpiredLocksNow();
        assertThat(count).isEqualTo(0);
    }

    // =====================================================================
    // findActiveLocks()
    // =====================================================================

    @Test
    @DisplayName("findActiveLocks() – return list")
    void testFindActiveLocks() {
        List<Map<String, Object>> mockData = List.of(
                Map.of("seat_id", 10L, "status", "LOCKED")
        );

        when(jdbc.queryForList(anyString())).thenReturn(mockData);

        var result = service.findActiveLocks();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("seat_id")).isEqualTo(10L);
    }

    // =====================================================================
    // forceCleanupNow()
    // =====================================================================

    @Test
    @DisplayName("forceCleanupNow() – success")
    void testForceCleanupNow() {
        when(jdbc.update(anyString())).thenReturn(4);

        service.forceCleanupNow();
        verify(jdbc, times(1)).update(anyString());
    }
}
