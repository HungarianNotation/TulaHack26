package com.example.demo.models;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "call_records")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CallRecord {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String originalAudioPath;
    private String redactedAudioPath;

    private Integer durationSeconds;
    private Integer channelsCount;

    @Enumerated(EnumType.STRING)
    private RecordStatus status;

    @Enumerated(EnumType.STRING)
    private ProcessingMode processingMode; // НОВОЕ ПОЛЕ

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "callRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TranscriptSegment> segments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum RecordStatus {
        UPLOADED,
        TRANSCRIBING,
        REDACTING,
        COMPLETED,
        ERROR
    }

    // НОВЫЙ ENUM
    public enum ProcessingMode {
        TURBO,
        SMART
    }
}