package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class MeController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;

    public MeController(UserRepository userRepo, OrganizerRepo organizerRepo) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = auth.getName();

        // ลองหาใน User ก่อน
        var userOpt = userRepo.findByUsernameIgnoreCase(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(buildUserResponse(user));
        }

        // ถ้าไม่เจอ ลองหาใน Organizer
        var orgOpt = organizerRepo.findByUsernameIgnoreCase(username);
        if (orgOpt.isPresent()) {
            Organizer org = orgOpt.get();
            return ResponseEntity.ok(buildOrganizerResponse(org));
        }

        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId().toString());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("phoneNumber", user.getPhoneNumber());
        response.put("idCard", user.getIdCardPassport());
        return response;
    }

    private Map<String, Object> buildOrganizerResponse(Organizer org) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", org.getId().toString());
        response.put("username", org.getUsername());
        response.put("email", org.getEmail());
        response.put("role", "ORGANIZER");
        response.put("firstName", org.getFirstName());
        response.put("lastName", org.getLastName());
        response.put("phoneNumber", org.getPhoneNumber());
        response.put("companyName", org.getCompanyName());
        response.put("taxId", org.getTaxId());
        response.put("address", org.getAddress());
        response.put("verificationStatus", org.getVerificationStatus());
        return response;
    }
}