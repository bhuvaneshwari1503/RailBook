package com.railbook.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.TrainStop;
import com.railbook.backend.repository.TrainStopRepository;

@Service
public class FareService {

    private static final Map<ClassType, BigDecimal> RATE_PER_KM = Map.of(
            ClassType.SL, new BigDecimal("0.60"),
            ClassType.AC3, new BigDecimal("1.60"),
            ClassType.AC2, new BigDecimal("2.30"),
            ClassType.AC1, new BigDecimal("3.80"));

    public record Segment(TrainStop from, TrainStop to) {
        public int km() {
            return to.getDistanceKm() - from.getDistanceKm();
        }
    }

    private final TrainStopRepository stopRepo;

    public FareService(TrainStopRepository stopRepo) {
        this.stopRepo = stopRepo;
    }

    public BigDecimal fareForKm(ClassType classType, int km) {
        return RATE_PER_KM.get(classType)
                .multiply(BigDecimal.valueOf(km))
                .setScale(0, RoundingMode.HALF_UP)
                .max(new BigDecimal("100"));
    }

    public Segment segment(Long trainId, String fromCode, String toCode) {
        List<TrainStop> stops = stopRepo.findByTrainIdOrderByStopOrder(trainId);
        TrainStop a = stops.stream()
                .filter(s -> s.getStation().getCode().equalsIgnoreCase(fromCode))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Train does not stop at " + fromCode));
        TrainStop b = stops.stream()
                .filter(s -> s.getStation().getCode().equalsIgnoreCase(toCode))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Train does not stop at " + toCode));
        if (a.getStopOrder() >= b.getStopOrder()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid journey direction");
        }
        return new Segment(a, b);
    }
}