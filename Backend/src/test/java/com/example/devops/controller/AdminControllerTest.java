package com.example.devops.controller;

import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(username = "admin", roles = {"ADMIN"})
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    @MockBean
    private EventsNamRepository eventsRepo;

    private User mockUser;
    private Organizer mockOrganizer;
    private EventsNam mockEvent;

    @BeforeEach
    void setup() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("user1");
        mockUser.setEmail("u1@test.com");
        mockUser.setRole("USER");
        mockUser.setFirstName("F");
        mockUser.setLastName("L");
        mockUser.setPhoneNumber("099");
        mockUser.setIdCardPassport("12345");

        mockOrganizer = new Organizer();
        mockOrganizer.setId(10L);
        mockOrganizer.setUsername("org1");
        mockOrganizer.setEmail("org@test.com");
        mockOrganizer.setFirstName("O");
        mockOrganizer.setLastName("G");
        mockOrganizer.setCompanyName("ORG");
        mockOrganizer.setVerificationStatus("PENDING");

        mockEvent = new EventsNam();
        mockEvent.setId(100L);                     // ใช้ id ตัวเดียวพอ
        mockEvent.setStatus("PENDING");
        mockEvent.setOrganizerId(10L);
        mockEvent.setCover_image_type("image/png");
        mockEvent.setCover_image("hello".getBytes());
    }

    /* ============== USERS ============== */
    @Test
    void testGetAllUsers() throws Exception {
        when(userRepo.findAll()).thenReturn(List.of(mockUser));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.users[0].username").value("user1"));
    }

    /* ============== ORGANIZERS ============== */
    @Test
    void testGetAllOrganizers() throws Exception {
        when(organizerRepo.findAll()).thenReturn(List.of(mockOrganizer));

        mockMvc.perform(get("/api/admin/organizers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.organizers[0].email").value("org@test.com"));
    }

    /* ============== EVENTS ============== */
    @Test
    void testListEvents_All() throws Exception {
        when(eventsRepo.findAllByOrderByEventIdDesc()).thenReturn(List.of(mockEvent));
        when(organizerRepo.findAllById(anySet())).thenReturn(List.of(mockOrganizer));

        mockMvc.perform(get("/api/admin/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].organizerName").value("ORG"));
    }

    @Test
    void testListEvents_InvalidStatus() throws Exception {
        mockMvc.perform(get("/api/admin/events?status=WRONG"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("invalid status"));
    }

    @Test
    void testListEvents_FilteredStatus() throws Exception {
        when(eventsRepo.findAllByStatus("PENDING")).thenReturn(List.of(mockEvent));
        when(organizerRepo.findAllById(anySet())).thenReturn(List.of(mockOrganizer));

        mockMvc.perform(get("/api/admin/events?status=pending"))
                .andExpect(status().isOk());
    }

    /* ============== APPROVE / REJECT / REVIEW ============== */
    @Test
    void testApprove_Success() throws Exception {
        when(eventsRepo.approve(eq(100L), any(), anyInt())).thenReturn(1);

        mockMvc.perform(post("/api/admin/events/100/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"review\":\"ok\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("approved"));
    }

    @Test
    void testApprove_NotFound() throws Exception {
        when(eventsRepo.approve(eq(99L), any(), anyInt())).thenReturn(0);

        mockMvc.perform(post("/api/admin/events/99/approve")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("event not found"));
    }

    @Test
    void testReject_MissingReview() throws Exception {
        mockMvc.perform(post("/api/admin/events/100/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("review is required for rejection"));
    }

    @Test
    void testReject_Success() throws Exception {
        when(eventsRepo.reject(eq(100L), anyString(), anyInt())).thenReturn(1);

        mockMvc.perform(post("/api/admin/events/100/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"review\":\"not ok\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("rejected"));
    }

    @Test
    void testReject_NotFound() throws Exception {
        when(eventsRepo.reject(eq(200L), anyString(), anyInt())).thenReturn(0);

        mockMvc.perform(post("/api/admin/events/200/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"review\":\"reject\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("event not found"));
    }

    @Test
    void testGetReview_Success() throws Exception {
        when(eventsRepo.findById(100L)).thenReturn(Optional.of(mockEvent));
        when(organizerRepo.findById(10L)).thenReturn(Optional.of(mockOrganizer));

        mockMvc.perform(get("/api/admin/events/100/review"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizerName").value("ORG"));
    }

    @Test
    void testGetReview_NotFound() throws Exception {
        when(eventsRepo.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/events/999/review"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("event not found"));
    }
}
