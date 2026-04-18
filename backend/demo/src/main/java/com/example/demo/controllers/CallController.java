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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    // Вспомогательный метод получения текущего пользователя
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String login = auth.getName();
        return userRepository.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        User currentUser = getCurrentUser();
        log.info("Пользователь {} загружает файл {}", currentUser.getLogin(), file.getOriginalFilename());

        // 1. Сохраняем физически на диск
        String filePath = storageService.storeFile(file);

        // 2. Создаем запись в БД
        CallRecord record = CallRecord.builder()
                .user(currentUser)
                .originalAudioPath(filePath)
                .status(CallRecord.RecordStatus.UPLOADED)
                .build();
        record = callRecordRepository.save(record);

        // 3. Запускаем асинхронную обработку
        transcriptionService.processAudioAsync(record.getId());

        // 4. Мгновенно возвращаем ответ (200 OK)
        return ResponseEntity.ok(Map.of(
                "message", "Файл загружен и отправлен в обработку",
                "callRecordId", record.getId()
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CallRecordDto>> getMyCalls() {
        User currentUser = getCurrentUser();
        
        List<CallRecord> records = callRecordRepository.findAllByUserIdOrderByCreatedAtDesc(currentUser.getId());
        
        // Преобразуем в DTO
        List<CallRecordDto> dtos = records.stream().map(r -> CallRecordDto.builder()
                .id(r.getId())
                .originalAudioPath(r.getOriginalAudioPath())
                .durationSeconds(r.getDurationSeconds())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CallDetailsDto> getCallDetails(@PathVariable Long id) {
        User currentUser = getCurrentUser();

        CallRecord record = callRecordRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        // Проверка прав доступа (пользователь может смотреть только свои записи)
        if (!record.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к данной записи");
        }

        CallRecordDto callDto = CallRecordDto.builder()
                .id(record.getId())
                .originalAudioPath(record.getOriginalAudioPath())
                .durationSeconds(record.getDurationSeconds())
                .status(record.getStatus())
                .createdAt(record.getCreatedAt())
                .build();

        // Запрашиваем транскрипт (если есть)
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
                .callRecord(callDto)
                .segments(segmentDtos)
                .build());
    }
}