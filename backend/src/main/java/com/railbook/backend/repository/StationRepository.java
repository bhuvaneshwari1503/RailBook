package com.railbook.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.railbook.backend.entity.Station;

public interface StationRepository extends JpaRepository<Station, Long> {
    Optional<Station> findByCode(String code);
}
