package com.example.demo.DTO;

import com.example.demo.models.CallRecord.RecordStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CallRecordDto {
    private Long id;
    private String originalAudioPath;
    private Integer durationSeconds;
    private RecordStatus status;
    private LocalDateTime createdAt;
}