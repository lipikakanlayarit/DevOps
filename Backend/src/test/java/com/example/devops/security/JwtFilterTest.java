package com.example.devops.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class JwtFilterTest {

    private JwtFilter filter;
    private String secret = "unit-test-secret-key-123456";

    @BeforeEach
    void setup() throws Exception {
        filter = new JwtFilter();

        // 🔥 ใช้ Reflection เพื่อ set jwtSecret แบบถูกต้อง (ไม่ใช้ Mockito)
        Field f = JwtFilter.class.getDeclaredField("jwtSecret");
        f.setAccessible(true);
        f.set(filter, secret);

        SecurityContextHolder.clearContext();
    }

    // 1) OPTIONS = shouldNotFilter
    @Test
    void testShouldNotFilter_Option() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setMethod("OPTIONS");

        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    // 2) public path = shouldNotFilter
    @Test
    void testShouldNotFilter_PublicPath() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/api/auth/login");

        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    // 3) ไม่มี header -> ไม่ authenticate
    @Test
    void testDoFilter_NoAuthorizationHeader() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain, times(1)).doFilter(req, res);
    }

    // 4) Bearer token ว่าง
    @Test
    void testDoFilter_BlankBearerToken() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer    ");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // 5) Token invalid
    @Test
    void testDoFilter_InvalidToken() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer x.y.z");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
