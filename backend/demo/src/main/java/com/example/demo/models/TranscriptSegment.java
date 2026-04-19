package com.example.demo.models;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "transcript_segments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TranscriptSegment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_record_id", nullable = false)
    private CallRecord callRecord;

    private Integer speakerId; 
    private Float startTime;
    private Float endTime;

    @Column(columnDefinition = "TEXT")
    private String originalText;

    @Column(columnDefinition = "TEXT")
    private String redactedText;

    private Boolean containsPii;
    
    @Column(name = "pii_types")
    private String piiTypes; // Храним как "PHONE,NAME"
}