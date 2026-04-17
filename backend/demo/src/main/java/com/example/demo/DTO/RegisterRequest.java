package com.example.demo.DTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Логин не может быть пустым")
        String login, 
        
        @NotBlank(message = "Пароль не может быть пустым")
        @Size(min = 6, message = "Пароль должен быть от 6 символов")
        String password, 
        
        String name, 
        String company
) {}