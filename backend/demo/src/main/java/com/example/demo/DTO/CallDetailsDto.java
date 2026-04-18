package com.example.demo.DTO;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CallDetailsDto {
    private CallRecordDto callRecord;
    private List<TranscriptSegmentDto> segments;
}