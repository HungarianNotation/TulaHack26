package com.example.demo.DTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record PythonResponse(
    @JsonProperty("redactedAudioPath") String redactedAudioPath,
    @JsonProperty("segments") List<PythonDetailedSegment> segments
) {
    // Геттер для сервиса
    public String redacted_audio_path() { return redactedAudioPath; }
}