
package com.railbook.backend.service;

import com.railbook.backend.dto.*;
import com.railbook.backend.entity.*;
import com.railbook.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private static final int HOLD_MINUTES = 5;
    private static final int MAX_WAITLIST = 20;
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    @PersistenceContext
    private EntityManager em;

    private final UserRepository userRepo;
    private final SeatRepository seatRepo;
    private final BookingRepository bookingRepo;
    private final PassengerRepository passengerRepo;
    private final TrainRunRepository runRepo;
    private final FareService fareService;
    private final WaitlistService waitlistService;
    private final NotificationService notifications;

    public BookingService(
            UserRepository userRepo,
            SeatRepository seatRepo,
            BookingRepository bookingRepo,
            PassengerRepository passengerRepo,
            TrainRunRepository runRepo,
            FareService fareService,
            WaitlistService waitlistService,
            NotificationService notifications) {
        this.userRepo = userRepo;
        this.seatRepo = seatRepo;
        this.bookingRepo = bookingRepo;
        this.passengerRepo = passengerRepo;
        this.runRepo = runRepo;
        this.fareService = fareService;
        this.waitlistService = waitlistService;
        this.notifications = notifications;
    }

    // ---------------------------------------------------------------- book

    @Transactional
    public BookingResponse book(String email, BookingRequest req) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"));

        List<Long> seatIds = req.passengers().stream()
                .map(PassengerRequest::seatId).toList();

        if (seatIds.stream().distinct().count() != seatIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Same seat selected twice");
        }

        // Lock the seat rows. Other transactions wait here until we commit.
        List<Seat> seats = seatRepo.findAllByIdForUpdate(seatIds);

        if (seats.size() != seatIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "One or more seats not found");
        }

        ClassType classType = seats.get(0).getClassType();

        for (Seat s : seats) {
            if (!s.getRun().getId().equals(req.runId())
                    || s.getClassType() != classType) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Seats must belong to the same train run and class");
            }

            if (s.getStatus() != SeatStatus.AVAILABLE) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Seat " + s.getSeatNo() + " is no longer available");
            }
        }

        Train t = seats.get(0).getRun().getTrain();
        FareService.Segment seg =
                fareService.segment(t.getId(), req.from(), req.to());

        BigDecimal perSeat = fareService.fareForKm(classType, seg.km());
        BigDecimal total = perSeat.multiply(
                BigDecimal.valueOf(seats.size()));

        LocalDateTime heldUntil =
                LocalDateTime.now().plusMinutes(HOLD_MINUTES);

        for (Seat s : seats) {
            s.setStatus(SeatStatus.HELD);
            s.setHeldUntil(heldUntil);
        }

        Booking booking = bookingRepo.save(Booking.builder()
                .pnr(generatePnr())
                .user(user)
                .run(seats.get(0).getRun())
                .classType(classType)
                .status(BookingStatus.PENDING_PAYMENT)
                .totalFare(total)
                .createdAt(LocalDateTime.now())
                .fromStation(seg.from().getStation())
                .toStation(seg.to().getStation())
                .build());

        Map<Long, Seat> seatById = seats.stream()
                .collect(Collectors.toMap(Seat::getId, Function.identity()));

        List<PassengerInfo> infos = new ArrayList<>();

        for (PassengerRequest p : req.passengers()) {
            Seat seat = seatById.get(p.seatId());

            passengerRepo.save(Passenger.builder()
                    .booking(booking)
                    .name(p.name())
                    .age(p.age())
                    .gender(p.gender())
                    .seat(seat)
                    .build());

            infos.add(new PassengerInfo(
                    p.name(), p.age(), p.gender(),
                    seat.getCoach(), seat.getSeatNo(),
                    seat.getBerth().name()));
        }

        return new BookingResponse(
                booking.getId(), booking.getPnr(), booking.getStatus(),
                classType, total, t.getNumber(), t.getName(),
                booking.fromCode(), booking.toCode(),
                booking.getRun().getRunDate(), heldUntil, infos, null, null);
    }

    // ------------------------------------------------------------ waitlist

    @Transactional
    public BookingResponse joinWaitlist(String email, WaitlistRequest req) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"));

        TrainRun run = runRepo.findById(req.runId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Run not found"));

        Train t = run.getTrain();
        FareService.Segment seg =
                fareService.segment(t.getId(), req.from(), req.to());

        // Same lock as cancel and promotion, so checks cannot be raced.
        waitlistService.lockRun(run.getId());

        int n = req.passengers().size();

        long free = seatRepo.countByRunIdAndClassTypeAndStatus(
                run.getId(), req.classType(), SeatStatus.AVAILABLE);

        if (free >= n) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Berths are available now. Please book them directly");
        }

        long queued = bookingRepo.countByRunIdAndClassTypeAndStatus(
                run.getId(), req.classType(), BookingStatus.WAITLISTED);

        if (queued >= MAX_WAITLIST) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Waitlist is full");
        }

        BigDecimal total = fareService.fareForKm(
                req.classType(), seg.km())
                .multiply(BigDecimal.valueOf(n));

        Booking booking = bookingRepo.save(Booking.builder()
                .pnr(generatePnr())
                .user(user)
                .run(run)
                .classType(req.classType())
                .status(BookingStatus.WAITLISTED)
                .totalFare(total)
                .createdAt(LocalDateTime.now())
                .fromStation(seg.from().getStation())
                .toStation(seg.to().getStation())
                .build());

        for (WaitlistPassenger p : req.passengers()) {
            passengerRepo.save(Passenger.builder()
                    .booking(booking)
                    .name(p.name())
                    .age(p.age())
                    .gender(p.gender())
                    .build());
        }

        // Send waitlist email after the transaction commits.
        notifications.send(
                booking, NotificationService.Type.WAITLISTED);

        return toResponse(booking);
    }

    // ------------------------------------------------------------- history

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(String email) {
        return bookingRepo.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // -------------------------------------------------------------- cancel

    @Transactional
    public BookingResponse cancel(String email, Long bookingId) {
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Not your booking");
        }

        Long runId = booking.getRun().getId();
        ClassType classType = booking.getClassType();

        // Take the run lock first, then re-read.
        waitlistService.lockRun(runId);
        em.refresh(booking);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Booking already cancelled");
        }

        boolean hadSeats =
                booking.getStatus() != BookingStatus.WAITLISTED;

        BigDecimal refund = ZERO;

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            Train t = booking.getRun().getTrain();

            LocalDateTime departure = booking.getRun()
                    .getRunDate().atTime(t.getDepartureTime());

            long hours = Duration.between(
                    LocalDateTime.now(), departure).toHours();

            if (hours < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Train has already departed");
            }

            BigDecimal percent = hours > 48
                    ? new BigDecimal("0.75")
                    : hours >= 12
                    ? new BigDecimal("0.50")
                    : new BigDecimal("0.25");

            refund = booking.getTotalFare()
                    .multiply(percent)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        if (hadSeats) {
            List<Passenger> passengers =
                    passengerRepo.findByBookingId(bookingId);

            List<Long> seatIds = passengers.stream()
                    .map(p -> p.getSeat().getId())
                    .toList();

            List<Seat> seats =
                    seatRepo.findAllByIdForUpdate(seatIds);

            seats.forEach(s -> {
                s.setStatus(SeatStatus.AVAILABLE);
                s.setHeldUntil(null);
            });
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setRefundAmount(refund);
        booking.setCancelledAt(LocalDateTime.now());

        if (hadSeats) {
            // Freed berths go to the queue.
            waitlistService.promote(runId, classType);
        }

        // Send cancellation email after the transaction commits.
        notifications.send(
                booking, NotificationService.Type.CANCELLED);

        return toResponse(booking);
    }

    // ------------------------------------------------------------- helpers

    private PassengerInfo info(Passenger p) {
        Seat s = p.getSeat();

        if (s == null) {
            return new PassengerInfo(
                    p.getName(), p.getAge(), p.getGender(),
                    null, null, null);
        }

        return new PassengerInfo(
                p.getName(), p.getAge(), p.getGender(),
                s.getCoach(), s.getSeatNo(), s.getBerth().name());
    }

    private BookingResponse toResponse(Booking b) {
        Train t = b.getRun().getTrain();

        List<PassengerInfo> infos = passengerRepo
                .findByBookingId(b.getId())
                .stream()
                .map(this::info)
                .toList();

        Integer position = null;

        if (b.getStatus() == BookingStatus.WAITLISTED) {
            position = (int) bookingRepo
                    .countByRunIdAndClassTypeAndStatusAndIdLessThan(
                            b.getRun().getId(),
                            b.getClassType(),
                            BookingStatus.WAITLISTED,
                            b.getId()) + 1;
        }

        return new BookingResponse(
                b.getId(), b.getPnr(), b.getStatus(),
                b.getClassType(), b.getTotalFare(),
                t.getNumber(), t.getName(),
                b.fromCode(), b.toCode(),
                b.getRun().getRunDate(), null, infos,
                b.getRefundAmount(), position);
    }

    private String generatePnr() {
        String pnr;

        do {
            long n = ThreadLocalRandom.current()
                    .nextLong(1_000_000_000L, 10_000_000_000L);
            pnr = String.valueOf(n);
        } while (bookingRepo.existsByPnr(pnr));

        return pnr;
    }
}
