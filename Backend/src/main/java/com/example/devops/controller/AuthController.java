package com.web;  // ✅ เปลี่ยนจาก com.example.devops.controller

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.security.JwtTokenUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String identifier = req.getUsername().trim();

        // ลอง User ก่อน (username หรือ email)
        var userOpt = userRepo.findByUsernameIgnoreCase(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepo.findByEmailIgnoreCase(identifier);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(
                        user.getUsername(),
                        user.getRole(),
                        user.getEmail()
                );

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", user.getId().toString());
                userData.put("username", user.getUsername());
                userData.put("role", user.getRole());
                userData.put("email", user.getEmail());
                response.put("user", userData);

                return ResponseEntity.ok(response);
            }
        }

        // ลอง Organizer (username หรือ email)
        var orgOpt = organizerRepo.findByUsernameIgnoreCase(identifier);
        if (orgOpt.isEmpty()) {
            orgOpt = organizerRepo.findByEmailIgnoreCase(identifier);
        }

        if (orgOpt.isPresent()) {
            Organizer org = orgOpt.get();
            if (passwordEncoder.matches(req.getPassword(), org.getPasswordHash())) {
                String token = jwtUtil.generateToken(
                        org.getUsername(),
                        "ORGANIZER",
                        org.getEmail()
                );

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", org.getId().toString());
                userData.put("username", org.getUsername());
                userData.put("role", "ORGANIZER");
                userData.put("email", org.getEmail());
                response.put("user", userData);

                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid username/email or password"));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signupUser(@RequestBody UserSignupRequest req) {
        try {
            // ตรวจสอบ username ซ้ำ
            if (userRepo.findByUsernameIgnoreCase(req.getUsername()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already exists"));
            }

            // ตรวจสอบ email ซ้ำ
            if (userRepo.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already exists"));
            }

            // สร้าง User ใหม่
            User user = new User();
            user.setUsername(req.getUsername().trim());
            user.setEmail(req.getEmail().trim());
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setRole("USER");
            user.setFirstName(req.getFirstName().trim());
            user.setLastName(req.getLastName().trim());
            user.setPhoneNumber(req.getPhoneNumber().trim());
            user.setIdCardPassport(req.getIdCard().trim());

            userRepo.save(user);

            return ResponseEntity.ok(Map.of("message", "User created successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/organizer/signup")
    public ResponseEntity<?> signupOrganizer(@RequestBody OrganizerSignupRequest req) {
        try {
            // ตรวจสอบ username ซ้ำ
            if (organizerRepo.findByUsernameIgnoreCase(req.getUsername()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already exists"));
            }

            // ตรวจสอบ email ซ้ำ
            if (organizerRepo.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already exists"));
            }

            // สร้าง Organizer ใหม่
            Organizer org = new Organizer();
            org.setUsername(req.getUsername().trim());
            org.setEmail(req.getEmail().trim());
            org.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            org.setFirstName(req.getFirstName().trim());
            org.setLastName(req.getLastName().trim());
            org.setPhoneNumber(req.getPhoneNumber().trim());
            org.setAddress(req.getAddress().trim());
            org.setCompanyName(req.getCompanyName().trim());
            org.setTaxId(req.getTaxId().trim());
            org.setVerificationStatus("PENDING");

            organizerRepo.save(org);

            return ResponseEntity.ok(Map.of("message", "Organizer created successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    // DTO Classes
    static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    static class UserSignupRequest {
        private String email;
        private String username;
        private String password;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String idCard;

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

    static class OrganizerSignupRequest {
        private String email;
        private String username;
        private String password;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String address;
        private String companyName;
        private String taxId;

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
}