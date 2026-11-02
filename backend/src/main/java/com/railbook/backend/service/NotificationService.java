package com.railbook.backend.service;

import com.railbook.backend.entity.*;
import com.railbook.backend.repository.BookingRepository;
import com.railbook.backend.repository.PassengerRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class NotificationService {

    public enum Type {
        CONFIRMED, CANCELLED, PROMOTED, WAITLISTED
    }

    public record BookingEvent(
            Type type,
            String toEmail,
            String userName,
            String pnr,
            String trainNumber,
            String trainName,
            String from,
            String to,
            LocalDate date,
            LocalTime departure,
            ClassType classType,
            BigDecimal totalFare,
            BigDecimal refund,
            Integer waitlistPosition,
            List<String> passengers
    ) {}

    private final ApplicationEventPublisher events;
    private final PassengerRepository passengerRepo;
    private final BookingRepository bookingRepo;
    private final FareService fareService;

    public NotificationService(
            ApplicationEventPublisher events,
            PassengerRepository passengerRepo,
            BookingRepository bookingRepo,
            FareService fareService
    ) {
        this.events = events;
        this.passengerRepo = passengerRepo;
        this.bookingRepo = bookingRepo;
        this.fareService = fareService;
    }

    /** Call inside a transaction. Email sends only after that transaction commits. */
    public void send(Booking b, Type type) {

        Train t = b.getRun().getTrain();

        var seg = fareService.segment(
                t.getId(),
                b.fromCode(),
                b.toCode()
        );

        List<String> passengers = passengerRepo
                .findByBookingId(b.getId())
                .stream()
                .map(p -> {
                    String line = p.getName() + ", " + p.getAge();
                    Seat s = p.getSeat();

                    if (type == Type.CANCELLED) {
                        return line;
                    }

                    return line + " - " + (s == null
                            ? "Waitlisted"
                            : s.getCoach() + "-" + s.getSeatNo()
                                    + " (" + s.getBerth() + ")");
                })
                .toList();

        Integer position = null;

        if (type == Type.WAITLISTED) {
            position = (int) bookingRepo
                    .countByRunIdAndClassTypeAndStatusAndIdLessThan(
                            b.getRun().getId(),
                            b.getClassType(),
                            BookingStatus.WAITLISTED,
                            b.getId()
                    ) + 1;
        }

        events.publishEvent(new BookingEvent(
                type,
                b.getUser().getEmail(),
                b.getUser().getName(),
                b.getPnr(),
                t.getNumber(),
                t.getName(),
                b.fromCode(),
                b.toCode(),
                b.getRun().getRunDate(),
                seg.from().getDepartureTime(),
                b.getClassType(),
                b.getTotalFare(),
                b.getRefundAmount(),
                position,
                passengers
        ));
    }
}