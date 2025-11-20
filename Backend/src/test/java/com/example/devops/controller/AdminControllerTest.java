package com.example.devops.controller;

import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;

import org.junit.jupiter.api.BeforeEach;
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

@WebMvcTest(AdminController.class)
@WithMockUser(roles = "ADMIN")
class AdminControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean private UserRepository userRepo;
    @MockBean private OrganizerRepo organizerRepo;
    @MockBean private EventsNamRepository eventsRepo;
    @MockBean private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setup() {
        // no setup needed
    }

    /* ==========================
       /api/admin/users
       ========================== */
    @Test
    void testGetAllUsers() throws Exception {
        User u = new User();
        u.setId(1L);
        u.setUsername("john");
        u.setEmail("john@example.com");
        u.setRole("USER");

        Mockito.when(userRepo.findAll()).thenReturn(List.of(u));

        mvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users[0].username").value("john"))
                .andExpect(jsonPath("$.total").value(1));
    }

    /* ==========================
       /api/admin/organizers
       ========================== */
    @Test
    void testGetAllOrganizers() throws Exception {
        Organizer o = new Organizer();
        o.setId(10L);
        o.setUsername("org1");

        Mockito.when(organizerRepo.findAll()).thenReturn(List.of(o));

        mvc.perform(get("/api/admin/organizers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizers[0].username").value("org1"))
                .andExpect(jsonPath("$.total").value(1));
    }

    /* ==========================
       /api/admin/organizers/{id}
       ========================== */
    @Test
    void testGetOrganizerById() throws Exception {
        Organizer o = new Organizer();
        o.setId(5L);
        o.setUsername("company");

        Mockito.when(organizerRepo.findById(5L)).thenReturn(Optional.of(o));

        mvc.perform(get("/api/admin/organizers/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("company"));
    }

    @Test
    void testGetOrganizerByIdNotFound() throws Exception {
        Mockito.when(organizerRepo.findById(99L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/admin/organizers/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetEventByIdNotFound() throws Exception {
        Mockito.when(eventsRepo.findById(123L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/admin/events/123"))
                .andExpect(status().isNotFound());
    }
}
