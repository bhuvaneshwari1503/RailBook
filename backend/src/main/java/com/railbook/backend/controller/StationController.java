package com.railbook.backend.controller;

import com.railbook.backend.entity.Station;
import com.railbook.backend.repository.StationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final StationRepository stationRepo;

    public StationController(StationRepository stationRepo) {
        this.stationRepo = stationRepo;
    }

    @GetMapping
    public List<Station> all() {
        return stationRepo.findAll();
    }
}