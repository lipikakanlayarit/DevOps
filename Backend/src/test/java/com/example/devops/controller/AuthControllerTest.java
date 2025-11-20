package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.security.JwtTokenUtil;
import com.example.devops.service.GuestClaimService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class AuthControllerTest {

    @Mock private UserRepository userRepo;
    @Mock private OrganizerRepo organizerRepo;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenUtil jwtUtil;
    @Mock private GuestClaimService guestClaimService;
    @Mock private BindingResult br;   // ⭐ สำคัญมาก — mock ไม่ให้เป็น null

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        when(br.hasErrors()).thenReturn(false);  // ⭐ ป้องกัน NPE
    }

    /* ======================== LOGIN TEST ======================== */

    @Test
    void testLoginSuccess_User() {
        AuthController.LoginRequest req = new AuthController.LoginRequest();
        req.setUsername("testuser");
        req.setPassword("Password123");

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");
        mockUser.setEmail("user@test.com");
        mockUser.setPassword("encodedPass");
        mockUser.setRole("USER");

        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password123", "encodedPass")).thenReturn(true);
        when(jwtUtil.generateToken("testuser", "USER", "user@test.com")).thenReturn("mockToken");

        ResponseEntity<?> result = authController.login(req, br);

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        verify(guestClaimService).linkGuestReservationsToUser(1L, "user@test.com");
    }

    @Test
    void testLoginFail_InvalidPassword() {
        AuthController.LoginRequest req = new AuthController.LoginRequest();
        req.setUsername("wrong");
        req.setPassword("pass");

        User mockUser = new User();
        mockUser.setUsername("wrong");
        mockUser.setPassword("encoded");

        when(userRepo.findByUsernameIgnoreCase("wrong")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("pass", "encoded")).thenReturn(false);

        ResponseEntity<?> result = authController.login(req, br);

        assertThat(result.getStatusCodeValue()).isEqualTo(401);
    }

    /* ======================== USER SIGNUP TEST ======================== */

    @Test
    void testSignupUserSuccess() {
        AuthController.UserSignupRequest req = new AuthController.UserSignupRequest();
        req.setEmail("test@test.com");
        req.setUsername("newuser");
        req.setPassword("Password123");
        req.setFirstName("A");
        req.setLastName("B");
        req.setPhoneNumber("123");
        req.setIdCard("111");

        when(userRepo.findByUsernameIgnoreCase("newuser")).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("newuser")).thenReturn(Optional.empty());
        when(organizerRepo.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPW");

        // ⭐ Fix สำคัญ — simulate auto ID generation ของ JPA
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        ResponseEntity<?> result = authController.signupUser(req, br);

        assertThat(result.getStatusCodeValue()).isEqualTo(200);

        // ⭐ ตอนนี้ user.getId() = 1L ไม่ใช่ null แล้ว
        verify(guestClaimService).linkGuestReservationsToUser(1L, "test@test.com");
    }


    @Test
    void testSignupUserDuplicateEmail() {
        AuthController.UserSignupRequest req = new AuthController.UserSignupRequest();
        req.setEmail("test@test.com");
        req.setUsername("userA");
        req.setPassword("Password123");
        req.setFirstName("A");
        req.setLastName("B");
        req.setPhoneNumber("123");
        req.setIdCard("111");

        when(userRepo.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.of(new User()));

        ResponseEntity<?> result = authController.signupUser(req, br);

        assertThat(result.getStatusCodeValue()).isEqualTo(400);
    }

    /* ======================== ORGANIZER SIGNUP TEST ======================== */

    @Test
    void testSignupOrganizerSuccess() {
        AuthController.OrganizerSignupRequest req = new AuthController.OrganizerSignupRequest();
        req.setEmail("org@test.com");
        req.setUsername("orgUser");
        req.setPassword("Password123");
        req.setFirstName("F");
        req.setLastName("L");
        req.setPhoneNumber("999");
        req.setAddress("addr");
        req.setCompanyName("company");
        req.setTaxId("TAX");

        when(organizerRepo.findByUsernameIgnoreCase("orgUser")).thenReturn(Optional.empty());
        when(organizerRepo.findByEmailIgnoreCase("org@test.com")).thenReturn(Optional.empty());
        when(userRepo.findByUsernameIgnoreCase("orgUser")).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase("org@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPW");

        ResponseEntity<?> result = authController.signupOrganizer(req, br);

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        verify(organizerRepo).save(any(Organizer.class));
    }

    @Test
    void testSignupOrganizerDuplicateUsername() {
        AuthController.OrganizerSignupRequest req = new AuthController.OrganizerSignupRequest();
        req.setEmail("org@test.com");
        req.setUsername("duplicate");
        req.setPassword("Password123");
        req.setFirstName("F");
        req.setLastName("L");
        req.setPhoneNumber("999");
        req.setAddress("addr");
        req.setCompanyName("company");
        req.setTaxId("TAX");

        when(organizerRepo.findByUsernameIgnoreCase("duplicate"))
                .thenReturn(Optional.of(new Organizer()));

        ResponseEntity<?> result = authController.signupOrganizer(req, br);

        assertThat(result.getStatusCodeValue()).isEqualTo(400);
    }
}
