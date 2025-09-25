package com.example.devops.web;

import com.example.devops.model.User;
import com.example.devops.model.Organizers;
import com.example.devops.model.AdminUsers;
import com.example.devops.repo.UserRepository;
import com.example.devops.repo.OrganizerRepository;
import com.example.devops.repo.AdminUserRepository;
import com.example.devops.security.JwtTokenUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepo userRepo;
    private final OrganizerRepo organizerRepo;
    private final AdminUserRepo adminUserRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwt;

    public AuthController(UserRepo userRepo,
                          OrganizerRepo organizerRepo,
                          AdminUserRepo adminUserRepo,
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
        String id = firstNonNull(req.getIdentifier(), req.getUsername(), req.getEmail());
        String raw = req.getPassword();
        if (isBlank(id) || isBlank(raw)) throw new BadCredentialsException("Invalid credentials");

        // 1) users: หาได้ทั้ง username หรือ email
        Optional<User> u = userRepo.findByUsername(id).or(() -> userRepo.findByEmail(id));
        if (u.isPresent()) {
            User user = u.get();
            require(raw, user.getPassword());
            String role = user.getRole() == null ? "USER" : user.getRole();
            // ใช้เมธอดเดิมของคุณ
            String token = jwt.generateToken(user);
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "subject", user.getUsername(),
                    "role", role,
                    "type", "USER"
            ));
        }

        // 2) organizers: ใช้อีเมล
        Optional<Organizer> o = organizerRepo.findByEmail(id);
        if (o.isPresent()) {
            Organizer org = o.get();
            require(raw, org.getPassword());
            String role = org.getRole() == null ? "ORGANIZER" : org.getRole();
            String token = jwtTokenFor(org.getEmail(), role); // helper
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "subject", org.getEmail(),
                    "role", role,
                    "type", "ORGANIZER"
            ));
        }

        // 3) admin_users: ใช้อีเมล
        Optional<AdminUser> a = adminUserRepo.findByEmail(id);
        if (a.isPresent()) {
            AdminUser admin = a.get();
            require(raw, admin.getPassword());
            String role = admin.getRoleName() == null ? "ADMIN" : admin.getRoleName();
            String token = jwtTokenFor(admin.getEmail(), role); // helper
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "subject", admin.getEmail(),
                    "role", role,
                    "type", "ADMIN"
            ));
        }

        throw new BadCredentialsException("Invalid credentials");
    }

    // ===== helpers =====

    private void require(String raw, String hashed) {
        if (hashed == null || !passwordEncoder.matches(raw, hashed)) {
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static String firstNonNull(String a, String b, String c) {
        if (!isBlank(a)) return a;
        if (!isBlank(b)) return b;
        if (!isBlank(c)) return c;
        return null;
    }

    /**
     * สร้าง JWT สำหรับ organizer/admin:
     * - ถ้า JwtTokenUtil มีเมธอด generate(String subject, String role) จะเรียกใช้งาน
     * - ถ้าไม่มี จะดึง key ภายใน JwtTokenUtil ผ่านรีเฟล็กชัน แล้ว build token ตรง ๆ
     */
    private String jwtTokenFor(String subject, String role) {
        // 1) ลองเรียกเมธอด generate(subject, role) ถ้ามี
        try {
            var m = JwtTokenUtil.class.getMethod("generate", String.class, String.class);
            Object token = m.invoke(jwt, subject, role);
            if (token instanceof String s) return s;
        } catch (NoSuchMethodException ignore) {
            // ไม่มีเมธอดนี้ ก็ไปวิธีที่ 2
        } catch (Exception e) {
            throw new IllegalStateException("JWT generation via util failed", e);
        }

        // 2) ดึง key ภายใน JwtTokenUtil แล้วประกอบ token เอง
        try {
            var keyField = JwtTokenUtil.class.getDeclaredField("key");
            keyField.setAccessible(true);
            Key key = (Key) keyField.get(jwt);

            // TTL: ถ้ามีฟิลด์ ttlMs ใน util จะดึงมาใช้, ไม่งั้น default 24 ชม.
            long ttlMs = 24L * 60 * 60 * 1000;
            try {
                var ttlField = JwtTokenUtil.class.getDeclaredField("ttlMs");
                ttlField.setAccessible(true);
                ttlMs = (long) ttlField.get(jwt);
            } catch (NoSuchFieldException ignore) {}

            long now = System.currentTimeMillis();
            return Jwts.builder()
                    .setSubject(subject)
                    .claim("role", role)
                    .setIssuedAt(new Date(now))
                    .setExpiration(new Date(now + ttlMs))
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            throw new IllegalStateException("JWT key not accessible", e);
        }
    }

    // ===== request body =====
    public static class LoginRequest {
        private String identifier;
        private String username;
        private String email;
        private String password;

        public String getIdentifier() { return identifier; }
        public void setIdentifier(String identifier) { this.identifier = identifier; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
