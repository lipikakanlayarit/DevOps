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
}
