package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MeController.class)
@AutoConfigureMockMvc(addFilters = false)   // ⭐ ปิด Security Filter เพื่อไม่ให้โดน 401
public class MeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    /* ==================== 1) Unauthorized ==================== */
    @Test
    void testGetMe_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    /* ==================== 2) User Found ==================== */
    @Test
    void testGetMe_UserFound() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@mail.com");
        user.setRole("USER");
        user.setFirstName("Alice");
        user.setLastName("W");
        user.setPhoneNumber("123");
        user.setIdCardPassport("XYZ111");

        when(userRepo.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(user));
        when(organizerRepo.findByUsernameIgnoreCase("alice")).thenReturn(Optional.empty());

        Authentication auth = new UsernamePasswordAuthenticationToken("alice", null);

        mockMvc.perform(
                        get("/api/auth/me")
                                .principal(auth)                 // ⭐ จำลอง logged-in user
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@mail.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.firstName").value("Alice"))
                .andExpect(jsonPath("$.lastName").value("W"));
    }

    /* ==================== 3) Organizer Found ==================== */
    @Test
    void testGetMe_OrganizerFound() throws Exception {
        Organizer org = new Organizer();
        org.setId(10L);
        org.setUsername("orgboss");
        org.setEmail("org@mail.com");
        org.setFirstName("Boss");
        org.setLastName("Organizer");
        org.setPhoneNumber("999");
        org.setCompanyName("BigOrg");
        org.setTaxId("TAX123");
        org.setAddress("Somewhere");
        org.setVerificationStatus("APPROVED");

        when(userRepo.findByUsernameIgnoreCase("orgboss")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("orgboss")).thenReturn(Optional.of(org));

        Authentication auth = new UsernamePasswordAuthenticationToken("orgboss", null);

        mockMvc.perform(
                        get("/api/auth/me")
                                .principal(auth)
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("10"))
                .andExpect(jsonPath("$.username").value("orgboss"))
                .andExpect(jsonPath("$.email").value("org@mail.com"))
                .andExpect(jsonPath("$.role").value("ORGANIZER"))
                .andExpect(jsonPath("$.companyName").value("BigOrg"))
                .andExpect(jsonPath("$.verificationStatus").value("APPROVED"));
    }

    /* ==================== 4) Not Found ==================== */
    @Test
    void testGetMe_NotFound() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("ghost")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("ghost")).thenReturn(Optional.empty());

        Authentication auth = new UsernamePasswordAuthenticationToken("ghost", null);

        mockMvc.perform(
                        get("/api/auth/me")
                                .principal(auth)
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));
    }
}
