package com.example.devops.security;

import com.example.devops.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenUtil {

    @Value("${app.jwt.secret:dev-secret-dev-secret-dev-secret-dev}")
    private String secret;

    @Value("${app.jwt.expiration:86400000}") // 1 วัน
    private long expirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private String buildToken(Map<String, Object> claims, String subject) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims == null ? new HashMap<>() : claims)
                .setSubject(subject)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", user.getUserId());
        claims.put("role", user.getRole() == null ? "USER" : user.getRole());
        String subject = user.getUsername() != null ? user.getUsername() : user.getEmail();
        return buildToken(claims, subject);
    }

    public String generateToken(String subject, Map<String, Object> extraClaims) {
        return buildToken(extraClaims, subject);
    }

    /** convenience: เรียกแบบ (subject, role) ตรง ๆ */
    public String generate(String subject, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role == null ? "USER" : role);
        return buildToken(claims, subject);
    }

    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validate(String token) {
        try {
            Date exp = parseClaims(token).getExpiration();
            return exp == null || exp.after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUsername(String token) {
        try {
            return parseClaims(token).getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public String getRole(String token) {
        try {
            Object v = parseClaims(token).get("role");
            return v == null ? null : String.valueOf(v);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
