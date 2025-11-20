package com.example.devops.controller;

import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)   // ⭐ ปิด Security Filter ให้เทสผ่าน
public class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    @MockBean
    private JdbcTemplate jdbc;

    /* ==================== GET PROFILE ==================== */

    @Test
    void testGetProfile_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void testGetProfile_UserFound() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@mail.com");
        user.setRole("USER");
        user.setFirstName("Alice");
        user.setLastName("Wonder");
        user.setPhoneNumber("123");
        user.setIdCardPassport("XYZ111");

        when(userRepo.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(user));

        Authentication auth = new UsernamePasswordAuthenticationToken("alice", null);

        mockMvc.perform(get("/api/profile").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@mail.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void testGetProfile_OrganizerFound() throws Exception {
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

        mockMvc.perform(get("/api/profile").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("10"))
                .andExpect(jsonPath("$.role").value("ORGANIZER"))
                .andExpect(jsonPath("$.companyName").value("BigOrg"));
    }

    @Test
    void testGetProfile_NotFound() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("ghost")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("ghost")).thenReturn(Optional.empty());

        Authentication auth = new UsernamePasswordAuthenticationToken("ghost", null);

        mockMvc.perform(get("/api/profile").principal(auth))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));
    }

    /* ==================== GET MY TICKETS ==================== */

    @Test
    void testGetMyTickets_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/profile/my-tickets"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void testGetMyTickets_ReturnsList() throws Exception {
        User user = new User();
        user.setId(5L);
        user.setUsername("pim");

        when(userRepo.findByUsernameIgnoreCase("pim")).thenReturn(Optional.of(user));

        // Mock DB rows
        when(jdbc.queryForList(anyString(), anyLong())).thenReturn(
                List.of(
                        Map.of(
                                "reserveId", 111,
                                "eventId", 22L,
                                "title", "Concert A",
                                "venue", "Arena",
                                "showDate", "2025-01-01",
                                "zoneName", "VIP",
                                "rowLabel", "A",
                                "seatNumber", 3,
                                "seatId", 55,
                                "unitPrice", 2000
                        )
                )
        );

        Authentication auth = new UsernamePasswordAuthenticationToken("pim", null);

        mockMvc.perform(get("/api/profile/my-tickets").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reserveId").value("111"))
                .andExpect(jsonPath("$[0].title").value("Concert A"))
                .andExpect(jsonPath("$[0].zone").value("VIP"))
                .andExpect(jsonPath("$[0].seatId").value(55));
    }

    /* ==================== UPDATE USER PROFILE ==================== */

    @Test
    void testUpdateUserProfile_Success() throws Exception {
        User u = new User();
        u.setId(1L);
        u.setUsername("alice");
        u.setEmail("old@mail.com");
        u.setFirstName("Old");
        u.setLastName("Name");
        u.setPhoneNumber("000");

        when(userRepo.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(u));
        when(userRepo.findByEmailIgnoreCase("new@mail.com")).thenReturn(Optional.empty());
        when(organizerRepo.findByEmailIgnoreCase("new@mail.com")).thenReturn(Optional.empty());

        Authentication auth = new UsernamePasswordAuthenticationToken("alice", null);

        String body = """
                {
                    "email": "new@mail.com",
                    "firstName": "Alice",
                    "lastName": "W",
                    "phoneNumber": "555",
                    "idCard": "AB123"
                }
                """;

        mockMvc.perform(put("/api/profile/user")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                .andExpect(jsonPath("$.user.email").value("new@mail.com"))
                .andExpect(jsonPath("$.user.firstName").value("Alice"));
    }

    /* ==================== UPDATE ORGANIZER PROFILE ==================== */

    @Test
    void testUpdateOrganizerProfile_Success() throws Exception {
        Organizer org = new Organizer();
        org.setId(9L);
        org.setUsername("orgboss");
        org.setEmail("old@mail.com");

        when(organizerRepo.findByUsernameIgnoreCase("orgboss")).thenReturn(Optional.of(org));
        when(organizerRepo.findByEmailIgnoreCase("new@mail.com")).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase("new@mail.com")).thenReturn(Optional.empty());

        Authentication auth = new UsernamePasswordAuthenticationToken("orgboss", null);

        String body = """
                {
                    "email": "new@mail.com",
                    "firstName": "Boss",
                    "lastName": "O",
                    "phoneNumber": "123",
                    "address": "Road 1",
                    "companyName": "Org Co",
                    "taxId": "TAX9"
                }
                """;

        mockMvc.perform(put("/api/profile/organizer")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizer.email").value("new@mail.com"))
                .andExpect(jsonPath("$.organizer.companyName").value("Org Co"));
    }
}
