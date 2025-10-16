package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ProfileControllerTest {

    // ==================== GET PROFILE TESTS ====================

    @Test
    public void testGetProfileWhenAuthenticationIsNull() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        ResponseEntity<?> response = controller.getProfile(null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        assertEquals("Unauthorized", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testGetProfileWhenPrincipalIsNull() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getPrincipal()).thenReturn(null);

        ResponseEntity<?> response = controller.getProfile(auth);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Unauthorized", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testGetProfileWhenUserFound() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getPrincipal()).thenReturn("principal");
        when(auth.getName()).thenReturn("testuser");

        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setRole("USER");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPhoneNumber("0812345678");
        user.setIdCardPassport("1234567890");

        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.getProfile(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("testuser", body.get("username"));
        assertEquals("test@example.com", body.get("email"));
    }

    @Test
    public void testGetProfileWhenOrganizerFound() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getPrincipal()).thenReturn("principal");
        when(auth.getName()).thenReturn("org1");

        when(userRepo.findByUsernameIgnoreCase("org1")).thenReturn(Optional.empty());

        Organizer org = new Organizer();
        org.setId(2L);
        org.setUsername("org1");
        org.setEmail("org@example.com");
        org.setFirstName("Jane");
        org.setLastName("Smith");
        org.setPhoneNumber("0887654321");
        org.setCompanyName("Tech Corp");
        org.setTaxId("1234567890");
        org.setAddress("123 Main St");
        org.setVerificationStatus("VERIFIED");

        when(orgRepo.findByUsernameIgnoreCase("org1")).thenReturn(Optional.of(org));

        ResponseEntity<?> response = controller.getProfile(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("org1", body.get("username"));
        assertEquals("ORGANIZER", body.get("role"));
    }

    @Test
    public void testGetProfileWhenUserNotFound() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getPrincipal()).thenReturn("principal");
        when(auth.getName()).thenReturn("nonexistent");

        when(userRepo.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());
        when(orgRepo.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getProfile(auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("User not found", ((Map<?, ?>) response.getBody()).get("error"));
    }

    // ==================== UPDATE USER PROFILE TESTS ====================

    @Test
    public void testUpdateUserProfileWhenBindingResultHasErrors() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var req = new ProfileController.UpdateUserRequest();
        req.setEmail("invalid");
        req.setFirstName("");
        req.setLastName("Doe");
        req.setPhoneNumber("0812345678");

        BindingResult br = mock(BindingResult.class);
        FieldError error = new FieldError("UpdateUserRequest", "firstName", "", false, null, null, "First name is required");
        when(br.hasErrors()).thenReturn(true);
        when(br.getFieldErrors()).thenReturn(List.of(error));

        var auth = mock(org.springframework.security.core.Authentication.class);

        ResponseEntity<?> response = controller.updateUserProfile(req, br, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Validation failed", body.get("error"));
    }

    @Test
    public void testUpdateUserProfileWhenAuthIsNull() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var req = new ProfileController.UpdateUserRequest();
        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        ResponseEntity<?> response = controller.updateUserProfile(req, br, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Unauthorized", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateUserProfileWhenUserNotFound() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("testuser");

        var req = new ProfileController.UpdateUserRequest();
        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.updateUserProfile(req, br, auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("User not found", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateUserProfileWhenEmailAlreadyExists() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("testuser");

        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("testuser");
        existingUser.setEmail("old@example.com");

        var req = new ProfileController.UpdateUserRequest();
        req.setEmail("duplicate@example.com");
        req.setFirstName("John");
        req.setLastName("Doe");
        req.setPhoneNumber("0812345678");

        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(existingUser));
        when(userRepo.findByEmailIgnoreCase("duplicate@example.com")).thenReturn(Optional.of(new User()));

        ResponseEntity<?> response = controller.updateUserProfile(req, br, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Email already exists", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateUserProfileWhenEmailTakenByOrganizer() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("testuser");

        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("testuser");
        existingUser.setEmail("old@example.com");

        var req = new ProfileController.UpdateUserRequest();
        req.setEmail("org@example.com");
        req.setFirstName("John");
        req.setLastName("Doe");
        req.setPhoneNumber("0812345678");

        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(existingUser));
        when(userRepo.findByEmailIgnoreCase("org@example.com")).thenReturn(Optional.empty());
        when(orgRepo.findByEmailIgnoreCase("org@example.com")).thenReturn(Optional.of(new Organizer()));

        ResponseEntity<?> response = controller.updateUserProfile(req, br, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Email already taken by an organizer", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateUserProfileSuccess() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("testuser");

        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("old@example.com");
        user.setRole("USER");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPhoneNumber("0812345678");
        user.setIdCardPassport("1234567890");

        var req = new ProfileController.UpdateUserRequest();
        req.setEmail("new@example.com");
        req.setFirstName("Jane");
        req.setLastName("Smith");
        req.setPhoneNumber("0899999999");
        req.setIdCard("9999999999");

        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(user));
        when(userRepo.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(orgRepo.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(userRepo.save(any(User.class))).thenReturn(user);

        ResponseEntity<?> response = controller.updateUserProfile(req, br, auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        verify(userRepo, times(1)).save(any(User.class));
    }

    // ==================== UPDATE ORGANIZER PROFILE TESTS ====================

    @Test
    public void testUpdateOrganizerProfileWhenBindingResultHasErrors() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var req = new ProfileController.UpdateOrganizerRequest();
        BindingResult br = mock(BindingResult.class);
        FieldError error = new FieldError("UpdateOrganizerRequest", "companyName", "", false, null, null, "Company name is required");
        when(br.hasErrors()).thenReturn(true);
        when(br.getFieldErrors()).thenReturn(List.of(error));

        var auth = mock(org.springframework.security.core.Authentication.class);

        ResponseEntity<?> response = controller.updateOrganizerProfile(req, br, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Validation failed", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateOrganizerProfileWhenAuthIsNull() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var req = new ProfileController.UpdateOrganizerRequest();
        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        ResponseEntity<?> response = controller.updateOrganizerProfile(req, br, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    public void testUpdateOrganizerProfileWhenOrganizerNotFound() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("org1");

        var req = new ProfileController.UpdateOrganizerRequest();
        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(orgRepo.findByUsernameIgnoreCase("org1")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.updateOrganizerProfile(req, br, auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Organizer not found", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateOrganizerProfileWhenEmailAlreadyExists() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("org1");

        Organizer existingOrg = new Organizer();
        existingOrg.setId(2L);
        existingOrg.setUsername("org1");
        existingOrg.setEmail("old@example.com");

        var req = new ProfileController.UpdateOrganizerRequest();
        req.setEmail("duplicate@example.com");
        req.setFirstName("Jane");
        req.setLastName("Smith");
        req.setPhoneNumber("0887654321");
        req.setAddress("123 Main St");
        req.setCompanyName("Tech Corp");
        req.setTaxId("1234567890");

        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(orgRepo.findByUsernameIgnoreCase("org1")).thenReturn(Optional.of(existingOrg));
        when(orgRepo.findByEmailIgnoreCase("duplicate@example.com")).thenReturn(Optional.of(new Organizer()));

        ResponseEntity<?> response = controller.updateOrganizerProfile(req, br, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Email already exists", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateOrganizerProfileWhenEmailTakenByUser() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("org1");

        Organizer existingOrg = new Organizer();
        existingOrg.setId(2L);
        existingOrg.setUsername("org1");
        existingOrg.setEmail("old@example.com");

        var req = new ProfileController.UpdateOrganizerRequest();
        req.setEmail("user@example.com");
        req.setFirstName("Jane");
        req.setLastName("Smith");
        req.setPhoneNumber("0887654321");
        req.setAddress("123 Main St");
        req.setCompanyName("Tech Corp");
        req.setTaxId("1234567890");

        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(orgRepo.findByUsernameIgnoreCase("org1")).thenReturn(Optional.of(existingOrg));
        when(orgRepo.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(new User()));

        ResponseEntity<?> response = controller.updateOrganizerProfile(req, br, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Email already taken by a user", ((Map<?, ?>) response.getBody()).get("error"));
    }

    @Test
    public void testUpdateOrganizerProfileSuccess() {
        UserRepository userRepo = mock(UserRepository.class);
        OrganizerRepo orgRepo = mock(OrganizerRepo.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ProfileController controller = new ProfileController(userRepo, orgRepo, encoder);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("org1");

        Organizer org = new Organizer();
        org.setId(2L);
        org.setUsername("org1");
        org.setEmail("old@example.com");
        org.setFirstName("Jane");
        org.setLastName("Smith");
        org.setPhoneNumber("0887654321");
        org.setAddress("123 Main St");
        org.setCompanyName("Tech Corp");
        org.setTaxId("1234567890");
        org.setVerificationStatus("VERIFIED");

        var req = new ProfileController.UpdateOrganizerRequest();
        req.setEmail("new@example.com");
        req.setFirstName("Jane");
        req.setLastName("Smith");
        req.setPhoneNumber("0899999999");
        req.setAddress("456 Oak Ave");
        req.setCompanyName("New Corp");
        req.setTaxId("9999999999");

        BindingResult br = mock(BindingResult.class);
        when(br.hasErrors()).thenReturn(false);

        when(orgRepo.findByUsernameIgnoreCase("org1")).thenReturn(Optional.of(org));
        when(orgRepo.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(userRepo.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(orgRepo.save(any(Organizer.class))).thenReturn(org);

        ResponseEntity<?> response = controller.updateOrganizerProfile(req, br, auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        verify(orgRepo, times(1)).save(any(Organizer.class));
    }
}