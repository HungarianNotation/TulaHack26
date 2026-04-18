package com.example.demo.DTO;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String login, 
        @NotBlank String password
) {}
