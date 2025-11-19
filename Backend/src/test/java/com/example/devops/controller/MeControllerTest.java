package com.example.devops.controller;

import com.example.devops.model.Organizer;
import com.example.devops.model.User;
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

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for /api/auth/me endpoint in MeController.
 */
@WebMvcTest(controllers = MeController.class)
@AutoConfigureMockMvc(addFilters = false)
class MeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    private User mockUser;
    private Organizer mockOrganizer;

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
        mockOrganizer.setPhoneNumber("088");
        mockOrganizer.setCompanyName("ORG CO., LTD.");
        mockOrganizer.setTaxId("1234567890123");
        mockOrganizer.setAddress("Bangkok");
        mockOrganizer.setVerificationStatus("APPROVED");
    }

    // ---------- case: normal USER ----------
    @Test
    @WithMockUser(username = "user1", roles = {"USER"})
    void testGetMe_AsUser() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("user1"))
                .thenReturn(Optional.of(mockUser));
        when(organizerRepo.findByUsernameIgnoreCase(anyString()))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user1"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.firstName").value("F"))
                .andExpect(jsonPath("$.idCard").value("12345"));
    }

    // ---------- case: ORGANIZER ----------
    @Test
    @WithMockUser(username = "org1", roles = {"ORGANIZER"})
    void testGetMe_AsOrganizer() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("org1"))
                .thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("org1"))
                .thenReturn(Optional.of(mockOrganizer));

        mockMvc.perform(get("/api/auth/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("org1"))
                .andExpect(jsonPath("$.role").value("ORGANIZER"))
                .andExpect(jsonPath("$.companyName").value("ORG CO., LTD."))
                .andExpect(jsonPath("$.verificationStatus").value("APPROVED"));
    }

    // ---------- case: no Authentication -> 401 ----------
    @Test
    void testGetMe_Unauthorized_NoAuth() throws Exception {
        // ไม่มี @WithMockUser เลย -> auth ใน method จะเป็น null
        mockMvc.perform(get("/api/auth/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    // ---------- case: not found in both tables -> 404 ----------
    @Test
    @WithMockUser(username = "ghost", roles = {"USER"})
    void testGetMe_NotFound() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("ghost"))
                .thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("ghost"))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));
    }
}
