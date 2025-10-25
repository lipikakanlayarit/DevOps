package com.example.devops.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /* ---------- helpers ---------- */

    private static Map<String, Object> baseError(HttpStatus status,
                                                 String code,
                                                 String message,
                                                 String path) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", status.value());
        m.put("error", code != null ? code : status.getReasonPhrase());
        // อนุญาต message เป็น null ได้ (อย่าใช้ Map.of)
        m.put("message", message);
        m.put("timestamp", Instant.now().toString());
        m.put("path", path);
        return m;
    }

    private static ResponseEntity<?> respond(HttpStatus status,
                                             String code,
                                             String message,
                                             String path) {
        return ResponseEntity.status(status).body(baseError(status, code, message, path));
    }

    /* ---------- 4xx: client errors ---------- */

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex,
                                                   HttpServletRequest req) {
        // ใช้กับ payload ไม่ถูกต้องทั่วๆไป
        return respond(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                HttpServletRequest req) {
        String msg = "Parameter '" + ex.getName() + "' has invalid value: " + ex.getValue();
        return respond(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH", msg, req.getRequestURI());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleNotReadable(HttpMessageNotReadableException ex,
                                               HttpServletRequest req) {
        return respond(HttpStatus.BAD_REQUEST, "MALFORMED_JSON", "Malformed JSON request", req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex,
                                              HttpServletRequest req) {
        List<Map<String, Object>> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> {
                    Map<String, Object> it = new LinkedHashMap<>();
                    it.put("field", fe.getField());
                    it.put("message", fe.getDefaultMessage());
                    it.put("rejectedValue", fe.getRejectedValue());
                    return it;
                })
                .collect(Collectors.toList());

        Map<String, Object> body = baseError(HttpStatus.UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR", "Validation failed", req.getRequestURI());
        body.put("errors", errors);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolation(ConstraintViolationException ex,
                                                       HttpServletRequest req) {
        List<Map<String, Object>> violations = ex.getConstraintViolations().stream()
                .map(cv -> {
                    Map<String, Object> it = new LinkedHashMap<>();
                    it.put("property", pathOf(cv));
                    it.put("message", cv.getMessage());
                    it.put("invalidValue", cv.getInvalidValue());
                    return it;
                })
                .collect(Collectors.toList());

        Map<String, Object> body = baseError(HttpStatus.BAD_REQUEST,
                "CONSTRAINT_VIOLATION", "Constraint violation", req.getRequestURI());
        body.put("errors", violations);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    private static String pathOf(ConstraintViolation<?> cv) {
        return cv.getPropertyPath() != null ? cv.getPropertyPath().toString() : "";
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex,
                                                 HttpServletRequest req) {
        // เช่น unique key ซ้ำ, foreign key ไม่ถูกต้อง
        return respond(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION",
                "Data integrity violation", req.getRequestURI());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex,
                                                HttpServletRequest req) {
        return respond(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access is denied", req.getRequestURI());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<?> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                      HttpServletRequest req) {
        return respond(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED",
                "Method not allowed", req.getRequestURI());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex,
                                                  HttpServletRequest req) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        String msg = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return respond(status, status.name(), msg, req.getRequestURI());
    }

    /* ---------- 5xx: server errors (fallback) ---------- */

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAny(Exception ex, HttpServletRequest req) {
        // dev only: log stacktrace
        ex.printStackTrace();
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                ex.getMessage(), req.getRequestURI());
    }
}
