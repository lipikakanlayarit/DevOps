package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeControllerTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private OrganizerRepo organizerRepo;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MeController meController;

    private User testUser;
    private Organizer testOrganizer;

    @BeforeEach
    void setUp() {
        // Setup test User
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setRole("USER");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setPhoneNumber("0812345678");
        testUser.setIdCardPassport("1234567890123");

        // Setup test Organizer
        testOrganizer = new Organizer();
        testOrganizer.setId(2L);
        testOrganizer.setUsername("testorg");
        testOrganizer.setEmail("org@example.com");
        testOrganizer.setFirstName("Jane");
        testOrganizer.setLastName("Smith");
        testOrganizer.setPhoneNumber("0823456789");
        testOrganizer.setCompanyName("Test Company");
        testOrganizer.setTaxId("1234567890");
        testOrganizer.setAddress("123 Test St");
        testOrganizer.setVerificationStatus("VERIFIED");
    }

    @Test
    void getCurrentUser_WithNullAuthentication_ReturnsUnauthorized() {
        // Act
        ResponseEntity<?> response = meController.getCurrentUser(null);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Unauthorized", body.get("error"));

        // Verify no repository calls
        verify(userRepo, never()).findByUsernameIgnoreCase(anyString());
        verify(organizerRepo, never()).findByUsernameIgnoreCase(anyString());
    }

    @Test
    void getCurrentUser_WithNullPrincipal_ReturnsUnauthorized() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Unauthorized", body.get("error"));

        verify(userRepo, never()).findByUsernameIgnoreCase(anyString());
        verify(organizerRepo, never()).findByUsernameIgnoreCase(anyString());
    }

    @Test
    void getCurrentUser_WithValidUser_ReturnsUserDetails() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("testuser");
        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(testUser.getId().toString(), body.get("id"));
        assertEquals("testuser", body.get("username"));
        assertEquals("test@example.com", body.get("email"));
        assertEquals("USER", body.get("role"));
        assertEquals("John", body.get("firstName"));
        assertEquals("Doe", body.get("lastName"));
        assertEquals("0812345678", body.get("phoneNumber"));
        assertEquals("1234567890123", body.get("idCard"));

        verify(userRepo).findByUsernameIgnoreCase("testuser");
        verify(organizerRepo, never()).findByUsernameIgnoreCase(anyString());
    }

    @Test
    void getCurrentUser_WithValidOrganizer_ReturnsOrganizerDetails() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("testorg");
        when(userRepo.findByUsernameIgnoreCase("testorg")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("testorg")).thenReturn(Optional.of(testOrganizer));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(testOrganizer.getId().toString(), body.get("id"));
        assertEquals("testorg", body.get("username"));
        assertEquals("org@example.com", body.get("email"));
        assertEquals("ORGANIZER", body.get("role"));
        assertEquals("Jane", body.get("firstName"));
        assertEquals("Smith", body.get("lastName"));
        assertEquals("0823456789", body.get("phoneNumber"));
        assertEquals("Test Company", body.get("companyName"));
        assertEquals("1234567890", body.get("taxId"));
        assertEquals("123 Test St", body.get("address"));
        assertEquals("VERIFIED", body.get("verificationStatus"));

        verify(userRepo).findByUsernameIgnoreCase("testorg");
        verify(organizerRepo).findByUsernameIgnoreCase("testorg");
    }

    @Test
    void getCurrentUser_WithNonExistentUser_ReturnsNotFound() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("nonexistent");
        when(userRepo.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("User not found", body.get("error"));

        verify(userRepo).findByUsernameIgnoreCase("nonexistent");
        verify(organizerRepo).findByUsernameIgnoreCase("nonexistent");
    }

    @Test
    void getCurrentUser_WithCaseInsensitiveUsername_ReturnsUser() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("TESTUSER");
        when(userRepo.findByUsernameIgnoreCase("TESTUSER")).thenReturn(Optional.of(testUser));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("testuser", body.get("username"));

        verify(userRepo).findByUsernameIgnoreCase("TESTUSER");
    }

    @Test
    void getCurrentUser_UserWithNullFields_ReturnsPartialData() {
        // Arrange
        User userWithNulls = new User();
        userWithNulls.setId(3L);
        userWithNulls.setUsername("minimal");
        userWithNulls.setEmail("minimal@example.com");
        userWithNulls.setRole("USER");
        // Other fields are null

        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("minimal");
        when(userRepo.findByUsernameIgnoreCase("minimal")).thenReturn(Optional.of(userWithNulls));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("minimal", body.get("username"));
        assertNull(body.get("firstName"));
        assertNull(body.get("lastName"));
    }

    @Test
    void getCurrentUser_OrganizerWithNullFields_ReturnsPartialData() {
        // Arrange
        Organizer orgWithNulls = new Organizer();
        orgWithNulls.setId(4L);
        orgWithNulls.setUsername("minimalorg");
        orgWithNulls.setEmail("minimalorg@example.com");
        // Other fields are null

        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("minimalorg");
        when(userRepo.findByUsernameIgnoreCase("minimalorg")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("minimalorg")).thenReturn(Optional.of(orgWithNulls));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("ORGANIZER", body.get("role"));
        assertNull(body.get("companyName"));
        assertNull(body.get("taxId"));
    }

    @Test
    void getCurrentUser_VerifyUserResponseContainsAllExpectedFields() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("testuser");
        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(testUser));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);

        assertTrue(body.containsKey("id"));
        assertTrue(body.containsKey("username"));
        assertTrue(body.containsKey("email"));
        assertTrue(body.containsKey("role"));
        assertTrue(body.containsKey("firstName"));
        assertTrue(body.containsKey("lastName"));
        assertTrue(body.containsKey("phoneNumber"));
        assertTrue(body.containsKey("idCard"));

        // Should not contain organizer-specific fields
        assertFalse(body.containsKey("companyName"));
        assertFalse(body.containsKey("taxId"));
        assertFalse(body.containsKey("address"));
        assertFalse(body.containsKey("verificationStatus"));
    }

    @Test
    void getCurrentUser_VerifyOrganizerResponseContainsAllExpectedFields() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("testorg");
        when(userRepo.findByUsernameIgnoreCase("testorg")).thenReturn(Optional.empty());
        when(organizerRepo.findByUsernameIgnoreCase("testorg")).thenReturn(Optional.of(testOrganizer));

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);

        assertTrue(body.containsKey("id"));
        assertTrue(body.containsKey("username"));
        assertTrue(body.containsKey("email"));
        assertTrue(body.containsKey("role"));
        assertTrue(body.containsKey("firstName"));
        assertTrue(body.containsKey("lastName"));
        assertTrue(body.containsKey("phoneNumber"));
        assertTrue(body.containsKey("companyName"));
        assertTrue(body.containsKey("taxId"));
        assertTrue(body.containsKey("address"));
        assertTrue(body.containsKey("verificationStatus"));

        // Should not contain user-specific fields
        assertFalse(body.containsKey("idCard"));
    }

    @Test
    void getCurrentUser_PrioritizesUserOverOrganizer_WhenBothExist() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("authenticated");
        when(authentication.getName()).thenReturn("duplicate");
        when(userRepo.findByUsernameIgnoreCase("duplicate")).thenReturn(Optional.of(testUser));
        // Organizer should not be queried since user is found first

        // Act
        ResponseEntity<?> response = meController.getCurrentUser(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("USER", body.get("role")); // Not "ORGANIZER"

        verify(userRepo).findByUsernameIgnoreCase("duplicate");
        verify(organizerRepo, never()).findByUsernameIgnoreCase(anyString());
    }
}