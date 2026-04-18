package com.example.demo.controllers;

import com.example.demo.DTO.CallDetailsDto;
import com.example.demo.DTO.CallRecordDto;
import com.example.demo.DTO.TranscriptSegmentDto;
import com.example.demo.models.CallRecord;
import com.example.demo.models.TranscriptSegment;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
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

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String login = auth.getName();
        return userRepository.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "TURBO") String modeStr) { // Добавлен параметр mode
            
        User currentUser = getCurrentUser();
        String filePath = storageService.storeFile(file);

        // Парсинг режима
        CallRecord.ProcessingMode mode = CallRecord.ProcessingMode.TURBO;
        try {
            mode = CallRecord.ProcessingMode.valueOf(modeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Неизвестный режим обработки: {}, используем TURBO по умолчанию", modeStr);
        }

        CallRecord record = CallRecord.builder()
                .user(currentUser)
                .originalAudioPath(filePath)
                .status(CallRecord.RecordStatus.UPLOADED)
                .processingMode(mode) // Сохранение режима
                .build();
        record = callRecordRepository.save(record);

        transcriptionService.processAudioAsync(record.getId());

        return ResponseEntity.ok(Map.of(
                "message", "Файл принят в обработку",
                "callRecordId", record.getId(),
                "mode", mode.name()
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CallRecordDto>> getMyCalls() {
        User currentUser = getCurrentUser();
        List<CallRecord> records = callRecordRepository.findAllByUserIdOrderByCreatedAtDesc(currentUser.getId());
        
        List<CallRecordDto> dtos = new ArrayList<>();
        for (CallRecord r : records) {
            dtos.add(convertToDto(r));
        }
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CallDetailsDto> getCallDetails(@PathVariable Long id) {
        CallRecord record = getCallWithSecurityCheck(id);
        List<TranscriptSegment> entities = segmentRepository.findAllByCallRecordIdOrderByStartTimeAsc(id);

        List<TranscriptSegmentDto> segmentDtos = entities.stream()
            .map((TranscriptSegment s) -> {
                List<String> piiList = (s.getPiiTypes() != null && !s.getPiiTypes().isEmpty())
                        ? Arrays.asList(s.getPiiTypes().split(","))
                        : new ArrayList<String>();
                        
                return TranscriptSegmentDto.builder()
                    .id(s.getId())
                    .speakerId(s.getSpeakerId())
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .originalText(s.getOriginalText())
                    .redactedText(s.getRedactedText())
                    .containsPii(s.getContainsPii())
                    .piiTypes(piiList)
                    .build();
            })
            .collect(Collectors.toList());

        CallDetailsDto details = CallDetailsDto.builder()
                .callRecord(convertToDto(record))
                .segments(segmentDtos)
                .build();

        return ResponseEntity.ok(details);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        User user = getCurrentUser();
        List<CallRecord> records = callRecordRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        
        Map<String, Integer> piiDistribution = new HashMap<>();
        int totalIncidents = 0;

        for (CallRecord r : records) {
            for (TranscriptSegment s : r.getSegments()) {
                if (s.getContainsPii() != null && s.getContainsPii() && s.getPiiTypes() != null) {
                    String[] types = s.getPiiTypes().split(",");
                    for (String type : types) {
                        String cleanType = type.trim();
                        if (!cleanType.isEmpty()) {
                            piiDistribution.put(cleanType, piiDistribution.getOrDefault(cleanType, 0) + 1);
                            totalIncidents++;
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "totalCallsProcessed", records.size(),
            "totalPiiIncidentsFound", totalIncidents,
            "piiTypeDistribution", piiDistribution
        ));
    }

    @GetMapping("/{id}/audio/{type}")
    public ResponseEntity<Resource> getAudio(@PathVariable Long id, @PathVariable String type) {
        CallRecord record = getCallWithSecurityCheck(id);
        String path = "redacted".equalsIgnoreCase(type) ? record.getRedactedAudioPath() : record.getOriginalAudioPath();

        if (path == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл отсутствует");
        }

        try {
            Path filePath = Paths.get(path);
            Resource resource = new UrlResource(filePath.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/wav"))
                    .body(resource);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Ошибка чтения аудио");
        }
    }

    private CallRecord getCallWithSecurityCheck(Long id) {
        User currentUser = getCurrentUser();
        CallRecord record = callRecordRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        if (!record.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа");
        }
        return record;
    }

    private CallRecordDto convertToDto(CallRecord r) {
        return CallRecordDto.builder()
                .id(r.getId())
                .originalAudioPath(r.getOriginalAudioPath())
                .durationSeconds(r.getDurationSeconds())
                .status(r.getStatus())
                .processingMode(r.getProcessingMode() != null ? r.getProcessingMode().name() : "TURBO") // Передача режима
                .createdAt(r.getCreatedAt())
                .build();
    }
}