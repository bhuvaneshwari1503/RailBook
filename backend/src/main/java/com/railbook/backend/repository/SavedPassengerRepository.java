
package com.railbook.backend.repository;

import com.railbook.backend.entity.SavedPassenger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedPassengerRepository extends JpaRepository<SavedPassenger, Long> {

    List<SavedPassenger> findByUserEmailOrderByIdDesc(String email);

    Optional<SavedPassenger> findByIdAndUserEmail(Long id, String email);

    long countByUserEmail(String email);
}
