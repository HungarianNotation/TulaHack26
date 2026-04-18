package com.example.demo.DTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record PythonDetailedSegment(
    Integer speaker,
    Float start,
    Float end,
    @JsonProperty("originalText") String originalText,
    @JsonProperty("redactedText") String redactedText,
    @JsonProperty("containsPii") Boolean containsPii
) {
    public String original_text() { return originalText; }
    public String redacted_text() { return redactedText; }
    public Boolean contains_pii() { return containsPii; }
}