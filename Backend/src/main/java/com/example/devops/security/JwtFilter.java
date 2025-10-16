// src/main/java/com/example/devops/security/JwtFilter.java
package com.example.devops.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Pattern BEARER = Pattern.compile("(?i)^Bearer\\s+");

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    // ถ้ามี path ที่อยากข้าม (public) ใส่ไว้ที่นี่ก็ได้
    private static final String[] EXCLUDED = new String[] {
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/organizer/signup",
            "/api/auth/register-user",
            "/api/auth/register-organizer",
            "/actuator/health",
            "/error",
            "/v3/api-docs",
            "/v3/api-docs/",
            "/swagger-ui",
            "/swagger-ui/"
    };

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String p : EXCLUDED) {
            if (path.equals(p) || path.startsWith(p)) return true;
        }
        // อนุญาต preflight
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && !authHeader.isBlank()) {
            String token = BEARER.matcher(authHeader).replaceFirst(""); // ตัด "Bearer " ออกแบบยืดหยุ่น
            if (!token.isBlank()) {
                try {
                    // ✅ Verify HS512 ด้วย secret เดียวกับฝั่ง login
                    Jws<Claims> jws = Jwts.parserBuilder()
                            .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                            .build()
                            .parseClaimsJws(token);

                    Claims claims = jws.getBody();

                    // sub = username, role = "ORGANIZER" | "ADMIN" | "USER" เป็นต้น
                    String username = claims.getSubject();
                    String role = claims.get("role", String.class);

                    if (username != null && role != null) {
                        // ✅ map เป็น ROLE_XXX เพื่อให้ hasRole("ORGANIZER") ใช้ได้
                        List<GrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + role)
                        );

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(username, null, authorities);

                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                } catch (Exception e) {
                    // verify ไม่ผ่าน -> ปล่อยผ่านไปให้ entry point ตอบ 401
                }
            }
        }

        chain.doFilter(request, response);
    }
}
