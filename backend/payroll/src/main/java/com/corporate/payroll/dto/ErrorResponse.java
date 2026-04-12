package com.corporate.payroll.dto;

import lombok.Data;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private String path;
    private List<String> details;

    public ErrorResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ErrorResponse(HttpStatus status, String message, String path) {
        this(status.value(), status.getReasonPhrase(), message, LocalDateTime.now(), path, null);
    }

    public ErrorResponse(HttpStatus status, String message, String path, List<String> details) {
        this(status.value(), status.getReasonPhrase(), message, LocalDateTime.now(), path, details);
    }

    public ErrorResponse(int status, String error, String message, LocalDateTime timestamp, String path, List<String> details) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.path = path;
        this.details = details;
    }
}
