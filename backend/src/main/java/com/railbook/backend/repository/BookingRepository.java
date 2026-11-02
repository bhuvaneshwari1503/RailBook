package com.railbook.backend.repository;

import com.railbook.backend.entity.Booking;
import com.railbook.backend.entity.BookingStatus;
import com.railbook.backend.entity.ClassType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByPnr(String pnr);

    Optional<Booking> findByPnr(String pnr);

    @Query("""
           select distinct p.booking from Passenger p
           where p.seat.id in :seatIds
             and p.booking.status = :status
           """)
    List<Booking> findByStatusAndSeatIds(
            @Param("status") BookingStatus status,
            @Param("seatIds") List<Long> seatIds);

    List<Booking> findByUserEmailOrderByCreatedAtDesc(String email);

    List<Booking> findByRunIdAndClassTypeAndStatusOrderByIdAsc(
            Long runId, ClassType classType, BookingStatus status);

    long countByRunIdAndClassTypeAndStatus(
            Long runId, ClassType classType, BookingStatus status);

    long countByRunIdAndClassTypeAndStatusAndIdLessThan(
            Long runId, ClassType classType, BookingStatus status, Long id);

    long countByStatus(BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.refundAmount), 0) FROM Booking b")
    BigDecimal totalRefunds();

    // Top 5 trains by confirmed booking revenue
    @Query("""
        SELECT b.run.train.name,
               b.run.train.number,
               COUNT(b),
               COALESCE(SUM(b.totalFare), 0)
        FROM Booking b
        WHERE b.status = 'CONFIRMED'
        GROUP BY b.run.train.name, b.run.train.number
        ORDER BY SUM(b.totalFare) DESC
    """)
    List<Object[]> topTrains(Pageable pageable);

    @Query("""
        SELECT b FROM Booking b
        WHERE (:statuses IS NULL OR b.status IN :statuses)
          AND (
            :q IS NULL OR :q = '' OR
            LOWER(b.pnr) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(b.user.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(b.user.email) LIKE LOWER(CONCAT('%', :q, '%'))
          )
        ORDER BY b.createdAt DESC
    """)
    Page<Booking> search(
            @Param("statuses") List<BookingStatus> statuses,
            @Param("q") String q,
            Pageable pageable);
}