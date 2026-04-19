package com.example.demo.repository;

import com.example.demo.models.TranscriptSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TranscriptSegmentRepository extends JpaRepository<TranscriptSegment, Long> {
    
    // Получение всего диалога для конкретного звонка, отсортированного по времени
    List<TranscriptSegment> findAllByCallRecordIdOrderByStartTimeAsc(Long callRecordId);
    
    // Найти только те сегменты, где были обнаружены персональные данные
    List<TranscriptSegment> findAllByCallRecordIdAndContainsPiiTrue(Long callRecordId);
    
    // Удалить старые сегменты (если вдруг нужно перезапустить транскрибацию)
    void deleteAllByCallRecordId(Long callRecordId);
}