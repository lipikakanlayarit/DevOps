package com.example.devops;

import com.example.devops.controller.AuthController;
import com.example.devops.model.User;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import com.example.devops.security.JwtTokenUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // ✅ ปิด Security filter เพื่อให้เทสเข้าถึง Controller โดยตรง
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtTokenUtil jwtUtil;

    private User mockUser;

    @BeforeEach
    void setup() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");
        mockUser.setEmail("test@example.com");
        mockUser.setPassword("encodedPassword");
        mockUser.setRole("USER");
    }

    // ✅ CASE 1: Login สำเร็จ
    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testLoginSuccess() throws Exception {
        Mockito.when(userRepo.findByUsernameIgnoreCase("testuser"))
                .thenReturn(Optional.of(mockUser));
        Mockito.when(passwordEncoder.matches("1234", "encodedPassword"))
                .thenReturn(true);
        Mockito.when(jwtUtil.generateToken(anyString(), anyString(), anyString()))
                .thenReturn("mock-jwt");

        String json = """
            { "username": "testuser", "password": "1234" }
        """;

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt"))
                .andExpect(jsonPath("$.user.username").value("testuser"));
    }

    // ✅ CASE 2: Password ผิด
    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testLoginFailWrongPassword() throws Exception {
        Mockito.when(userRepo.findByUsernameIgnoreCase("testuser"))
                .thenReturn(Optional.of(mockUser));
        Mockito.when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(false);

        String json = """
            { "username": "testuser", "password": "wrong" }
        """;

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid username/email or password"));
    }

    // ✅ CASE 3: ไม่พบผู้ใช้
    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testLoginFailUserNotFound() throws Exception {
        Mockito.when(userRepo.findByUsernameIgnoreCase(anyString()))
                .thenReturn(Optional.empty());

        String json = """
            { "username": "unknown", "password": "whatever" }
        """;

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid username/email or password"));
    }

    // ✅ CASE 4: username หรือ password ว่าง (ทดสอบ validation)
    @Test
    void testLoginFailEmptyFields() throws Exception {
        String json = """
            { "username": "", "password": "" }
        """;

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }
}
