package com.railbook.backend.repository;

import com.railbook.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p")
    BigDecimal totalRevenue();

    @Query("""
        SELECT p.paidAt, p.amount
        FROM Payment p
        WHERE p.paidAt >= :since
        ORDER BY p.paidAt
    """)
    List<Object[]> paymentsSince(@Param("since") LocalDateTime since);
}