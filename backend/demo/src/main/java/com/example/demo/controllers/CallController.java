package com.example.demo.controllers;

import com.example.demo.DTO.CallDetailsDto;
import com.example.demo.DTO.CallRecordDto;
import com.example.demo.DTO.TranscriptSegmentDto;
import com.example.demo.models.CallRecord;
import com.example.demo.models.User;
import com.example.demo.repository.CallRecordRepository;
import com.example.demo.repository.TranscriptSegmentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.services.AudioStorageService;
import com.example.demo.services.TranscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Slf4j
public class CallController {

    private final CallRecordRepository callRecordRepository;
    private final TranscriptSegmentRepository segmentRepository;
    private final UserRepository userRepository;
    private final AudioStorageService storageService;
    private final TranscriptionService transcriptionService;

    /**
     * Вспомогательный метод получения текущего пользователя из Security Context
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String login = auth.getName();
        return userRepository.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));
    }

    /**
     * Загрузка нового аудиофайла
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        User currentUser = getCurrentUser();
        log.info("Пользователь {} загружает файл: {}", currentUser.getLogin(), file.getOriginalFilename());

        // 1. Сохраняем физически на диск (папка uploads/original)
        String filePath = storageService.storeFile(file);

        // 2. Создаем запись в БД со статусом UPLOADED
        CallRecord record = CallRecord.builder()
                .user(currentUser)
                .originalAudioPath(filePath)
                .status(CallRecord.RecordStatus.UPLOADED)
                .build();
        record = callRecordRepository.save(record);

        // 3. Запускаем асинхронную обработку (STT + Redaction)
        transcriptionService.processAudioAsync(record.getId());

        return ResponseEntity.ok(Map.of(
                "message", "Файл загружен и отправлен в обработку",
                "callRecordId", record.getId()
        ));
    }

    /**
     * Получение списка всех звонков текущего пользователя
     */
    @GetMapping("/my")
    public ResponseEntity<List<CallRecordDto>> getMyCalls() {
        User currentUser = getCurrentUser();
        List<CallRecord> records = callRecordRepository.findAllByUserIdOrderByCreatedAtDesc(currentUser.getId());
        
        List<CallRecordDto> dtos = records.stream().map(this::convertToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Получение детальной информации о звонке (метаданные + все текстовые сегменты)
     */
    @GetMapping("/{id}")
    public ResponseEntity<CallDetailsDto> getCallDetails(@PathVariable Long id) {
        CallRecord record = getCallRecordWithSecurityCheck(id);

        List<TranscriptSegmentDto> segmentDtos = segmentRepository.findAllByCallRecordIdOrderByStartTimeAsc(id)
                .stream().map(s -> TranscriptSegmentDto.builder()
                        .id(s.getId())
                        .speakerId(s.getSpeakerId())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .originalText(s.getOriginalText())
                        .redactedText(s.getRedactedText())
                        .containsPii(s.getContainsPii())
                        .build()
                ).collect(Collectors.toList());

        return ResponseEntity.ok(CallDetailsDto.builder()
                .callRecord(convertToDto(record))
                .segments(segmentDtos)
                .build());
    }

    /**
     * Стрим анонимизированного аудиофайла (для проигрывателя на фронтенде)
     */
    @GetMapping("/{id}/audio/redacted")
    public ResponseEntity<Resource> getRedactedAudio(@PathVariable Long id) {
        CallRecord record = getCallRecordWithSecurityCheck(id);

        if (record.getRedactedAudioPath() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Анонимизированный файл еще не готов");
        }

        return serveAudioFile(record.getRedactedAudioPath());
    }

    /**
     * Стрим оригинального аудиофайла
     */
    @GetMapping("/{id}/audio/original")
    public ResponseEntity<Resource> getOriginalAudio(@PathVariable Long id) {
        CallRecord record = getCallRecordWithSecurityCheck(id);
        return serveAudioFile(record.getOriginalAudioPath());
    }

    // --- Приватные вспомогательные методы ---

    private CallRecord getCallRecordWithSecurityCheck(Long id) {
        User currentUser = getCurrentUser();
        CallRecord record = callRecordRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        if (!record.getUser().getId().equals(currentUser.getId())) {
            log.warn("Попытка несанкционированного доступа пользователем {} к записи {}", currentUser.getLogin(), id);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к данной записи");
        }
        return record;
    }

    private ResponseEntity<Resource> serveAudioFile(String path) {
        try {
            Path filePath = Paths.get(path);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Файл не найден или недоступен");
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/wav")) // Можно расширить до mpeg, если нужно
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            log.error("Ошибка при чтении аудиофайла: {}", path, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Ошибка при загрузке аудио");
        }
    }

    private CallRecordDto convertToDto(CallRecord r) {
        return CallRecordDto.builder()
                .id(r.getId())
                .originalAudioPath(r.getOriginalAudioPath())
                .durationSeconds(r.getDurationSeconds())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}