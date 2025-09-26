package com.example.devops.web;

import com.example.devops.model.User;
import com.example.devops.model.Organizer;
import com.example.devops.model.AdminUsers;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.AdminUserRepository;
import com.example.devops.security.JwtTokenUtil;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final AdminUserRepository adminUserRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwt;

    public AuthController(UserRepository userRepo,
                          OrganizerRepo organizerRepo,
                          AdminUserRepository adminUserRepo,
                          PasswordEncoder passwordEncoder,
                          JwtTokenUtil jwt) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
        this.adminUserRepo = adminUserRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        final String identifier = req.getIdentifier();
        final String raw = req.getPassword();
        if (identifier == null || identifier.isBlank() || raw == null || raw.isBlank()) {
            throw new BadCredentialsException("Invalid credentials");
        }

        // ---- 1) users ----
        Optional<User> u = userRepo.findByIdentifier(identifier);
        if (u.isPresent()) {
            User user = u.get();
            require(raw, user.getPasswordHash());

            String token = jwt.generateToken(
                    user.getUsername() != null ? user.getUsername() : user.getEmail(),
                    Map.of("uid", user.getUserId(), "role", user.getRole() == null ? "USER" : user.getRole())
            );

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "type", "USER",
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));
        }

        // ---- 2) organizers ----
        Optional<Organizer> o = organizerRepo.findByEmail(identifier);
        if (o.isPresent()) {
            Organizer org = o.get();
            require(raw, org.getPasswordHash());

            String token = jwt.generateToken(
                    org.getEmail(),
                    Map.of("oid", org.getOrganizerId(), "role", "ORGANIZER")
            );

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "type", "ORGANIZER",
                    "email", org.getEmail()
            ));
        }

        // ---- 3) admin_users ----
        Optional<AdminUsers> a = adminUserRepo.findByEmail(identifier);
        if (a.isPresent()) {
            AdminUsers admin = a.get();
            require(raw, admin.getPasswordHash());

            String role  = admin.getRole();
            String email = admin.getEmail();
            Long   aid   = admin.getAdminId();

            String token = jwt.generateToken(email, Map.of("aid", aid, "role", role));

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "type", "ADMIN",
                    "email", email
            ));
        }

        throw new BadCredentialsException("Invalid credentials");
    }

    private void require(String raw, String hashed) {
        if (hashed == null || !passwordEncoder.matches(raw, hashed)) {
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    // ===== Request Body =====
    public static class LoginRequest {
        private String identifier;
        private String password;

        public String getIdentifier() { return identifier; }
        public void setIdentifier(String identifier) { this.identifier = identifier; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
