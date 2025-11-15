package com.example.devops.controller;

import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 🔍 Unit Test สำหรับ AdminController
 * ใช้ WebMvcTest เพื่อโหลดเฉพาะ Controller layer
 * Mock Repository & JdbcTemplate ทุกตัวที่เป็น dependency
 */
@WebMvcTest(AdminController.class)
@WithMockUser(roles = "ADMIN") // ✅ จำลอง user มี role ADMIN ครอบทั้งคลาส
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    @MockBean
    private EventsNamRepository eventsRepo;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    private User mockUser;
    private Organizer mockOrganizer;
    private EventsNam mockEvent;

    @BeforeEach
    void setup() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("alice");
        mockUser.setEmail("alice@example.com");
        mockUser.setRole("USER");

        mockOrganizer = new Organizer();
        mockOrganizer.setId(10L);
        mockOrganizer.setUsername("org1");
        mockOrganizer.setCompanyName("OrgName");

        mockEvent = new EventsNam();
        ReflectionTestUtils.setField(mockEvent, "id", 100L);
        ReflectionTestUtils.setField(mockEvent, "eventName", "Music Fest");
    }

    // ===================================================
    // USERS
    // ===================================================

    @Test
    @DisplayName("✅ getAllUsers() → คืนค่า 200 OK และแสดงข้อมูล user")
    void testGetAllUsers() throws Exception {
        when(userRepo.findAll()).thenReturn(List.of(mockUser));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users[0].username").value("alice"))
                .andExpect(jsonPath("$.total").value(1));

        verify(userRepo).findAll();
    }

    // ===================================================
    // ORGANIZERS
    // ===================================================

    @Test
    @DisplayName("✅ getAllOrganizers() → คืนค่า 200 OK")
    void testGetAllOrganizers() throws Exception {
        when(organizerRepo.findAll()).thenReturn(List.of(mockOrganizer));

        mockMvc.perform(get("/api/admin/organizers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizers[0].username").value("org1"))
                .andExpect(jsonPath("$.total").value(1));

        verify(organizerRepo).findAll();
    }

    @Test
    @DisplayName("✅ getOrganizerById() → พบ organizer → 200 OK")
    void testGetOrganizerByIdFound() throws Exception {
        when(organizerRepo.findById(10L)).thenReturn(Optional.of(mockOrganizer));

        mockMvc.perform(get("/api/admin/organizers/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("OrgName"))
                .andExpect(jsonPath("$.username").value("org1"));
    }

    @Test
    @DisplayName("❌ getOrganizerById() → ไม่พบ → 404 Not Found")
    void testGetOrganizerByIdNotFound() throws Exception {
        when(organizerRepo.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/organizers/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("organizer not found"));
    }

    // ===================================================
    // EVENTS
    // ===================================================

    @Test
    @DisplayName("✅ listEventsByStatus(ALL) → คืนค่า event list")
    void testListEventsAll() throws Exception {
        when(eventsRepo.findAllByOrderByEventIdDesc()).thenReturn(List.of(mockEvent));

        mockMvc.perform(get("/api/admin/events?status=ALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventName").value("Music Fest"));

        verify(eventsRepo).findAllByOrderByEventIdDesc();
    }

    @Test
    @DisplayName("❌ listEventsByStatus(invalid) → 400 BadRequest")
    void testListEventsInvalidStatus() throws Exception {
        mockMvc.perform(get("/api/admin/events?status=XYZ"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("invalid status"));
    }

    // ===================================================
    // COVER
    // ===================================================

    @Test
    @DisplayName("✅ getEventCover() → มีภาพ → 200 OK")
    void testGetEventCoverFound() throws Exception {
        ReflectionTestUtils.setField(mockEvent, "cover_image", "abc".getBytes());
        ReflectionTestUtils.setField(mockEvent, "cover_image_type", "image/png");
        when(eventsRepo.findById(100L)).thenReturn(Optional.of(mockEvent));

        mockMvc.perform(get("/api/admin/events/100/cover"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"));
    }

    @Test
    @DisplayName("❌ getEventCover() → ไม่พบ event → 404 Not Found")
    void testGetEventCoverNotFound() throws Exception {
        when(eventsRepo.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/events/99/cover"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("❌ getEventCover() → มี event แต่ไม่มีภาพ → 404 Not Found")
    void testGetEventCoverNoImage() throws Exception {
        ReflectionTestUtils.setField(mockEvent, "cover_image", null);
        when(eventsRepo.findById(100L)).thenReturn(Optional.of(mockEvent));

        mockMvc.perform(get("/api/admin/events/100/cover"))
                .andExpect(status().isNotFound());
    }
}
