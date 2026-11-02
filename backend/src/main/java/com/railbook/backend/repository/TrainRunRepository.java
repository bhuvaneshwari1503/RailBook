package com.railbook.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.railbook.backend.entity.TrainRun;

public interface TrainRunRepository extends JpaRepository<TrainRun, Long> {

    @Query("""
           select r from TrainRun r
           join fetch r.train t
           where t.source.code = :from
             and t.destination.code = :to
             and r.runDate = :date
           order by t.departureTime
           """)
    List<TrainRun> search(@Param("from") String from,
                          @Param("to") String to,
                          @Param("date") LocalDate date);

    Optional<TrainRun> findByTrainIdAndRunDate(Long trainId, LocalDate runDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from TrainRun r where r.id = :id")
    Optional<TrainRun> findByIdForUpdate(@Param("id") Long id);
}