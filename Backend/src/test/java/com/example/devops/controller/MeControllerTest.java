package com.example.devops;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class MeControllerTest {

    // Test case 1: Authentication is null
    @Test
    public void testGetCurrentUserWhenAuthenticationIsNull() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        MeController controller = new MeController(userRepo, orgRepo);

        ResponseEntity<?> response = controller.getCurrentUser(null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);

        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Unauthorized", responseBody.get("error"));
    }

    // Test case 2: Authentication principal is null
    @Test
    public void testGetCurrentUserWhenPrincipalIsNull() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getPrincipal()).thenReturn(null);

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);

        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Unauthorized", responseBody.get("error"));
    }

    // Test case 3: User found in UserRepository
    @Test
    public void testGetCurrentUserWhenUserFound() {
        String username = "testuser";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");

        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        user.setEmail("test@example.com");
        user.setRole("USER");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPhoneNumber("0812345678");
        user.setIdCardPassport("1234567890123");

        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);

        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("1", responseBody.get("id"));
        assertEquals(username, responseBody.get("username"));
        assertEquals("test@example.com", responseBody.get("email"));
        assertEquals("USER", responseBody.get("role"));
        assertEquals("John", responseBody.get("firstName"));
        assertEquals("Doe", responseBody.get("lastName"));
        assertEquals("0812345678", responseBody.get("phoneNumber"));
        assertEquals("1234567890123", responseBody.get("idCard"));

        verify(userRepo, times(1)).findByUsernameIgnoreCase(username);
        verify(orgRepo, never()).findByUsernameIgnoreCase(username);
    }

    // Test case 4: User not found in UserRepository, Organizer found in OrganizerRepo
    @Test
    public void testGetCurrentUserWhenOrganizerFound() {
        String username = "organizer1";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");
        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());

        Organizer organizer = new Organizer();
        organizer.setId(2L);
        organizer.setUsername(username);
        organizer.setEmail("org@example.com");
        organizer.setFirstName("Jane");
        organizer.setLastName("Smith");
        organizer.setPhoneNumber("0887654321");
        organizer.setCompanyName("Tech Corp");
        organizer.setTaxId("1234567890");
        organizer.setAddress("123 Main St");
        organizer.setVerificationStatus("VERIFIED");

        when(orgRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(organizer));

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);

        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("2", responseBody.get("id"));
        assertEquals(username, responseBody.get("username"));
        assertEquals("org@example.com", responseBody.get("email"));
        assertEquals("ORGANIZER", responseBody.get("role"));
        assertEquals("Jane", responseBody.get("firstName"));
        assertEquals("Smith", responseBody.get("lastName"));
        assertEquals("0887654321", responseBody.get("phoneNumber"));
        assertEquals("Tech Corp", responseBody.get("companyName"));
        assertEquals("1234567890", responseBody.get("taxId"));
        assertEquals("123 Main St", responseBody.get("address"));
        assertEquals("VERIFIED", responseBody.get("verificationStatus"));

        verify(userRepo, times(1)).findByUsernameIgnoreCase(username);
        verify(orgRepo, times(1)).findByUsernameIgnoreCase(username);
    }

    // Test case 5: Neither User nor Organizer found
    @Test
    public void testGetCurrentUserWhenUserNotFound() {
        String username = "nonexistent";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");
        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());
        when(orgRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);

        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("User not found", responseBody.get("error"));

        verify(userRepo, times(1)).findByUsernameIgnoreCase(username);
        verify(orgRepo, times(1)).findByUsernameIgnoreCase(username);
    }

    // Test case 6: Case-insensitive username lookup for User
    @Test
    public void testGetCurrentUserCaseInsensitiveUserSearch() {
        String username = "TestUser";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");

        User user = new User();
        user.setId(3L);
        user.setUsername("testuser");
        user.setEmail("testuser@example.com");
        user.setRole("USER");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setPhoneNumber("0800000000");
        user.setIdCardPassport("9876543210");

        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("3", ((Map<String, Object>) response.getBody()).get("id"));

        verify(userRepo).findByUsernameIgnoreCase(username);
    }

    // Test case 7: Case-insensitive username lookup for Organizer
    @Test
    public void testGetCurrentUserCaseInsensitiveOrganizerSearch() {
        String username = "ORG_Admin";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");
        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());

        Organizer organizer = new Organizer();
        organizer.setId(4L);
        organizer.setUsername("org_admin");
        organizer.setEmail("admin@org.com");
        organizer.setFirstName("Admin");
        organizer.setLastName("Org");
        organizer.setPhoneNumber("0811111111");
        organizer.setCompanyName("Admin Corp");
        organizer.setTaxId("5555555555");
        organizer.setAddress("456 Oak Ave");
        organizer.setVerificationStatus("PENDING");

        when(orgRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(organizer));

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("4", ((Map<String, Object>) response.getBody()).get("id"));

        verify(orgRepo).findByUsernameIgnoreCase(username);
    }

    // Test case 8: User with all fields populated
    @Test
    public void testGetCurrentUserWithAllFields() {
        String username = "fulluser";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");

        User user = new User();
        user.setId(5L);
        user.setUsername("fulluser");
        user.setEmail("full@example.com");
        user.setRole("USER");
        user.setFirstName("Full");
        user.setLastName("Name");
        user.setPhoneNumber("0899999999");
        user.setIdCardPassport("5555555555555");

        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();

        assertTrue(responseBody.containsKey("id"));
        assertTrue(responseBody.containsKey("username"));
        assertTrue(responseBody.containsKey("email"));
        assertTrue(responseBody.containsKey("role"));
        assertTrue(responseBody.containsKey("firstName"));
        assertTrue(responseBody.containsKey("lastName"));
        assertTrue(responseBody.containsKey("phoneNumber"));
        assertTrue(responseBody.containsKey("idCard"));
    }

    // Test case 9: Organizer with all fields populated
    @Test
    public void testGetCurrentOrganizerWithAllFields() {
        String username = "fullorg";
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        Authentication auth = mock(Authentication.class);
        MeController controller = new MeController(userRepo, orgRepo);

        when(auth.getName()).thenReturn(username);
        when(auth.getPrincipal()).thenReturn("principal");
        when(userRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.empty());

        Organizer organizer = new Organizer();
        organizer.setId(6L);
        organizer.setUsername("fullorg");
        organizer.setEmail("org@full.com");
        organizer.setFirstName("Full");
        organizer.setLastName("Organization");
        organizer.setPhoneNumber("0877777777");
        organizer.setCompanyName("Full Org Co.");
        organizer.setTaxId("9999999999");
        organizer.setAddress("999 Full St");
        organizer.setVerificationStatus("VERIFIED");

        when(orgRepo.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(organizer));

        ResponseEntity<?> response = controller.getCurrentUser(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();

        assertTrue(responseBody.containsKey("id"));
        assertTrue(responseBody.containsKey("username"));
        assertTrue(responseBody.containsKey("email"));
        assertTrue(responseBody.containsKey("role"));
        assertTrue(responseBody.containsKey("firstName"));
        assertTrue(responseBody.containsKey("lastName"));
        assertTrue(responseBody.containsKey("phoneNumber"));
        assertTrue(responseBody.containsKey("companyName"));
        assertTrue(responseBody.containsKey("taxId"));
        assertTrue(responseBody.containsKey("address"));
        assertTrue(responseBody.containsKey("verificationStatus"));
    }
}