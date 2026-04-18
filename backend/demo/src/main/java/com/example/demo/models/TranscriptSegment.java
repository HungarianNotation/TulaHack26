package com.example.demo.models;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "transcript_segments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TranscriptSegment {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_record_id", nullable = false)
    private CallRecord callRecord;

    // Кто говорит: 1 (звонящий) или 2 (оператор)
    private Integer speakerId; 

    // Таймкоды в миллисекундах или секундах (Float)
    private Float startTime;
    private Float endTime;

    // Текст до обработки LLM (грязный)
    @Column(columnDefinition = "TEXT")
    private String originalText;

    // Текст после цензуры (чистый, например: "Меня зовут [ИМЯ]")
    @Column(columnDefinition = "TEXT")
    private String redactedText;

    // Флаг для фронта: если true, значит в этой фразе были удалены ПДн (удобно для фильтрации/подсветки)
    private Boolean containsPii; 
}