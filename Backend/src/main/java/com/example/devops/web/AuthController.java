package com.example.devops.web;

import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

record LoginReq(@NotBlank String username, @NotBlank String password) {}
record LoginRes(Map<String, String> user, String token) {}

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static String roleFromUsername(String username) {
        if ("ADMIN".equalsIgnoreCase(username)) return "ADMIN";
        if ("ORGANIZER".equalsIgnoreCase(username)) return "ORGANIZER";
        return "USER";
    }

    private static Map<String, String> user(String username, String role) {
        return Map.of("id", "1", "username", username, "role", role);
    }

    @PostMapping("/login")
    public LoginRes login(@RequestBody LoginReq req){
        String role = roleFromUsername(req.username());
        // token ใส่ username + role ลงไป (mock)
        String token = "fake-jwt-" + req.username() + "-" + role;
        return new LoginRes(user(req.username(), role), token);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring("Bearer ".length()).trim();
        // รูปแบบ token: fake-jwt-<username>-<role>
        if (!token.startsWith("fake-jwt-")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String[] parts = token.split("-", 4); // ["fake","jwt","<username>","<role>"]
        if (parts.length < 4) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String username = parts[2];
        String role = parts[3];
        return ResponseEntity.ok(user(username, role));
    }

    @PostMapping("/logout")
    public void logout() {}
}
