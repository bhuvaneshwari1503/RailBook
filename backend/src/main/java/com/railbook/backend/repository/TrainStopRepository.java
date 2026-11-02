package com.railbook.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.railbook.backend.entity.TrainStop;


public interface TrainStopRepository extends JpaRepository<TrainStop, Long> {
        // every train that stops at `from` and later at `to`
    @Query("""
           select a, b from TrainStop a, TrainStop b
           where a.train = b.train
             and a.station.code = :from
             and b.station.code = :to
             and a.stopOrder < b.stopOrder
           """)
    List<Object[]> findSegments(@Param("from") String from, @Param("to") String to);
    List<TrainStop> findByTrainIdOrderByStopOrder(Long trainId);
}