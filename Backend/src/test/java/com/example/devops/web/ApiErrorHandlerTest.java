package com.example.devops.web;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ApiErrorHandlerTest {

    @Test
    void testBadRequest() {

        // ⭐ ใช้ Mockito mock exception → ไม่ต้องสร้าง BindingResult
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);

        ApiErrorHandler handler = new ApiErrorHandler();

        // เรียกเมธอดจริง
        ResponseEntity<?> response = handler.badRequest(ex);

        // ตรวจ status code = 400
        assertThat(response.getStatusCode().value()).isEqualTo(400);

        // ตรวจ body
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();

        assertThat(body).isNotNull();
        assertThat(body.get("error")).isEqualTo("validation_error");
    }
}
