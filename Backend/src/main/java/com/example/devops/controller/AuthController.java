package com.example.devops.controller;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.security.JwtTokenUtil;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtUtil;

    public AuthController(UserRepository userRepo,
                          OrganizerRepo organizerRepo,
                          PasswordEncoder passwordEncoder,
                          JwtTokenUtil jwtUtil) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /* ==================== LOGIN ==================== */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, BindingResult br) {
        if (br.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("error", "username and password are required"));
        }

        String identifier = trimSafe(req.getUsername());

        // ลองค้นใน User ก่อน
        var userOpt = userRepo.findByUsernameIgnoreCase(identifier);
        if (userOpt.isEmpty()) userOpt = userRepo.findByEmailIgnoreCase(identifier);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getEmail());
                return ResponseEntity.ok(buildAuthResponse(token, user.getId().toString(), user.getUsername(), user.getRole(), user.getEmail()));
            }
        }

        // ถ้าไม่เจอ ลอง Organizer
        var orgOpt = organizerRepo.findByUsernameIgnoreCase(identifier);
        if (orgOpt.isEmpty()) orgOpt = organizerRepo.findByEmailIgnoreCase(identifier);

        if (orgOpt.isPresent()) {
            Organizer org = orgOpt.get();
            if (passwordEncoder.matches(req.getPassword(), org.getPasswordHash())) {
                String token = jwtUtil.generateToken(org.getUsername(), "ORGANIZER", org.getEmail());
                return ResponseEntity.ok(buildAuthResponse(token, org.getId().toString(), org.getUsername(), "ORGANIZER", org.getEmail()));
            }
        }

        return ResponseEntity.status(401).body(Map.of("error", "Invalid username/email or password"));
    }

    /* ==================== USER SIGNUP ==================== */
    @PostMapping("/signup")
    public ResponseEntity<?> signupUser(@Valid @RequestBody UserSignupRequest req, BindingResult br) {
        if (br.hasErrors()) {
            var errors = br.getFieldErrors().stream()
                    .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                    .toList();
            return ResponseEntity.badRequest().body(Map.of("error", "Missing or invalid fields for user signup", "details", errors));
        }

        try {
            if (userRepo.findByUsernameIgnoreCase(trimSafe(req.getUsername())).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            if (userRepo.findByEmailIgnoreCase(trimSafe(req.getEmail())).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }

            User user = new User();
            user.setUsername(trimSafe(req.getUsername()));
            user.setEmail(trimSafe(req.getEmail()));
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setRole("USER");
            user.setFirstName(trimSafe(req.getFirstName()));
            user.setLastName(trimSafe(req.getLastName()));
            user.setPhoneNumber(trimSafe(req.getPhoneNumber()));
            user.setIdCardPassport(trimSafe(req.getIdCard()));

            userRepo.save(user);
            return ResponseEntity.ok(Map.of("message", "User created successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    /* ==================== ORGANIZER SIGNUP ==================== */
    @PostMapping("/organizer/signup")
    public ResponseEntity<?> signupOrganizer(@Valid @RequestBody OrganizerSignupRequest req, BindingResult br) {
        if (br.hasErrors()) {
            var errors = br.getFieldErrors().stream()
                    .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                    .toList();
            return ResponseEntity.badRequest().body(Map.of("error", "Missing or invalid fields for organizer signup", "details", errors));
        }

        try {
            if (organizerRepo.findByUsernameIgnoreCase(trimSafe(req.getUsername())).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            if (organizerRepo.findByEmailIgnoreCase(trimSafe(req.getEmail())).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }

            Organizer org = new Organizer();
            org.setUsername(trimSafe(req.getUsername()));
            org.setEmail(trimSafe(req.getEmail()));
            org.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            org.setFirstName(trimSafe(req.getFirstName()));
            org.setLastName(trimSafe(req.getLastName()));
            org.setPhoneNumber(trimSafe(req.getPhoneNumber()));
            org.setAddress(trimSafe(req.getAddress()));
            org.setCompanyName(trimSafe(req.getCompanyName()));
            org.setTaxId(trimSafe(req.getTaxId()));
            org.setVerificationStatus("PENDING");

            organizerRepo.save(org);
            return ResponseEntity.ok(Map.of("message", "Organizer created successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    /* ==================== DTO CLASSES ==================== */

    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class UserSignupRequest {
        @Email @NotBlank private String email;
        @NotBlank private String username;
        @NotBlank private String password;
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String phoneNumber;
        @NotBlank private String idCard;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getIdCard() { return idCard; }
        public void setIdCard(String idCard) { this.idCard = idCard; }
    }

    public static class OrganizerSignupRequest {
        @Email @NotBlank private String email;
        @NotBlank private String username;
        @NotBlank private String password;

        @JsonProperty("firstName") @NotBlank private String firstName;
        @JsonProperty("lastName") @NotBlank private String lastName;
        @JsonProperty("phoneNumber") @NotBlank private String phoneNumber;
        @JsonProperty("address") @NotBlank private String address;
        @JsonProperty("companyName") @NotBlank private String companyName;
        @JsonProperty("taxId") @NotBlank private String taxId;

        // getters/setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
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

    private static Map<String, Object> buildAuthResponse(String token, String id, String username, String role, String email) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", id);
        userData.put("username", username);
        userData.put("role", role);
        userData.put("email", email);
        response.put("user", userData);
        return response;
    }
}
