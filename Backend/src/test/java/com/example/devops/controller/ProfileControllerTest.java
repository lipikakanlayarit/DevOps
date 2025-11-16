package com.example.devops.controller;

import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
class ProfileControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    @MockBean
    private JdbcTemplate jdbc;

    /* ============================================================
       GET /api/profile — user found
    ============================================================ */
    @Test
    @WithMockUser(username = "alice")
    void testGetProfile_user() throws Exception {

        User u = new User();
        u.setId(1L);
        u.setUsername("alice");
        u.setEmail("a@mail.com");
        u.setFirstName("Alice");
        u.setLastName("Wonder");
        u.setPhoneNumber("099");
        u.setRole("USER");

        Mockito.when(userRepo.findByUsernameIgnoreCase("alice"))
                .thenReturn(Optional.of(u));

        mvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    /* ============================================================
       GET /api/profile — organizer found
    ============================================================ */
    @Test
    @WithMockUser(username = "bob")
    void testGetProfile_organizer() throws Exception {

        Organizer o = new Organizer();
        o.setId(10L);
        o.setUsername("bob");
        o.setEmail("bob@mail.com");
        o.setFirstName("Bob");
        o.setLastName("O");
        o.setPhoneNumber("123");
        o.setCompanyName("Co");
        o.setTaxId("999");
        o.setAddress("BKK");

        Mockito.when(userRepo.findByUsernameIgnoreCase("bob"))
                .thenReturn(Optional.empty());

        Mockito.when(organizerRepo.findByUsernameIgnoreCase("bob"))
                .thenReturn(Optional.of(o));

        mvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.role").value("ORGANIZER"));
    }

    /* ============================================================
       GET /api/profile — unauthorized
    ============================================================ */
    @Test
    void testGetProfile_unauth() throws Exception {
        mvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }

    /* ============================================================
       GET /api/profile/my-tickets — empty list
       (✔ แก้ ambiguous)
    ============================================================ */
    @Test
    @WithMockUser(username = "alice")
    void testMyTickets_empty() throws Exception {

        Mockito.when(userRepo.findByUsernameIgnoreCase("alice"))
                .thenReturn(Optional.of(new User(){{
                    setId(1L);
                    setUsername("alice");
                }}));

        // ❗ ใช้ any(Object[].class) เพื่อเลือก overload ที่ถูกต้อง
        Mockito.when(jdbc.queryForList(anyString(), any(Object[].class)))
                .thenReturn(List.of());

        mvc.perform(get("/api/profile/my-tickets"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    /* ============================================================
       GET /api/profile/my-tickets — return rows
    ============================================================ */
    @Test
    @WithMockUser(username = "alice")
    void testMyTickets_withRows() throws Exception {

        Mockito.when(userRepo.findByUsernameIgnoreCase("alice"))
                .thenReturn(Optional.of(new User(){{
                    setId(1L);
                    setUsername("alice");
                }}));

        Map<String,Object> row = new HashMap<>();
        row.put("reserveId", 100);
        row.put("eventId", 10);
        row.put("title", "Concert");
        row.put("venue", "Arena");
        row.put("showDate", "2025-01-01");
        row.put("zoneName", "VIP");
        row.put("rowLabel", "A");
        row.put("seatNumber", 1);
        row.put("seatId", 99);
        row.put("unitPrice", 1500);

        Mockito.when(jdbc.queryForList(anyString(), any(Object[].class)))
                .thenReturn(List.of(row));

        mvc.perform(get("/api/profile/my-tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reserveId").value("100"))
                .andExpect(jsonPath("$[0].posterUrl").value("/api/events/10/cover"))
                .andExpect(jsonPath("$[0].zone").value("VIP"));
    }
}
