package com.railbook.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record TrainSearchResult(
        Long runId,
        String trainNumber,
        String trainName,
        String from,
        String to,
        LocalDate date,
        LocalTime departureTime,
        LocalTime arrivalTime,
        int arrivalDayOffset,
        int durationMinutes,
        int distanceKm,
        List<ClassAvailability> classes
) {}