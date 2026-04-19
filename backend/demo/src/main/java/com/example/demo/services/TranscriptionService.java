package com.example.demo.services;

import com.example.demo.DTO.*;
import com.example.demo.models.*;
import com.example.demo.repository.*;
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
    private final RestTemplate restTemplate = new RestTemplate();

    @Async("transcriptionTaskExecutor")
    public void processAudioAsync(Long callRecordId) {
        CallRecord record = callRecordRepository.findById(callRecordId).orElseThrow();
        record.setStatus(CallRecord.RecordStatus.TRANSCRIBING);
        callRecordRepository.save(record);

        try {
            String pythonUrl = "http://python-stt:8000/transcribe";
            Map<String, String> request = Map.of("file_path", record.getOriginalAudioPath());

            PythonResponse response = restTemplate.postForObject(pythonUrl, request, PythonResponse.class);

            if (response != null) {
                record.setRedactedAudioPath(response.redactedAudioPath());
                
                for (PythonDetailedSegment s : response.segments()) {
                    TranscriptSegment ts = TranscriptSegment.builder()
                            .callRecord(record)
                            .speakerId(s.speaker())
                            .startTime(s.start())
                            .endTime(s.end())
                            .originalText(s.originalText())
                            .redactedText(s.redactedText())
                            .containsPii(s.containsPii())
                            .piiTypes(s.piiTypes() != null ? String.join(",", s.piiTypes()) : "")
                            .build();
                    segmentRepository.save(ts);
                    
                    // Обновляем длительность записи по последнему сегменту
                    record.setDurationSeconds(s.end().intValue());
                }
                record.setStatus(CallRecord.RecordStatus.COMPLETED);
            }
        } catch (Exception e) {
            log.error("STT Error: {}", e.getMessage());
            record.setStatus(CallRecord.RecordStatus.ERROR);
        }
        callRecordRepository.save(record);
    }
}