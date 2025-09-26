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

    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String id = firstNonNull(req.getIdentifier(), req.getUsername(), req.getEmail());
        String raw = req.getPassword();
        if (isBlank(id) || isBlank(raw)) throw new BadCredentialsException("Invalid credentials");

        // users: username OR email
        Optional<User> u = userRepository.findByUsername(id).or(() -> userRepository.findByEmail(id));
        if (u.isPresent()) {
            User user = u.get();
            requireMatches(raw, user.getPassword());
            String role = user.getRole() == null ? "USER" : user.getRole();
            String token = jwt.generate(user.getUsername(), role);
            return ResponseEntity.ok(Map.of("token", token, "subject", user.getUsername(), "role", role, "type", "USER"));
        }

        // organizers: email
        Optional<Organizer> o = organizerRepo.findByEmail(id);
        if (o.isPresent()) {
            Organizer org = o.get();
            requireMatches(raw, org.getPassword());
            String role = org.getRole() == null ? "ORGANIZER" : org.getRole();
            String token = jwt.generate(org.getEmail(), role);
            return ResponseEntity.ok(Map.of("token", token, "subject", org.getEmail(), "role", role, "type", "ORGANIZER"));
        }

        // admin_users: email
        Optional<AdminUsers> a = adminUserRepository.findByEmail(id);
        if (a.isPresent()) {
            AdminUsers admin = a.get();
            requireMatches(raw, admin.getPassword());
            String role = admin.getRoleName() == null ? "ADMIN" : admin.getRoleName();
            String token = jwt.generate(admin.getEmail(), role);
            return ResponseEntity.ok(Map.of("token", token, "subject", admin.getEmail(), "role", role, "type", "ADMIN"));
        }

        throw new BadCredentialsException("Invalid credentials");
    }

    // helpers
    private void requireMatches(String raw, String hashed) {
        if (hashed == null || !passwordEncoder.matches(raw, hashed)) {
            throw new BadCredentialsException("Invalid credentials");
        }
    }
    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private static String firstNonNull(String a, String b, String c) {
        if (!isBlank(a)) return a; if (!isBlank(b)) return b; if (!isBlank(c)) return c; return null;
    }

    public static class LoginRequest {
        private String identifier; private String username; private String email; private String password;
        public String getIdentifier() { return identifier; } public void setIdentifier(String identifier) { this.identifier = identifier; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; } public void setPassword(String password) { this.password = password; }
    }
}
