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

    // Пути к файлам в хранилище (например, S3 или просто папка на сервере)
    private String originalAudioPath;
    private String redactedAudioPath; // Появится после обработки

    private Integer durationSeconds;
    private Integer channelsCount; // 1 (моно) или 2 (стерео - легче разделить спикеров)

    @Enumerated(EnumType.STRING)
    private RecordStatus status; // Текущий статус обработки

    private LocalDateTime createdAt;

    // Привязка кусков текста к этой записи
    @OneToMany(mappedBy = "callRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TranscriptSegment> segments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum RecordStatus {
        UPLOADED,       // Файл загружен
        TRANSCRIBING,   // Идет STT
        REDACTING,      // Идет вырезание ПДн
        COMPLETED,      // Готово
        ERROR           // Ошибка обработки
    }
}