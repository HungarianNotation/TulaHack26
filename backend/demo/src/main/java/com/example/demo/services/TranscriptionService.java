package com.example.demo.services;

import com.example.demo.DTO.PythonSegment;
import com.example.demo.models.CallRecord;
import com.example.demo.models.TranscriptSegment;
import com.example.demo.repository.CallRecordRepository;
import com.example.demo.repository.TranscriptSegmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranscriptionService {

    private final CallRecordRepository callRecordRepository;
    private final TranscriptSegmentRepository segmentRepository;
    private final RestTemplate restTemplate = new RestTemplate(); // Для вызова Python

    @Async("transcriptionTaskExecutor")
    public void processAudioAsync(Long callRecordId) {
        log.info("Начат асинхронный процесс обработки записи ID: {}", callRecordId);

        CallRecord record = callRecordRepository.findById(callRecordId).orElse(null);
        if (record == null) return;

        record.setStatus(CallRecord.RecordStatus.TRANSCRIBING);
        callRecordRepository.save(record);

        try {
            // 1. URL Python-микросервиса внутри сети Docker
            String pythonUrl = "http://python-stt:8000/transcribe";
            
            // Отправляем абсолютный путь к файлу (Docker Volumes синхронизируют пути)
            Map<String, String> request = Map.of("file_path", record.getOriginalAudioPath());

            log.info("Отправка запроса в Python STT: {}", request);
            
            // 2. Отправляем и ждем JSON
            PythonSegment[] segments = restTemplate.postForObject(pythonUrl, request, PythonSegment[].class);

            // 3. Сохраняем результат
            if (segments != null) {
                for (PythonSegment s : segments) {
                    TranscriptSegment ts = TranscriptSegment.builder()
                            .callRecord(record)
                            .speakerId(s.speaker())
                            .startTime(s.start())
                            .endTime(s.end())
                            .originalText(s.text())
                            .containsPii(false) // Потом добавишь логику ПДн
                            .build();
                    segmentRepository.save(ts);
                }
            }

            record.setStatus(CallRecord.RecordStatus.COMPLETED);
            record.setDurationSeconds(120); // Заглушка, можно считать длину
            log.info("Обработка записи ID: {} успешно завершена", callRecordId);

        } catch (Exception e) {
            log.error("STT Error при обработке ID: {}", callRecordId, e);
            record.setStatus(CallRecord.RecordStatus.ERROR);
        }
        callRecordRepository.save(record);
    }
}