package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "transcriptionTaskExecutor")
    public Executor transcriptionTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2); // Базовое количество потоков для Vosk
        executor.setMaxPoolSize(4);  // Максимум потоков при пиковой нагрузке
        executor.setQueueCapacity(50); // Очередь файлов, ожидающих обработку
        executor.setThreadNamePrefix("Vosk-STT-");
        executor.initialize();
        return executor;
    }
}