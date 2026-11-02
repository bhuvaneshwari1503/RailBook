package com.railbook.backend.service;

import com.railbook.backend.dto.PassengerInfo;
import com.railbook.backend.dto.PnrStatusResponse;
import com.railbook.backend.entity.*;
import com.railbook.backend.repository.BookingRepository;
import com.railbook.backend.repository.PassengerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PnrService {

    private final BookingRepository bookingRepo;
    private final PassengerRepository passengerRepo;
    private final FareService fareService;

    public PnrService(BookingRepository bookingRepo, PassengerRepository passengerRepo,
                      FareService fareService) {
        this.bookingRepo = bookingRepo;
        this.passengerRepo = passengerRepo;
        this.fareService = fareService;
    }

    @Transactional(readOnly = true)
    public PnrStatusResponse status(String pnr) {
        Booking b = bookingRepo.findByPnr(pnr)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PNR not found"));

        Train t = b.getRun().getTrain();
        var seg = fareService.segment(t.getId(), b.fromCode(), b.toCode());

        List<PassengerInfo> passengers = passengerRepo.findByBookingId(b.getId()).stream()
                .map(p -> {
                    Seat s = p.getSeat();
                    return new PassengerInfo(mask(p.getName()), p.getAge(), p.getGender(),
                            s == null ? null : s.getCoach(),
                            s == null ? null : s.getSeatNo(),
                            s == null ? null : s.getBerth().name());
                })
                .toList();

        Integer position = null;
        if (b.getStatus() == BookingStatus.WAITLISTED) {
            position = (int) bookingRepo.countByRunIdAndClassTypeAndStatusAndIdLessThan(
                    b.getRun().getId(), b.getClassType(), BookingStatus.WAITLISTED, b.getId()) + 1;
        }

        return new PnrStatusResponse(b.getPnr(), b.getStatus(), position,
                t.getNumber(), t.getName(), b.fromCode(), b.toCode(),
                b.getRun().getRunDate(), seg.from().getDepartureTime(),
                b.getClassType(), passengers);
    }

    private static String mask(String name) {
        String n = name.trim();
        return n.isEmpty() ? "*" : n.charAt(0) + "*".repeat(Math.max(2, n.length() - 1));
    }
}