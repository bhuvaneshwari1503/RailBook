package com.railbook.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.railbook.backend.entity.Train;

public interface TrainRepository extends JpaRepository<Train, Long> {
}