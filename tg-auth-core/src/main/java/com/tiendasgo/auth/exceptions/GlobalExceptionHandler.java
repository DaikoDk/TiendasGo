package com.tiendasgo.auth.exceptions;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Map<String, Object>> handleCustomException(CustomException ex) {
        return buildResponse(ex.getStatus().value(), ex.getStatus().getReasonPhrase(), ex.getMessage());
    }

    // Manejar los errores de @Valid (Email inválido, NotBlank, etc.)
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldError().getDefaultMessage();
        return buildResponse(400, "Bad Request", mensaje);
    }

    // Error generic
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        ex.printStackTrace();
        return buildResponse(500, "Internal Server Error", "Ocurrió un error inesperado en el servidor");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(int status, String error, String message) {
        Map<String, Object> body = Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status,
                "error", error,
                "message", message
        );
        return ResponseEntity.status(status).body(body);
    }
}

