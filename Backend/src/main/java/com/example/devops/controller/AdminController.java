package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;

    public AdminController(UserRepository userRepo, OrganizerRepo organizerRepo) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
    }

    /* ==================== USER MANAGEMENT ==================== */

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepo.findAll();
        var data = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("phoneNumber", u.getPhoneNumber());
            m.put("idCard", u.getIdCardPassport());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("users", data, "total", data.size()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User u = userOpt.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("email", u.getEmail());
        m.put("role", u.getRole());
        m.put("firstName", u.getFirstName());
        m.put("lastName", u.getLastName());
        m.put("phoneNumber", u.getPhoneNumber());
        m.put("idCard", u.getIdCardPassport());
        return ResponseEntity.ok(m);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        String upperRole = newRole.toUpperCase();

        // Validate role
        if (!List.of("USER", "ADMIN", "MODERATOR").contains(upperRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role. Use: USER, ADMIN, or MODERATOR"));
        }

        user.setRole(upperRole);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "User role updated to " + upperRole));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    /* ==================== ORGANIZER MANAGEMENT ==================== */

    @GetMapping("/organizers")
    public ResponseEntity<?> getAllOrganizers() {
        List<Organizer> orgs = organizerRepo.findAll();
        var data = orgs.stream().map(o -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", o.getId());
            m.put("username", o.getUsername());
            m.put("email", o.getEmail());
            m.put("firstName", o.getFirstName());
            m.put("lastName", o.getLastName());
            m.put("companyName", o.getCompanyName());
            m.put("taxId", o.getTaxId());
            m.put("phoneNumber", o.getPhoneNumber());
            m.put("address", o.getAddress());
            m.put("verificationStatus", o.getVerificationStatus());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("organizers", data, "total", data.size()));
    }

    @GetMapping("/organizers/{id}")
    public ResponseEntity<?> getOrganizerById(@PathVariable Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        Organizer o = orgOpt.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId());
        m.put("username", o.getUsername());
        m.put("email", o.getEmail());
        m.put("firstName", o.getFirstName());
        m.put("lastName", o.getLastName());
        m.put("companyName", o.getCompanyName());
        m.put("taxId", o.getTaxId());
        m.put("phoneNumber", o.getPhoneNumber());
        m.put("address", o.getAddress());
        m.put("verificationStatus", o.getVerificationStatus());
        return ResponseEntity.ok(m);
    }

    @PatchMapping("/organizers/{id}/verify")
    public ResponseEntity<?> verifyOrganizer(@PathVariable Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        Organizer org = orgOpt.get();
        org.setVerificationStatus("VERIFIED");
        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Organizer verified successfully"));
    }

    @PatchMapping("/organizers/{id}/reject")
    public ResponseEntity<?> rejectOrganizer(@PathVariable Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        Organizer org = orgOpt.get();
        org.setVerificationStatus("REJECTED");
        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Organizer rejected"));
    }

    @PatchMapping("/organizers/{id}/status")
    public ResponseEntity<?> updateOrganizerStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }

        String upperStatus = status.toUpperCase();
        if (!List.of("PENDING", "VERIFIED", "REJECTED", "SUSPENDED").contains(upperStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Use: PENDING, VERIFIED, REJECTED, or SUSPENDED"));
        }

        Organizer org = orgOpt.get();
        org.setVerificationStatus(upperStatus);
        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Organizer status updated to " + upperStatus));
    }

    @DeleteMapping("/organizers/{id}")
    public ResponseEntity<?> deleteOrganizer(@PathVariable Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        organizerRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Organizer deleted successfully"));
    }

    /* ==================== STATISTICS ==================== */

    @GetMapping("/stats")
    public ResponseEntity<?> getStatistics() {
        long totalUsers = userRepo.count();
        long totalOrganizers = organizerRepo.count();

        List<Organizer> orgs = organizerRepo.findAll();
        long pendingOrganizers = orgs.stream().filter(o -> "PENDING".equals(o.getVerificationStatus())).count();
        long verifiedOrganizers = orgs.stream().filter(o -> "VERIFIED".equals(o.getVerificationStatus())).count();
        long rejectedOrganizers = orgs.stream().filter(o -> "REJECTED".equals(o.getVerificationStatus())).count();

        List<User> users = userRepo.findAll();
        long adminCount = users.stream().filter(u -> "ADMIN".equals(u.getRole())).count();
        long regularUsers = users.stream().filter(u -> "USER".equals(u.getRole())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalOrganizers", totalOrganizers);
        stats.put("adminCount", adminCount);
        stats.put("regularUsers", regularUsers);
        stats.put("pendingOrganizers", pendingOrganizers);
        stats.put("verifiedOrganizers", verifiedOrganizers);
        stats.put("rejectedOrganizers", rejectedOrganizers);

        return ResponseEntity.ok(stats);
    }
}