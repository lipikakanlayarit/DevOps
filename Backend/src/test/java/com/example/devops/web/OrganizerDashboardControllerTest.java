package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class OrganizerDashboardControllerTest {

    // ===========================
    // helper: set private field
    // ===========================
    private static void setField(Object obj, String field, Object val) {
        try {
            Field f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(obj, val);
        } catch (Exception ignored) {}
    }

    @Test
    void testDashboard_eventFound() {
        // ---- mock dependencies ----
        EventsNamRepository eventsRepo = mock(EventsNamRepository.class);
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        ReservedSeatsRepository reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        SeatsRepository seatsRepo = mock(SeatsRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);

        OrganizerDashboardController controller =
                new OrganizerDashboardController(eventsRepo, reservedRepo, reservedSeatsRepo, seatsRepo, jdbc);

        // ---- mock event exists ----
        EventsNam ev = new EventsNam();

        // ⭐⭐⭐ ใช้ Reflection ตั้งค่า eventId ให้ตรง field จริง
        // ตรวจ field ว่าชื่ออะไรในโมเดลของคุณ (ลอง eventId, id)
        setField(ev, "eventId", 10L);
        setField(ev, "eventName", "Test Event");
        setField(ev, "salesEndDatetime", Instant.now());

        when(eventsRepo.findById(10L)).thenReturn(Optional.of(ev));

        // ---- mock seat summary ----
        when(seatsRepo.countTotalSeatsByEvent(10L)).thenReturn(100L);
        when(seatsRepo.countSoldSeatsByEvent(10L)).thenReturn(30L);
        when(seatsRepo.countReservedSeatSlotsByEvent(10L)).thenReturn(10L);

        // ---- mock revenue ----
        when(reservedRepo.sumPaidAmountByEvent(10L)).thenReturn(new BigDecimal("1500"));

        // ---- mock rows from jdbc ----
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", 1L);
        row.put("reserved_code", "RSV001");
        row.put("status", "PAID");
        row.put("unit_price", new BigDecimal("500"));
        row.put("user", "John Doe");
        row.put("date", "01 Jan 2024");
        row.put("seat_label", "A1");
        row.put("payment_method", "CREDIT");
        row.put("seat_id", 99L);
        row.put("registration_ts", Instant.now());
        row.put("expire_at", Instant.now());

        when(jdbc.queryForList(anyString(), eq(10L)))
                .thenReturn(List.of(row));

        // ---- execute ----
        ResponseEntity<?> resp = controller.getDashboard(10L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(200);
        Map<String, Object> body = cast(resp.getBody());

        assertThat(body.get("eventId")).isEqualTo(10L);
        assertThat(body.get("eventName")).isEqualTo("Test Event");
        assertThat(body.get("ticketTarget")).isEqualTo(100L);
        assertThat(body.get("sold")).isEqualTo(30L);
        assertThat(body.get("reserved")).isEqualTo(10L);
        assertThat(body.get("available")).isEqualTo(60L);
        assertThat(body.get("netPayout")).isEqualTo(new BigDecimal("1500"));

        List<?> rows = (List<?>) body.get("rows");
        assertThat(rows).hasSize(1);

        Map<?, ?> item = (Map<?, ?>) rows.get(0);
        assertThat(item.get("reserved_code")).isEqualTo("RSV001");
        assertThat(item.get("seat_label")).isEqualTo("A1");
    }

    @Test
    void testDashboard_eventNotFound() {
        EventsNamRepository eventsRepo = mock(EventsNamRepository.class);
        ReservedRepository reservedRepo = mock(ReservedRepository.class);
        ReservedSeatsRepository reservedSeatsRepo = mock(ReservedSeatsRepository.class);
        SeatsRepository seatsRepo = mock(SeatsRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);

        OrganizerDashboardController controller =
                new OrganizerDashboardController(eventsRepo, reservedRepo, reservedSeatsRepo, seatsRepo, jdbc);

        when(eventsRepo.findById(99L)).thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.getDashboard(99L);

        assertThat(resp.getStatusCodeValue()).isEqualTo(404);
        Map<String, Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("EVENT_NOT_FOUND");
    }

    @SuppressWarnings("unchecked")
    private static <T> T cast(Object o) {
        return (T) o;
    }
}
