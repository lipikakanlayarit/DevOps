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

import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtUtil;

    // Password validation: >=8 chars, มีตัวเล็ก/ใหญ่ และตัวเลข
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

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
            Map<String, Object> err = new HashMap<>();
            err.put("error", "username and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        String identifier = trimSafe(req.getUsername());
        String rawPassword = trimSafe(req.getPassword());

        // --------- ลอง User ก่อน (username หรือ email) ---------
        Optional<User> userOpt = userRepo.findByUsernameIgnoreCase(identifier);
        if (userOpt.isEmpty()) userOpt = userRepo.findByEmailIgnoreCase(identifier);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String stored = safeUserPassword(user);

            if (passwordMatches(rawPassword, stored)) {
                upgradeHashIfNeededForUser(user, stored, rawPassword);
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getEmail());
                return ResponseEntity.ok(buildAuthResponse(
                        token,
                        String.valueOf(user.getId()),
                        user.getUsername(),
                        user.getRole(),
                        user.getEmail()
                ));
            }
        }

        // --------- ไม่ผ่าน -> ลอง Organizer ---------
        Optional<Organizer> orgOpt = organizerRepo.findByUsernameIgnoreCase(identifier);
        if (orgOpt.isEmpty()) orgOpt = organizerRepo.findByEmailIgnoreCase(identifier);

        if (orgOpt.isPresent()) {
            Organizer org = orgOpt.get();
            String stored = safeOrganizerPassword(org);

            if (passwordMatches(rawPassword, stored)) {
                upgradeHashIfNeededForOrganizer(org, stored, rawPassword);
                String token = jwtUtil.generateToken(org.getUsername(), "ORGANIZER", org.getEmail());
                return ResponseEntity.ok(buildAuthResponse(
                        token,
                        String.valueOf(org.getId()),
                        org.getUsername(),
                        "ORGANIZER",
                        org.getEmail()
                ));
            }
        }

        Map<String, Object> bad = new HashMap<>();
        bad.put("error", "Invalid username/email or password");
        return ResponseEntity.status(401).body(bad);
    }

    /* ==================== USER SIGNUP ==================== */
    @PostMapping("/signup")
    public ResponseEntity<?> signupUser(@Valid @RequestBody UserSignupRequest req, BindingResult br) {
        if (br.hasErrors()) {
            List<Map<String, Object>> errors = br.getFieldErrors().stream()
                    .map(f -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("field", f.getField());
                        m.put("message", f.getDefaultMessage());
                        return m;
                    }).toList();
            Map<String, Object> res = new HashMap<>();
            res.put("error", "Missing or invalid fields for user signup");
            res.put("details", errors);
            return ResponseEntity.badRequest().body(res);
        }

        if (!PASSWORD_PATTERN.matcher(req.getPassword()).matches()) {
            Map<String, Object> res = new HashMap<>();
            res.put("error", "Password must be at least 8 characters with uppercase, lowercase, and number");
            return ResponseEntity.badRequest().body(res);
        }

        try {
            String username = trimSafe(req.getUsername());
            String email = trimSafe(req.getEmail());

            // Duplicate check in User
            if (userRepo.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Username already exists"));
            }
            if (userRepo.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Email already exists"));
            }

            // Duplicate check in Organizer
            if (organizerRepo.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Username already taken by an organizer"));
            }
            if (organizerRepo.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Email already taken by an organizer"));
            }

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            // entity ของโปรเจ็กต์นี้มักมี field password_hash mapped เป็น getPassword()/setPassword()
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setRole("USER");
            user.setFirstName(trimSafe(req.getFirstName()));
            user.setLastName(trimSafe(req.getLastName()));
            user.setPhoneNumber(trimSafe(req.getPhoneNumber()));
            user.setIdCardPassport(trimSafe(req.getIdCard()));

            userRepo.save(user);

            Map<String, Object> ok = new HashMap<>();
            ok.put("message", "User created successfully");
            return ResponseEntity.ok(ok);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(singleError("Registration failed: " + e.getMessage()));
        }
    }

    /* ==================== ORGANIZER SIGNUP ==================== */
    @PostMapping("/organizer/signup")
    public ResponseEntity<?> signupOrganizer(@Valid @RequestBody OrganizerSignupRequest req, BindingResult br) {
        if (br.hasErrors()) {
            List<Map<String, Object>> errors = br.getFieldErrors().stream()
                    .map(f -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("field", f.getField());
                        m.put("message", f.getDefaultMessage());
                        return m;
                    }).toList();
            Map<String, Object> res = new HashMap<>();
            res.put("error", "Missing or invalid fields for organizer signup");
            res.put("details", errors);
            return ResponseEntity.badRequest().body(res);
        }

        if (!PASSWORD_PATTERN.matcher(req.getPassword()).matches()) {
            return ResponseEntity.badRequest().body(singleError(
                    "Password must be at least 8 characters with uppercase, lowercase, and number"
            ));
        }

        try {
            String username = trimSafe(req.getUsername());
            String email = trimSafe(req.getEmail());

            // Dups in Organizer
            if (organizerRepo.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Username already exists"));
            }
            if (organizerRepo.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Email already exists"));
            }

            // Dups in User
            if (userRepo.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Username already taken by a user"));
            }
            if (userRepo.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.badRequest().body(singleError("Email already taken by a user"));
            }

            Organizer org = new Organizer();
            org.setUsername(username);
            org.setEmail(email);
            org.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            org.setFirstName(trimSafe(req.getFirstName()));
            org.setLastName(trimSafe(req.getLastName()));
            org.setPhoneNumber(trimSafe(req.getPhoneNumber()));
            org.setAddress(trimSafe(req.getAddress()));
            org.setCompanyName(trimSafe(req.getCompanyName()));
            org.setTaxId(trimSafe(req.getTaxId()));
            org.setVerificationStatus("PENDING");

            organizerRepo.save(org);

            Map<String, Object> ok = new HashMap<>();
            ok.put("message", "Organizer created successfully, pending verification");
            return ResponseEntity.ok(ok);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(singleError("Registration failed: " + e.getMessage()));
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

    private static Map<String, Object> singleError(String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("error", message);
        return m;
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

    /* ==================== password helpers ==================== */

    // รองรับทั้ง BCrypt ($2a/$2b/$2y) และ plaintext (สำหรับข้อมูลเก่า)
    private boolean passwordMatches(String raw, String stored) {
        if (stored == null) return false;
        stored = stored.trim();
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            return passwordEncoder.matches(raw, stored);
        }
        return raw.equals(stored);
    }

    private void upgradeHashIfNeededForUser(User user, String stored, String raw) {
        if (stored == null) return;
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) return;
        String newHash = passwordEncoder.encode(raw);
        // ในโปรเจ็กต์นี้ส่วนใหญ่ map password_hash -> getPassword()/setPassword()
        user.setPassword(newHash);
        userRepo.save(user);
    }

    private void upgradeHashIfNeededForOrganizer(Organizer org, String stored, String raw) {
        if (stored == null) return;
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) return;
        String newHash = passwordEncoder.encode(raw);
        org.setPasswordHash(newHash);
        organizerRepo.save(org);
    }

    private String safeUserPassword(User u) {
        // ถ้า entity ของคุณใช้ getPasswordHash() ให้เปลี่ยนบรรทัดนี้เป็น u.getPasswordHash()
        return u.getPassword();
    }

    private String safeOrganizerPassword(Organizer o) {
        return o.getPasswordHash();
    }
}
