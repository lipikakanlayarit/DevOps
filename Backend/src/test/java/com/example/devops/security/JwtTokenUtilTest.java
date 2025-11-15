package com.example.devops.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// ⭐ เพิ่ม import ใหม่ (ไม่ลบของเก่า)
import io.jsonwebtoken.security.Keys;
import java.security.Key;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class JwtTokenUtilTest {

    private JwtFilter filter;
    private final String secret =
            "1234567890123456789012345678901234567890123456789012345678901234";

    @BeforeEach
    void setup() throws Exception {
        filter = new JwtFilter();

        // Inject secret ผ่าน Reflection
        Field f = JwtFilter.class.getDeclaredField("jwtSecret");
        f.setAccessible(true);
        f.set(filter, secret);

        SecurityContextHolder.clearContext();
    }

    @Test
    void testShouldNotFilter_Options() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setMethod("OPTIONS");

        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    @Test
    void testShouldNotFilter_PublicPath() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/api/auth/login");

        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    @Test
    void testDoFilter_NoAuthorizationHeader() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
    }

    @Test
    void testDoFilter_BlankBearerToken() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer   ");

        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void testDoFilter_InvalidToken() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer x.y.z");

        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void testDoFilter_ValidToken() throws Exception {

        // ❌ โค้ดเก่าที่ jjwt เวอร์ชันใหม่ไม่รองรับ แต่เก็บไว้ตามที่ขอ
        // String jwt = Jwts.builder()
        //        .setSubject("alice")
        //        .claim("role", "ADMIN")
        //        .setIssuedAt(new Date())
        //        .signWith(SignatureAlgorithm.HS512, secret.getBytes(StandardCharsets.UTF_8))
        //        .compact();

        // ✅ โค้ดใหม่ รองรับ HS512 + key >= 512 bits
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String jwt = Jwts.builder()
                .setSubject("alice")
                .claim("role", "ADMIN")
                .setIssuedAt(new Date())
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer " + jwt);

        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        var auth = SecurityContextHolder.getContext().getAuthentication();

        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("alice");
        assertThat(auth.getAuthorities().iterator().next().getAuthority())
                .isEqualTo("ROLE_ADMIN");
    }
}
