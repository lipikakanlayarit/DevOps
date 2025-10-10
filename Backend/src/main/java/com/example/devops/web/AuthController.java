package com.example.devops.web;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.model.AdminUsers;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.AdminUserRepository;
import com.example.devops.security.JwtTokenUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final OrganizerRepo organizerRepo;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwt;

    public AuthController(UserRepository userRepository,
                          OrganizerRepo organizerRepo,
                          AdminUserRepository adminUserRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenUtil jwt) {
        this.userRepository = userRepository;
        this.organizerRepo = organizerRepo;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String identifier = body.getOrDefault("identifier", "").trim(); // email หรือ username
        String password   = body.getOrDefault("password", "").trim();

        if (identifier.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "identifier and password are required"));
        }

        // ===== 1) ADMIN =====
        Optional<AdminUsers> adminOpt =
                adminUserRepository.findByEmailIgnoreCase(identifier)
                        .or(() -> adminUserRepository.findByUsernameIgnoreCase(identifier));

        if (adminOpt.isPresent()) {
            AdminUsers admin = adminOpt.get();
            String hash = admin.getPasswordHash(); // @Column(name="password_hash")
            if (!passwordEncoder.matches(password, hash)) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            }
            String role = "ADMIN";
            String username = admin.getUsername();
            String token = jwt.generateToken(username, role, admin.getEmail());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", username,
                    "role", role
            ));
        }

        // ===== 2) ORGANIZER =====
        Optional<Organizer> orgOpt =
                organizerRepo.findByEmailIgnoreCase(identifier)
                        .or(() -> organizerRepo.findByUsernameIgnoreCase(identifier));

        if (orgOpt.isPresent()) {
            Organizer org = orgOpt.get();
            String hash = org.getPasswordHash();
            if (!passwordEncoder.matches(password, hash)) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            }
            String role = "ORGANIZER";
            String username = org.getUsername();
            String token = jwt.generateToken(username, role, org.getEmail());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", username,
                    "role", role
            ));
        }

        // ===== 3) USER =====
        Optional<User> userOpt =
                userRepository.findByEmailIgnoreCase(identifier)
                        .or(() -> userRepository.findByUsernameIgnoreCase(identifier));

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String hash = user.getPassword(); // mapped to password_hash
            if (!passwordEncoder.matches(password, hash)) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            }
            String role = (user.getRole() == null || user.getRole().isBlank())
                    ? "USER"
                    : user.getRole().trim().toUpperCase();
            String username = user.getUsername();
            String token = jwt.generateToken(username, role, user.getEmail());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", username,
                    "role", role
            ));
        }

        return ResponseEntity.status(401).body(Map.of("error", "User not found"));
    }

    /**
     * Register a new user account
     */
    @PostMapping("/register/user")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> body) {
        try {
            String username = body.getOrDefault("username", "").trim();
            String email = body.getOrDefault("email", "").trim();
            String password = body.getOrDefault("password", "").trim();
            
            // Validate required fields
            if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "username, email, and password are required"));
            }
            
            // Check if username already exists
            if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.status(409)
                    .body(Map.of("error", "Username already exists"));
            }
            
            // Check if email already exists
            if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.status(409)
                    .body(Map.of("error", "Email already exists"));
            }
            
            // Create new user
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password)); // Hash the password
            user.setRole("USER"); // Default role
            
            // Optional fields
            if (body.containsKey("firstName")) {
                user.setFirstName(body.get("firstName"));
            }
            if (body.containsKey("lastName")) {
                user.setLastName(body.get("lastName"));
            }
            if (body.containsKey("phoneNumber")) {
                user.setPhoneNumber(body.get("phoneNumber"));
            }
            if (body.containsKey("idCardPassport")) {
                user.setIdCardPassport(body.get("idCardPassport"));
            }
            
            // Save to database
            User savedUser = userRepository.save(user);
            
            return ResponseEntity.status(201).body(Map.of(
                "message", "User registered successfully",
                "user_id", savedUser.getId(),
                "username", savedUser.getUsername(),
                "email", savedUser.getEmail()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    /**
     * Register a new organizer account
     */
    @PostMapping("/register/organizer")
    public ResponseEntity<?> registerOrganizer(@RequestBody Map<String, String> body) {
        try {
            String username = body.getOrDefault("username", "").trim();
            String email = body.getOrDefault("email", "").trim();
            String password = body.getOrDefault("password", "").trim();
            
            // Validate required fields
            if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "username, email, and password are required"));
            }
            
            // Check if username already exists
            if (organizerRepo.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.status(409)
                    .body(Map.of("error", "Username already exists"));
            }
            
            // Check if email already exists
            if (organizerRepo.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.status(409)
                    .body(Map.of("error", "Email already exists"));
            }
            
            // Create new organizer
            Organizer organizer = new Organizer();
            organizer.setUsername(username);
            organizer.setEmail(email);
            organizer.setPasswordHash(passwordEncoder.encode(password)); // Hash the password
            organizer.setVerificationStatus("pending"); // Default status
            
            // Optional fields
            if (body.containsKey("firstName")) {
                organizer.setFirstName(body.get("firstName"));
            }
            if (body.containsKey("lastName")) {
                organizer.setLastName(body.get("lastName"));
            }
            if (body.containsKey("phoneNumber")) {
                organizer.setPhoneNumber(body.get("phoneNumber"));
            }
            if (body.containsKey("address")) {
                organizer.setAddress(body.get("address"));
            }
            if (body.containsKey("companyName")) {
                organizer.setCompanyName(body.get("companyName"));
            }
            if (body.containsKey("taxId")) {
                organizer.setTaxId(body.get("taxId"));
            }
            
            // Save to database
            Organizer savedOrganizer = organizerRepo.save(organizer);
            
            return ResponseEntity.status(201).body(Map.of(
                "message", "Organizer registered successfully",
                "organizer_id", savedOrganizer.getId(),
                "username", savedOrganizer.getUsername(),
                "email", savedOrganizer.getEmail(),
                "verification_status", savedOrganizer.getVerificationStatus()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }
}
