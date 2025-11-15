package com.example.devops.controller;

import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import com.example.devops.security.JwtTokenUtil;
import com.example.devops.service.GuestClaimService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for AuthController
 * ปิด Security filters เพื่อไม่กระทบโปรดักชันและไม่ต้องแก้โค้ดต้นฉบับ
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // 🔑 ปิด Security/CSRF ในเลเยอร์ทดสอบ
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
    @MockBean
    private GuestClaimService guestClaimService;

    @Autowired
    private ObjectMapper objectMapper;

    private User mockUser;
    private Organizer mockOrg;

    @BeforeEach
    void setup() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("alice");
        mockUser.setEmail("alice@example.com");
        mockUser.setPassword("encodedPass");
        mockUser.setRole("USER");

        mockOrg = new Organizer();
        mockOrg.setId(2L);
        mockOrg.setUsername("org");
        mockOrg.setEmail("org@example.com");
        mockOrg.setPasswordHash("encodedOrgPass");
    }

    // ====================== LOGIN ======================

    @Test
    @DisplayName("login user สำเร็จ")
    void loginUser_success() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password123", "encodedPass")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("mockToken");

        var req = new AuthController.LoginRequest();
        req.setUsername("alice");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockToken"))
                .andExpect(jsonPath("$.user.username").value("alice"));

        verify(guestClaimService).linkGuestReservationsToUser(1L, "alice@example.com");
    }

    @Test
    @DisplayName("login organizer สำเร็จ")
    void loginOrganizer_success() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("org")).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase("org")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("org")).thenReturn(Optional.of(mockOrg));
        when(passwordEncoder.matches("12345Abc", "encodedOrgPass")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("orgToken");

        var req = new AuthController.LoginRequest();
        req.setUsername("org");
        req.setPassword("12345Abc");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("orgToken"))
                .andExpect(jsonPath("$.user.role").value("ORGANIZER"));
    }

    @Test
    @DisplayName("login ผิดรหัส → 401")
    void login_wrongPassword_unauthorized() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrong", "encodedPass")).thenReturn(false);

        var req = new AuthController.LoginRequest();
        req.setUsername("alice");
        req.setPassword("wrong");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid username/email or password"));
    }

    // ================== USER SIGNUP ====================

    @Test
    @DisplayName("signup user สำเร็จ")
    void signupUser_success() throws Exception {
        when(userRepo.findByUsernameIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase(any())).thenReturn(Optional.empty());
        when(organizerRepo.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded123");

        var req = new AuthController.UserSignupRequest();
        req.setEmail("new@example.com");
        req.setUsername("newuser");
        req.setPassword("Abcdefg1");
        req.setFirstName("A");
        req.setLastName("B");
        req.setPhoneNumber("000");
        req.setIdCard("111");

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User created successfully"));
    }

    @Test
    @DisplayName("signup user → password format ผิด")
    void signupUser_weakPassword_badRequest() throws Exception {
        var req = new AuthController.UserSignupRequest();
        req.setEmail("a@a.com");
        req.setUsername("u");
        req.setPassword("1234"); // ไม่มีตัวใหญ่/เล็กพอ และ < 8 ตัว
        req.setFirstName("A");
        req.setLastName("B");
        req.setPhoneNumber("000");
        req.setIdCard("111");

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Password must be at least 8 characters with uppercase, lowercase, and number"));
    }

    @Test
    @DisplayName("signup user → username ซ้ำ")
    void signupUser_duplicateUsername_badRequest() throws Exception {
        when(userRepo.findByUsernameIgnoreCase("dup")).thenReturn(Optional.of(mockUser));

        var req = new AuthController.UserSignupRequest();
        req.setEmail("dup@example.com");
        req.setUsername("dup");
        req.setPassword("Abcdefg1");
        req.setFirstName("A");
        req.setLastName("B");
        req.setPhoneNumber("000");
        req.setIdCard("111");

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Username already exists"));
    }

    @Test
    @DisplayName("signup user → validation error (field missing)")
    void signupUser_validationErrors_badRequest() throws Exception {
        // ส่ง JSON ที่ขาดฟิลด์บังคับหลายตัว -> BindingResult.hasErrors() = true
        String invalidJson = """
            {
              "username": "",
              "password": "",
              "firstName": "",
              "lastName": "",
              "phoneNumber": "",
              "idCard": ""
            }
            """;

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing or invalid fields for user signup"));
    }

    // ============== ORGANIZER SIGNUP =================

    @Test
    @DisplayName("signup organizer สำเร็จ")
    void signupOrganizer_success() throws Exception {
        when(organizerRepo.findByUsernameIgnoreCase(any())).thenReturn(Optional.empty());
        when(organizerRepo.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepo.findByUsernameIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encodedOrg");

        var req = new AuthController.OrganizerSignupRequest();
        req.setEmail("org2@example.com");
        req.setUsername("org2");
        req.setPassword("Abcdefg1");
        req.setFirstName("A");
        req.setLastName("B");
        req.setPhoneNumber("000");
        req.setAddress("Addr");
        req.setCompanyName("Comp");
        req.setTaxId("123");

        mockMvc.perform(post("/api/auth/organizer/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Organizer created successfully, pending verification"));
    }

    @Test
    @DisplayName("signup organizer → password format ผิด")
    void signupOrganizer_weakPassword_badRequest() throws Exception {
        var req = new AuthController.OrganizerSignupRequest();
        req.setEmail("a@a.com");
        req.setUsername("orgx");
        req.setPassword("123"); // อ่อน
        req.setFirstName("a");
        req.setLastName("b");
        req.setPhoneNumber("1");
        req.setAddress("a");
        req.setCompanyName("a");
        req.setTaxId("t");

        mockMvc.perform(post("/api/auth/organizer/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("signup organizer → validation error (field missing)")
    void signupOrganizer_validationErrors_badRequest() throws Exception {
        String invalidJson = """
            {
              "email": "",
              "username": "",
              "password": "",
              "firstName": "",
              "lastName": "",
              "phoneNumber": "",
              "address": "",
              "companyName": "",
              "taxId": ""
            }
            """;

        mockMvc.perform(post("/api/auth/organizer/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Missing or invalid fields for organizer signup"));
    }
}
