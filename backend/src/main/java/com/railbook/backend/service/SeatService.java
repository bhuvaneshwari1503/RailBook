
package com.railbook.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.railbook.backend.dto.SeatDto;
import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.Seat;
import com.railbook.backend.repository.SeatRepository;

@Service
public class SeatService {

    private final SeatRepository seatRepo;
    private final FareService fareService;

    public SeatService(SeatRepository seatRepo, FareService fareService) {
        this.seatRepo = seatRepo;
        this.fareService = fareService;
    }

    @Transactional(readOnly = true)
    public List<SeatDto> getSeats(Long runId, ClassType classType, String from, String to) {
        List<Seat> seats = seatRepo.findByRunIdAndClassTypeOrderByCoachAscSeatNoAsc(runId, classType);

        final BigDecimal segmentFare;
        if (from != null && to != null && !seats.isEmpty()) {
            Long trainId = seats.get(0).getRun().getTrain().getId();
            var seg = fareService.segment(trainId, from, to);
            segmentFare = fareService.fareForKm(classType, seg.km());
        } else {
            segmentFare = null;
        }

        return seats.stream()
                .map(s -> new SeatDto(
                        s.getId(),
                        s.getCoach(),
                        s.getSeatNo(),
                        s.getBerth(),
                        s.getClassType(),
                        segmentFare != null ? segmentFare : s.getFare(),
                        s.getStatus()))
                .toList();
    }
}
