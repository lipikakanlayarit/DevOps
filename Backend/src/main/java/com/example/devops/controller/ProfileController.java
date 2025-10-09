package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(UserRepository userRepo,
                             OrganizerRepo organizerRepo,
                             PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /* ==================== GET PROFILE ==================== */
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = auth.getName();

        // ค้นหาใน User ก่อน
        var userOpt = userRepo.findByUsernameIgnoreCase(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(buildUserResponse(user));
        }

        // ถ้าไม่เจอ ค้นหาใน Organizer
        var orgOpt = organizerRepo.findByUsernameIgnoreCase(username);
        if (orgOpt.isPresent()) {
            Organizer org = orgOpt.get();
            return ResponseEntity.ok(buildOrganizerResponse(org));
        }

        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    /* ==================== UPDATE USER PROFILE ==================== */
    @PutMapping("/user")
    public ResponseEntity<?> updateUserProfile(
            @Valid @RequestBody UpdateUserRequest req,
            BindingResult br,
            Authentication auth) {

        if (br.hasErrors()) {
            var errors = br.getFieldErrors().stream()
                    .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                    .toList();
            return ResponseEntity.badRequest().body(Map.of("error", "Validation failed", "details", errors));
        }

        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = auth.getName();
        var userOpt = userRepo.findByUsernameIgnoreCase(username);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();

        // ตรวจสอบ email ซ้ำ (ถ้ามีการเปลี่ยน)
        if (!user.getEmail().equalsIgnoreCase(req.getEmail())) {
            if (userRepo.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }
            if (organizerRepo.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already taken by an organizer"));
            }
        }

        // อัปเดตข้อมูล
        user.setEmail(trimSafe(req.getEmail()));
        user.setFirstName(trimSafe(req.getFirstName()));
        user.setLastName(trimSafe(req.getLastName()));
        user.setPhoneNumber(trimSafe(req.getPhoneNumber()));

        if (req.getIdCard() != null && !req.getIdCard().trim().isEmpty()) {
            user.setIdCardPassport(trimSafe(req.getIdCard()));
        }

        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "user", buildUserResponse(user)));
    }

    /* ==================== UPDATE ORGANIZER PROFILE ==================== */
    @PutMapping("/organizer")
    public ResponseEntity<?> updateOrganizerProfile(
            @Valid @RequestBody UpdateOrganizerRequest req,
            BindingResult br,
            Authentication auth) {

        if (br.hasErrors()) {
            var errors = br.getFieldErrors().stream()
                    .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                    .toList();
            return ResponseEntity.badRequest().body(Map.of("error", "Validation failed", "details", errors));
        }

        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = auth.getName();
        var orgOpt = organizerRepo.findByUsernameIgnoreCase(username);

        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }

        Organizer org = orgOpt.get();

        // ตรวจสอบ email ซ้ำ (ถ้ามีการเปลี่ยน)
        if (!org.getEmail().equalsIgnoreCase(req.getEmail())) {
            if (organizerRepo.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }
            if (userRepo.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already taken by a user"));
            }
        }

        // อัปเดตข้อมูล
        org.setEmail(trimSafe(req.getEmail()));
        org.setFirstName(trimSafe(req.getFirstName()));
        org.setLastName(trimSafe(req.getLastName()));
        org.setPhoneNumber(trimSafe(req.getPhoneNumber()));
        org.setAddress(trimSafe(req.getAddress()));
        org.setCompanyName(trimSafe(req.getCompanyName()));
        org.setTaxId(trimSafe(req.getTaxId()));

        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "organizer", buildOrganizerResponse(org)));
    }

    /* ==================== DTO CLASSES ==================== */

    public static class UpdateUserRequest {
        @Email @NotBlank private String email;
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String phoneNumber;
        private String idCard;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getIdCard() { return idCard; }
        public void setIdCard(String idCard) { this.idCard = idCard; }
    }

    public static class UpdateOrganizerRequest {
        @Email @NotBlank private String email;
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String phoneNumber;
        @NotBlank private String address;
        @NotBlank private String companyName;
        @NotBlank private String taxId;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }
        public String getTaxId() { return taxId; }
        public void setTaxId(String taxId) { this.taxId = taxId; }
    }

    /* ==================== UTILITIES ==================== */

    private static String trimSafe(String s) {
        return s == null ? "" : s.trim();
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