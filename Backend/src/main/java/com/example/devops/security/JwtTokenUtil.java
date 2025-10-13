package com.example.devops.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenUtil {

    // ต้องยาวอย่างน้อย 32 characters สำหรับ HS256/HS512
    @Value("${app.jwt.secret:my-super-secret-key-for-jwt-token-signing-minimum-32-chars}")
    private String secret;

    // อายุโทเค็น (มิลลิวินาที) — ดีฟอลต์ 1 วัน
    @Value("${app.jwt.expiration:86400000}")
    private long expirationMs;

    // เผื่อเวลาเคลื่อน (วินาที) ป้องกันกรณีเวลาคลาดเคลื่อนเล็กน้อยระหว่าง client/server
    @Value("${app.jwt.allowedClockSkewSeconds:60}")
    private long allowedClockSkewSeconds;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String buildToken(Map<String, Object> claims, String subject) {
        long now = System.currentTimeMillis();
        Date issuedAt = new Date(now);
        Date expiration = new Date(now + expirationMs);

        String token = Jwts.builder()
                .setClaims(claims == null ? new HashMap<>() : claims)
                .setSubject(subject)
                .setIssuedAt(issuedAt)
                .setExpiration(expiration)
                .signWith(getSigningKey())
                .compact();

        // Debug log
        System.out.println("========================================");
        System.out.println("=== Token Generated ===");
        System.out.println("Username: " + subject);
        System.out.println("Claims: " + claims);
        System.out.println("Issued at: " + issuedAt);
        System.out.println("Expires at: " + expiration);
        System.out.println("Duration: " + (expirationMs / 1000 / 60 / 60) + " hours");
        System.out.println("Token preview: " + token.substring(0, Math.min(50, token.length())) + "...");
        System.out.println("========================================");

        return token;
    }

    public String generateToken(String username, String role, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("email", email);
        return buildToken(claims, username);
    }

    public Claims parseClaims(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .setAllowedClockSkewSeconds(allowedClockSkewSeconds) // ✅ เผื่อเวลาเคลื่อน
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Date now = new Date();
            Date expiry = claims.getExpiration();
            Date issuedAt = claims.getIssuedAt();

            System.out.println("=== Token Parse Debug ===");
            System.out.println("Subject (username): " + claims.getSubject());
            System.out.println("Role: " + claims.get("role"));
            System.out.println("Email: " + claims.get("email"));
            System.out.println("Issued at: " + issuedAt);
            System.out.println("Expires at: " + expiry);
            System.out.println("Current time: " + now);

            if (expiry.before(now)) {
                long diff = now.getTime() - expiry.getTime();
                System.err.println("✗✗✗ WARNING: Token is EXPIRED!");
                System.err.println("Expired " + (diff / 1000) + " seconds ago");
            } else {
                long timeLeft = expiry.getTime() - now.getTime();
                long minutesLeft = timeLeft / 1000 / 60;
                long hoursLeft = minutesLeft / 60;
                System.out.println("✓ Token is still valid");
                System.out.println("Time left: " + hoursLeft + " hours " + (minutesLeft % 60) + " minutes");
            }

            return claims;

        } catch (ExpiredJwtException e) {
            System.err.println("=== JWT Parse Error ===");
            System.err.println("JWT Parse Error: " + e.getMessage());
            throw e; // unchecked
        } catch (JwtException e) {
            System.err.println("=== JWT Parse Error ===");
            System.err.println("Error type: " + e.getClass().getSimpleName());
            System.err.println("Error message: " + e.getMessage());
            throw e; // unchecked
        } catch (Exception e) {
            System.err.println("=== JWT Parse Error (non-JWT) ===");
            System.err.println("Error type: " + e.getClass().getSimpleName());
            System.err.println("Error message: " + e.getMessage());
            throw new RuntimeException(e); // ✅ แปลงเป็น unchecked ป้องกัน compile error
        }
    }

    // ตรวจสอบว่า token valid หรือไม่
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            System.err.println("Token validation failed: " + e.getMessage());
            return false;
        }
    }

    // ดึง username จาก token
    public String getUsernameFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    // ดึง role จาก token
    public String getRoleFromToken(String token) {
        Claims claims = parseClaims(token);
        return (String) claims.get("role");
    }

    // ดึง email จาก token
    public String getEmailFromToken(String token) {
        Claims claims = parseClaims(token);
        return (String) claims.get("email");
    }

    // ตรวจสอบว่า token หมดอายุหรือยัง
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    // ดึงวันหมดอายุจาก token
    public Date getExpirationDateFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getExpiration();
    }

    // ดึงวันที่สร้างจาก token
    public Date getIssuedAtDateFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getIssuedAt();
    }
}
