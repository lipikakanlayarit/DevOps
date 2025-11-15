package com.example.devops.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest req;

    @BeforeEach
    void setup() {
        handler = new GlobalExceptionHandler();
        req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn("/api/test");
    }

    // ===============================================================
    // IllegalArgumentException
    // ===============================================================
    @Test
    void testIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("bad");

        ResponseEntity<?> resp = handler.handleIllegalArgument(ex, req);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("BAD_REQUEST");
        assertThat(body.get("message")).isEqualTo("bad");
    }

    // ===============================================================
    // MethodArgumentTypeMismatchException
    // ===============================================================
    @Test
    void testTypeMismatch() {
        MethodArgumentTypeMismatchException ex =
                new MethodArgumentTypeMismatchException("abc", Integer.class, "id", null, new RuntimeException());

        ResponseEntity<?> resp = handler.handleTypeMismatch(ex, req);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("TYPE_MISMATCH");
    }

    // ===============================================================
    // HttpMessageNotReadableException
    // ===============================================================
    @Test
    void testNotReadable() {
        ResponseEntity<?> resp = handler.handleNotReadable(
                new HttpMessageNotReadableException("badjson"), req);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("MALFORMED_JSON");
    }

    // ===============================================================
    // MethodArgumentNotValidException
    // ===============================================================
    @Test
    void testValidation() {
        BindingResult br = mock(BindingResult.class);
        when(br.getFieldErrors()).thenReturn(
                List.of(new FieldError("obj", "email", "must not be blank"))
        );

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, br);

        ResponseEntity<?> resp = handler.handleValidation(ex, req);

        assertThat(resp.getStatusCode().value()).isEqualTo(422);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("VALIDATION_ERROR");

        List<?> errs = (List<?>) body.get("errors");
        assertThat(errs).hasSize(1);
    }

    // ===============================================================
    // ConstraintViolationException
    // ===============================================================
    @Test
    void testConstraintViolation() {
        ConstraintViolation<?> v = mock(ConstraintViolation.class);
        when(v.getMessage()).thenReturn("invalid");
        when(v.getInvalidValue()).thenReturn("xxx");

        Path mockPath = mock(Path.class);
        when(mockPath.toString()).thenReturn("name");
        when(v.getPropertyPath()).thenReturn(mockPath);

        ConstraintViolationException ex = new ConstraintViolationException(Set.of(v));

        ResponseEntity<?> resp = handler.handleConstraintViolation(ex, req);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);

        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("CONSTRAINT_VIOLATION");

        List<?> list = (List<?>) body.get("errors");
        assertThat(list).hasSize(1);

        Map<String,Object> item = cast(list.get(0));
        assertThat(item.get("property")).isEqualTo("name");
        assertThat(item.get("message")).isEqualTo("invalid");
        assertThat(item.get("invalidValue")).isEqualTo("xxx");
    }

    // ===============================================================
    // DataIntegrityViolation
    // ===============================================================
    @Test
    void testDataIntegrity() {
        ResponseEntity<?> resp = handler.handleDataIntegrity(
                new DataIntegrityViolationException("duplicate"), req);

        assertThat(resp.getStatusCode().value()).isEqualTo(409);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("DATA_INTEGRITY_VIOLATION");
    }

    // ===============================================================
    // AccessDeniedException
    // ===============================================================
    @Test
    void testAccessDenied() {
        ResponseEntity<?> resp = handler.handleAccessDenied(
                new AccessDeniedException("nope"), req);

        assertThat(resp.getStatusCode().value()).isEqualTo(403);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("FORBIDDEN");
    }

    // ===============================================================
    // HttpRequestMethodNotSupported
    // ===============================================================
    @Test
    void testMethodNotSupported() {
        HttpRequestMethodNotSupportedException ex =
                new HttpRequestMethodNotSupportedException("DELETE");

        ResponseEntity<?> resp = handler.handleMethodNotSupported(ex, req);

        assertThat(resp.getStatusCode().value()).isEqualTo(405);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("METHOD_NOT_ALLOWED");
    }

    // ===============================================================
    // ResponseStatusException
    // ===============================================================
    @Test
    void testResponseStatus() {
        ResponseStatusException ex =
                new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "missing");

        ResponseEntity<?> resp = handler.handleResponseStatus(ex, req);

        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("message")).isEqualTo("missing");
    }

    // ===============================================================
    // Fallback: Exception.class
    // ===============================================================
    @Test
    void testHandleAny() {
        ResponseEntity<?> resp = handler.handleAny(new RuntimeException("boom"), req);

        assertThat(resp.getStatusCode().value()).isEqualTo(500);
        Map<String,Object> body = cast(resp.getBody());
        assertThat(body.get("error")).isEqualTo("INTERNAL_SERVER_ERROR");
    }

    // ===============================================================
    // Helper
    // ===============================================================
    @SuppressWarnings("unchecked")
    private <T> T cast(Object o) {
        return (T) o;
    }
}
