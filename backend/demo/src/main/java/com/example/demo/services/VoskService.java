package com.example.demo.services;

import com.example.demo.models.TranscriptSegment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class VoskService {

    // Заглушка конвертера FFmpeg
    public String convertToPcm16kHz(String originalAudioPath) {
        log.info("Конвертация файла {} в PCM 16kHz Mono через FFmpeg (заглушка)...", originalAudioPath);
        // Здесь будет код ProcessBuilder для вызова FFmpeg
        return originalAudioPath + ".wav"; 
    }

    // Заглушка транскрибации
    public List<TranscriptSegment> transcribe(String audioFilePath) {
        log.info("Запуск модели Vosk для файла: {}", audioFilePath);
        
        // Имитация долгой работы STT (5 секунд)
        try {
            Thread.sleep(5000); 
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        List<TranscriptSegment> segments = new ArrayList<>();
        segments.add(TranscriptSegment.builder()
                .speakerId(1)
                .startTime(0.0f).endTime(2.5f)
                .originalText("Здравствуйте, меня зовут Иван.")
                .containsPii(false)
                .build());
        segments.add(TranscriptSegment.builder()
                .speakerId(2)
                .startTime(2.5f).endTime(5.0f)
                .originalText("Добрый день, Иван! Чем могу помочь?")
                .containsPii(false)
                .build());
                
        log.info("Транскрибация Vosk завершена. Найдено сегментов: {}", segments.size());
        return segments;
    }
}