package com.example.devops.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> onAny(Exception ex) {
        ex.printStackTrace(); // dev only
        return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", ex.getMessage()
        ));
    }
}
