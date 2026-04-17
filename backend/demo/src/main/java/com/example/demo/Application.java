package com.example.demo;



import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication
 // Укажите пакет, где находятся ваши сущности
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}