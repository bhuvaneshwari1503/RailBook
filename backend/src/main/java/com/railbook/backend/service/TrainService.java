package com.railbook.backend.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.railbook.backend.dto.ClassAvailability;
import com.railbook.backend.dto.TrainSearchResult;
import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.Train;
import com.railbook.backend.entity.TrainRun;
import com.railbook.backend.entity.TrainStop;
import com.railbook.backend.repository.SeatRepository;
import com.railbook.backend.repository.TrainRunRepository;
import com.railbook.backend.repository.TrainStopRepository;

@Service
public class TrainService {

    private final TrainRunRepository runRepo;
    private final SeatRepository seatRepo;
    private final TrainStopRepository stopRepo;
    private final FareService fareService;

    public TrainService(TrainRunRepository runRepo, SeatRepository seatRepo,
                        TrainStopRepository stopRepo, FareService fareService) {
        this.runRepo = runRepo;
        this.seatRepo = seatRepo;
        this.stopRepo = stopRepo;
        this.fareService = fareService;
    }

    @Transactional(readOnly = true)
    public List<TrainSearchResult> search(String from, String to, LocalDate date) {
        List<Object[]> pairs = stopRepo.findSegments(from.toUpperCase(), to.toUpperCase());
        List<TrainSearchResult> results = new ArrayList<>();

        for (Object[] row : pairs) {
            TrainStop a = (TrainStop) row[0];
            TrainStop b = (TrainStop) row[1];
            Train t = a.getTrain();

            // the run is identified by the day the train leaves its ORIGIN
            LocalDate runDate = date.minusDays(a.getDayOffset());
            Optional<TrainRun> run = runRepo.findByTrainIdAndRunDate(t.getId(), runDate);
            if (run.isEmpty()) continue;

            int depMin = minutes(a.getDepartureTime());
            int depAbs = a.getDayOffset() * 1440 + depMin;
            int arrAbs = b.getDayOffset() * 1440 + minutes(b.getArrivalTime());
            int duration = arrAbs - depAbs;
            if (duration < 0) duration += 1440;
            int arrivalDay = (depMin + duration) / 1440;
            int km = b.getDistanceKm() - a.getDistanceKm();

            List<ClassAvailability> classes = seatRepo.availabilityByRun(run.get().getId()).stream()
                    .map(r -> {
                        ClassType ct = (ClassType) r[0];
                        return new ClassAvailability(ct, ((Number) r[1]).longValue(),
                                fareService.fareForKm(ct, km));
                    })
                    .sorted(Comparator.comparing(ClassAvailability::classType))
                    .toList();

            results.add(new TrainSearchResult(
                    run.get().getId(), t.getNumber(), t.getName(),
                    a.getStation().getCode(), b.getStation().getCode(),
                    date, a.getDepartureTime(), b.getArrivalTime(),
                    arrivalDay, duration, km, classes));
        }

        results.sort(Comparator.comparing(TrainSearchResult::departureTime));
        return results;
    }

    private static int minutes(LocalTime t) {
        return t.getHour() * 60 + t.getMinute();
    }
}