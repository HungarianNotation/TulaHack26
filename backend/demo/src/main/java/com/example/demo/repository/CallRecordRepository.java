package com.example.demo.repository; 
import com.example.demo.models.CallRecord;   
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {
    
    // Список всех звонков пользователя (от новых к старым)
    List<CallRecord> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Поиск записей, которые еще не обработаны (для фонового сервиса)
    List<CallRecord> findAllByStatus(CallRecord.RecordStatus status);
}