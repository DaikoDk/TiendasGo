package com.tiendasgo.auth.exceptions;

import com.tiendasgo.auth.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Object>> handleCustomException(CustomException ex, HttpServletRequest request) {
        return buildResponse(ex.getStatus().value(), ex.getStatus().getReasonPhrase(), ex.getMessage(), request.getRequestURI());
    }

    // Manejar los errores de @Valid (Email inválido, NotBlank, etc.)
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(
        org.springframework.web.bind.MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fieldError -> fieldError.getDefaultMessage())
            .orElse("Datos de entrada inválidos");
        return buildResponse(400, "Bad Request", mensaje, request.getRequestURI());
    }

    // Error generic
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex, HttpServletRequest request) {
        LOGGER.error("Error no controlado en {}", request.getRequestURI(), ex);
        return buildResponse(500, "Internal Server Error", "Ocurrió un error inesperado en el servidor", request.getRequestURI());
    }

    private ResponseEntity<ApiResponse<Object>> buildResponse(int status, String error, String message, String path) {
        return ResponseEntity.status(status).body(ApiResponse.error(error, message, path));
    }
}

