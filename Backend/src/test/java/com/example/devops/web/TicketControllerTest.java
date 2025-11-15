package com.example.devops.web;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.dto.TicketSetupResponse;
import com.example.devops.service.TicketSetupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TicketControllerTest {

    private TicketSetupService service;
    private TicketController controller;

    @BeforeEach
    void setUp() {
        service = mock(TicketSetupService.class);
        controller = new TicketController(service);
    }

    // ============================================================
    // GET /setup : service คืน null → ต้องได้ default response
    // ============================================================
    @Test
    void testGetSetup_whenNull() {
        when(service.getSetup(10L)).thenReturn(null);

        ResponseEntity<?> resp = controller.getSetup(10L);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        TicketSetupResponse body = (TicketSetupResponse) resp.getBody();

        assertThat(body.getSeatRows()).isEqualTo(0);
        assertThat(body.getSeatColumns()).isEqualTo(0);
        assertThat(body.getZones()).isEmpty();
        assertThat(body.getMinPerOrder()).isNull();
        assertThat(body.getMaxPerOrder()).isNull();
        assertThat(body.getActive()).isNull();
        assertThat(body.getSalesStartDatetime()).isNull();
        assertThat(body.getSalesEndDatetime()).isNull();
    }

    // ============================================================
    // GET /setup : ปกติ
    // ============================================================
    @Test
    void testGetSetup_normal() {
        Map<String, Object> m = new HashMap<>();
        m.put("seatRows", 5);
        m.put("seatColumns", 10);
        m.put("zones", List.of(
                Map.of(
                        "code", "A",
                        "name", "VIP",
                        "price", BigDecimal.valueOf(250),
                        "rows", 3,
                        "cols", 5
                )
        ));
        m.put("minPerOrder", 1);
        m.put("maxPerOrder", 4);
        m.put("active", true);
        m.put("salesStartDatetime", Instant.parse("2024-01-01T00:00:00Z"));
        m.put("salesEndDatetime", Instant.parse("2024-01-10T00:00:00Z"));

        when(service.getSetup(10L)).thenReturn(m);

        ResponseEntity<?> resp = controller.getSetup(10L);
        assertThat(resp.getStatusCode().value()).isEqualTo(200);

        TicketSetupResponse body = (TicketSetupResponse) resp.getBody();
        assertThat(body.getSeatRows()).isEqualTo(5);
        assertThat(body.getSeatColumns()).isEqualTo(10);
        assertThat(body.getZones()).hasSize(1);

        TicketSetupResponse.ZonePrice z = body.getZones().get(0);
        assertThat(z.getCode()).isEqualTo("A");
        assertThat(z.getName()).isEqualTo("VIP");
        assertThat(z.getPrice()).isEqualTo(BigDecimal.valueOf(250));
        assertThat(z.getRows()).isEqualTo(3);
        assertThat(z.getCols()).isEqualTo(5);

        assertThat(body.getMinPerOrder()).isEqualTo(1);
        assertThat(body.getMaxPerOrder()).isEqualTo(4);
        assertThat(body.getActive()).isTrue();
        assertThat(body.getSalesStartDatetime()).isEqualTo(Instant.parse("2024-01-01T00:00:00Z"));
        assertThat(body.getSalesEndDatetime()).isEqualTo(Instant.parse("2024-01-10T00:00:00Z"));
    }

    // ============================================================
    // POST /setup : Unauthorized
    // ============================================================
    @Test
    void testPostSetup_unauthorized() {
        TicketSetupRequest req = mock(TicketSetupRequest.class);

        ResponseEntity<?> resp = controller.setupTickets(1L, req, null);

        assertThat(resp.getStatusCode().value()).isEqualTo(401);
        Map<String, Object> body = castMap(resp.getBody());
        assertThat(body.get("error")).isEqualTo("Unauthorized");
    }

    // ============================================================
    // POST /setup : OK
    // ============================================================
    @Test
    void testPostSetup_ok() {
        TicketSetupRequest req = mock(TicketSetupRequest.class);
        Authentication auth = mock(Authentication.class);

        Map<String, Object> result = Map.of("ok", true);
        when(service.setup(1L, req)).thenReturn(result);

        ResponseEntity<?> resp = controller.setupTickets(1L, req, auth);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> body = castMap(resp.getBody());
        assertThat(body.get("ok")).isEqualTo(true);

        verify(service).setup(1L, req);
    }

    // ============================================================
    // PUT /setup : Unauthorized
    // ============================================================
    @Test
    void testPutSetup_unauthorized() {
        TicketSetupRequest req = mock(TicketSetupRequest.class);

        ResponseEntity<?> resp = controller.updateTickets(1L, req, null);

        assertThat(resp.getStatusCode().value()).isEqualTo(401);
        Map<String, Object> body = castMap(resp.getBody());
        assertThat(body.get("error")).isEqualTo("Unauthorized");
    }

    // ============================================================
    // PUT /setup : OK
    // ============================================================
    @Test
    void testPutSetup_ok() {
        TicketSetupRequest req = mock(TicketSetupRequest.class);
        Authentication auth = mock(Authentication.class);

        Map<String, Object> result = Map.of("updated", true);
        when(service.update(1L, req)).thenReturn(result);

        ResponseEntity<?> resp = controller.updateTickets(1L, req, auth);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> body = castMap(resp.getBody());
        assertThat(body.get("updated")).isEqualTo(true);

        verify(service).update(1L, req);
    }

    // ============================================================
    // GET /grid : แค่ passthrough service
    // ============================================================
    @Test
    void testGetSeatGrid() {
        Map<String, Object> grid = Map.of(
                "rows", 5,
                "cols", 10,
                "dummy", List.of(1, 2, 3)
        );

        when(service.getSeatGrid(5L)).thenReturn(grid);

        ResponseEntity<?> resp = controller.getSeatGrid(5L);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> body = castMap(resp.getBody());
        assertThat(body).isEqualTo(grid);   // controller ส่งค่าตรง ๆ
    }

    // ============================================================
    // GET /zones : ดึง zones จาก map ของ service
    // ============================================================
    @Test
    void testGetZones() {
        List<Map<String, Object>> zones = List.of(
                Map.of("code", "A"),
                Map.of("code", "B")
        );
        Map<String, Object> map = Map.of("zones", zones);

        when(service.getSetup(7L)).thenReturn(map);

        ResponseEntity<?> resp = controller.getZones(7L);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        Object body = resp.getBody();
        assertThat(body).isInstanceOf(List.class);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> actual = (List<Map<String, Object>>) body;
        assertThat(actual).hasSize(2);
        assertThat(actual.get(0).get("code")).isEqualTo("A");
        assertThat(actual.get(1).get("code")).isEqualTo("B");
    }

    // helper cast
    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object o) {
        return (Map<String, Object>) o;
    }
}
