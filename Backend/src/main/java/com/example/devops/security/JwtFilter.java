package com.example.devops.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwt;

    // Endpoints ที่ไม่ต้องตรวจสอบ token
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/organizer/signup",
            "/api/auth/register-user",
            "/api/auth/register-organizer",
            "/actuator/health",
            "/swagger-ui",
            "/v3/api-docs",
            "/error"
    );

    public JwtFilter(JwtTokenUtil jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Debug log
        System.out.println("========================================");
        System.out.println("=== JwtFilter Debug ===");
        System.out.println("Path: " + path);
        System.out.println("Method: " + method);

        // ข้าม OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            System.out.println("Action: Skipping OPTIONS request");
            System.out.println("========================================");
            chain.doFilter(request, response);
            return;
        }

        // ข้ามทุก path ที่อยู่ใน excluded list
        if (EXCLUDED_PATHS.stream().anyMatch(path::startsWith)) {
            System.out.println("Action: Path is in excluded list, skipping JWT check");
            System.out.println("========================================");
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        System.out.println("Authorization header present: " + (authHeader != null));

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("Token extracted successfully");
            System.out.println("Token length: " + token.length());
            System.out.println("Token preview: " + token.substring(0, Math.min(30, token.length())) + "...");

            try {
                Claims claims = jwt.parseClaims(token);
                String username = claims.getSubject();
                String role = (String) claims.get("role");

                System.out.println("✓ Token parsed successfully!");
                System.out.println("Username from token: " + username);
                System.out.println("Role from token: " + role);

                if (username != null && role != null) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    System.out.println("✓✓✓ Authentication SET in SecurityContext");
                    System.out.println("Authorities: " + auth.getAuthorities());
                } else {
                    System.out.println("✗ Username or role is null - Authentication NOT set");
                }
            } catch (Exception e) {
                System.err.println("✗✗✗ JWT Filter - Invalid token");
                System.err.println("Error type: " + e.getClass().getSimpleName());
                System.err.println("Error message: " + e.getMessage());
                e.printStackTrace();
                // ไม่ต้อง set authentication
            }
        } else {
            System.out.println("✗ No valid Authorization header found");
            if (authHeader != null) {
                System.out.println("Header value: " + authHeader);
            }
        }

        System.out.println("========================================");
        chain.doFilter(request, response);
    }
}