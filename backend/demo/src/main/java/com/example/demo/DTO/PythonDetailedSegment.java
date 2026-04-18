package com.example.demo.DTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record PythonDetailedSegment(
    Integer speaker,
    Float start,
    Float end,
    @JsonProperty("originalText") String originalText,
    @JsonProperty("redactedText") String redactedText,
    @JsonProperty("containsPii") Boolean containsPii,
    @JsonProperty("piiTypes") List<String> piiTypes
) {}