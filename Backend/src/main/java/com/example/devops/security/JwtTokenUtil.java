package com.example.devops.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Optional;

/**
 * JWT utility ที่เป็น Spring Bean (@Component) เพื่อให้ JwtFilter สามารถ @Autowired ได้
 * - รองรับ ENV: JWT_SECRET_BASE64 (base64) หรือ JWT_SECRET (plain text) ถ้าไม่ตั้งจะใช้ค่า dev fallback ที่ยาวพอ
 * - ใช้ HS512 ซึ่งต้องการ key >= 64 bytes
 */
@Component
public class JwtTokenUtil {

    private final SecretKey key;
    private final long defaultTtlMillis;

    public JwtTokenUtil() {
        this.key = resolveKey();
        // อายุโทเคนดีฟอลต์ 4 ชั่วโมง
        this.defaultTtlMillis = 4 * 60 * 60 * 1000L;
    }

    public JwtTokenUtil(long ttlMillis) {
        this.key = resolveKey();
        this.defaultTtlMillis = ttlMillis;
    }

    public String generateToken(String username, String role, String email) {
        long now = System.currentTimeMillis();
        Date issuedAt = new Date(now);
        Date expiry = new Date(now + defaultTtlMillis);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("email", email)
                .setIssuedAt(issuedAt)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /* ---------------------- helpers ---------------------- */

    private SecretKey resolveKey() {
        // 1) ใช้ BASE64 ถ้ามี (แนะนำสำหรับโปรดักชัน)
        String base64 = getenvOrProp("JWT_SECRET_BASE64").orElse(null);
        if (base64 != null && !base64.isBlank()) {
            byte[] decoded = Decoders.BASE64.decode(base64.trim());
            if (decoded.length >= 64) {
                return Keys.hmacShaKeyFor(decoded);
            }
        }

        // 2) ใช้ JWT_SECRET (plain text) ถ้ามี; ถ้าสั้นกว่า 64 bytes ให้ pad สำหรับ dev
        String secret = getenvOrProp("JWT_SECRET").orElse(null);
        if (secret != null && !secret.isBlank()) {
            byte[] raw = secret.trim().getBytes();
            if (raw.length < 64) {
                byte[] padded = new byte[64];
                for (int i = 0; i < 64; i++) {
                    padded[i] = raw[i % raw.length];
                }
                return Keys.hmacShaKeyFor(padded);
            } else {
                return Keys.hmacShaKeyFor(raw);
            }
        }

        // 3) Fallback (DEV ONLY): คีย์ดีฟอลต์ที่ยาวพอ กัน WeakKeyException
        String devDefault =
                "DEV-DEFAULT-KEY-THIS-IS-LONG-ENOUGH-FOR-HS512-" +
                "PLEASE-OVERRIDE-IN-ENV-OR-PROPERTIES-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return Keys.hmacShaKeyFor(devDefault.getBytes());
    }

    private Optional<String> getenvOrProp(String name) {
        String fromEnv = System.getenv(name);
        if (fromEnv != null) return Optional.of(fromEnv);
        String fromProp = System.getProperty(name);
        if (fromProp != null) return Optional.of(fromProp);
        return Optional.empty();
    }
}
