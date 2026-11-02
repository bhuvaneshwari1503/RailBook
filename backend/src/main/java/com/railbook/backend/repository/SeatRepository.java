package com.railbook.backend.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.Seat;
import com.railbook.backend.entity.SeatStatus;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Returns rows of [classType, availableCount, fare]
    @Query("""
           select s.classType,
                  sum(case when s.status = com.railbook.backend.entity.SeatStatus.AVAILABLE then 1 else 0 end),
                  min(s.fare)
           from Seat s
           where s.run.id = :runId
           group by s.classType
           """)
    List<Object[]> availabilityByRun(@Param("runId") Long runId);

    List<Seat> findByRunIdAndClassTypeOrderBySeatNo(
            Long runId, ClassType classType);

    List<Seat> findByRunIdAndClassTypeOrderByCoachAscSeatNoAsc(
            Long runId, ClassType classType);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Seat s where s.id in :ids order by s.id")
    List<Seat> findAllByIdForUpdate(@Param("ids") List<Long> ids);

    List<Seat> findByStatusAndHeldUntilBefore(
            SeatStatus status, LocalDateTime time);

    long countByRunIdAndClassTypeAndStatus(
            Long runId, ClassType classType, SeatStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           select s from Seat s
           where s.run.id = :runId and s.classType = :classType
             and s.status = com.railbook.backend.entity.SeatStatus.AVAILABLE
           order by s.id
           """)
    List<Seat> findAvailableForUpdate(
            @Param("runId") Long runId,
            @Param("classType") ClassType classType,
            Pageable pageable);

    // Returns [trainNumber, trainName, classType, total, booked, held]
    @Query("""
           select s.run.train.number,
                  s.run.train.name,
                  s.classType,
                  count(s),
                  sum(case when s.status = com.railbook.backend.entity.SeatStatus.BOOKED then 1 else 0 end),
                  sum(case when s.status = com.railbook.backend.entity.SeatStatus.HELD then 1 else 0 end)
           from Seat s
           where s.run.runDate = :date
           group by s.run.train.number, s.run.train.name, s.classType
           order by s.run.train.name, s.classType
           """)
    List<Object[]> occupancy(@Param("date") LocalDate date);
}