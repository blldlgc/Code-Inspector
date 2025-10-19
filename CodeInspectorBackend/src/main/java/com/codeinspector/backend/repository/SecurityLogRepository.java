package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.SecurityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {

    // Yorum: Son N log kaydını getir
    Page<SecurityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Yorum: Belirli event type'a göre filtrele
    Page<SecurityLog> findByEventTypeOrderByCreatedAtDesc(String eventType, Pageable pageable);

    // Yorum: Belirli kullanıcıya göre filtrele
    Page<SecurityLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Yorum: Tarih aralığına göre filtrele
    Page<SecurityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Yorum: Son 24 saatteki logları getir
    List<SecurityLog> findByCreatedAtGreaterThanEqualOrderByCreatedAtDesc(LocalDateTime since);

    // Yorum: Event type'a göre sayım
    long countByEventType(String eventType);

    // Yorum: Son 24 saatteki başarısız giriş denemeleri
    long countByEventTypeAndCreatedAtGreaterThanEqual(String eventType, LocalDateTime since);
}
