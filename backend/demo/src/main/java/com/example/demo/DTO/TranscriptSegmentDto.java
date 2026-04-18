package com.example.demo.DTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TranscriptSegmentDto {
    private Long id;
    private Integer speakerId;
    private Float startTime;
    private Float endTime;
    private String originalText;
    private String redactedText;
    private Boolean containsPii;
}