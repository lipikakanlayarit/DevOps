package com.example.devops.controller;

import com.example.devops.test.containers.ContainerBaseIT;
import com.example.devops.test.support.DbCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

/**
 * Integration Test with Mock Authentication
 */
@AutoConfigureMockMvc
class AdminControllerIT extends ContainerBaseIT {

    @Autowired MockMvc mockMvc;
    @Autowired DbCleaner cleaner;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void setup() {
        cleaner.truncateAll();
        // Seed test data if needed
    }

    @Test
    @WithMockUser(roles = "ADMIN")  // Mock authenticated admin user
    void listUsers_returns200AndJson() throws Exception {
        mockMvc.perform(get("/api/admin/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(roles = "USER")  // Test with non-admin role
    void listUsers_withNonAdminRole_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}