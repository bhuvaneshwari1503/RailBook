
package com.railbook.backend.service;

import com.railbook.backend.entity.*;
import com.railbook.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class WaitlistService {

    private final TrainRunRepository runRepo;
    private final SeatRepository seatRepo;
    private final BookingRepository bookingRepo;
    private final PassengerRepository passengerRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationService notifications;

    public WaitlistService(
            TrainRunRepository runRepo,
            SeatRepository seatRepo,
            BookingRepository bookingRepo,
            PassengerRepository passengerRepo,
            PaymentRepository paymentRepo,
            NotificationService notifications) {
        this.runRepo = runRepo;
        this.seatRepo = seatRepo;
        this.bookingRepo = bookingRepo;
        this.passengerRepo = passengerRepo;
        this.paymentRepo = paymentRepo;
        this.notifications = notifications;
    }

    /** Row lock on the run. Cancel, join-waitlist and promotion queue up behind each other. */
    public void lockRun(Long runId) {
        runRepo.findByIdForUpdate(runId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Run not found"));
    }

    /** Confirms waitlisted bookings (oldest first) while free berths exist. Returns how many. */
    @Transactional
    public int promote(Long runId, ClassType classType) {
        lockRun(runId);
        int promoted = 0;

        List<Booking> queue =
                bookingRepo.findByRunIdAndClassTypeAndStatusOrderByIdAsc(
                        runId, classType, BookingStatus.WAITLISTED);

        for (Booking b : queue) {
            List<Passenger> passengers =
                    passengerRepo.findByBookingId(b.getId()).stream()
                            .sorted(Comparator.comparing(Passenger::getId))
                            .toList();

            List<Seat> seats = seatRepo.findAvailableForUpdate(
                    runId, classType, PageRequest.of(0, passengers.size()));

            if (seats.size() < passengers.size()) {
                break; // Strict first-come, first-served.
            }

            for (int i = 0; i < passengers.size(); i++) {
                Seat s = seats.get(i);
                s.setStatus(SeatStatus.BOOKED);
                s.setHeldUntil(null);
                passengers.get(i).setSeat(s);
            }

            // Simulated auto-debit at confirmation time.
            paymentRepo.save(Payment.builder()
                    .booking(b)
                    .amount(b.getTotalFare())
                    .status(PaymentStatus.SUCCESS)
                    .txnRef("TXN" + UUID.randomUUID()
                            .toString().replace("-", "")
                            .substring(0, 12).toUpperCase())
                    .paidAt(LocalDateTime.now())
                    .build());

            b.setStatus(BookingStatus.CONFIRMED);

            // Send promotion email after the transaction commits.
            notifications.send(b, NotificationService.Type.PROMOTED);

            promoted++;
        }

        if (promoted > 0) {
            System.out.println(
                    "Waitlist: promoted " + promoted
                            + " booking(s) on run " + runId);
        }

        return promoted;
    }
}
