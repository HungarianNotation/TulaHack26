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
import com.example.demo.DTO.PythonResponse;
import com.example.demo.DTO.PythonDetailedSegment;

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
    CallRecord record = callRecordRepository.findById(callRecordId).orElseThrow();
    record.setStatus(CallRecord.RecordStatus.TRANSCRIBING);
    callRecordRepository.save(record);

    try {
        String pythonUrl = "http://python-stt:8000/transcribe";
        Map<String, String> request = Map.of("file_path", record.getOriginalAudioPath());

        // 1. Вызываем Python и получаем полный анализ
        PythonResponse response = restTemplate.postForObject(pythonUrl, request, PythonResponse.class);

        if (response != null) {
            // 2. Обновляем путь к анонимизированному аудио
            record.setRedactedAudioPath(response.redacted_audio_path());
            
            // 3. Сохраняем сегменты с типами ПДн
            for (PythonDetailedSegment s : response.segments()) {
                TranscriptSegment ts = TranscriptSegment.builder()
                        .callRecord(record)
                        .speakerId(s.speaker())
                        .startTime(s.start())
                        .endTime(s.end())
                        .originalText(s.original_text())
                        .redactedText(s.redacted_text())
                        .containsPii(s.contains_pii())
                        // Можно добавить поле PiiTypes в БД, если нужно
                        .build();
                segmentRepository.save(ts);
            }
        }

        record.setStatus(CallRecord.RecordStatus.COMPLETED);
    } catch (Exception e) {
        record.setStatus(CallRecord.RecordStatus.ERROR);
    }
    callRecordRepository.save(record);
}
}