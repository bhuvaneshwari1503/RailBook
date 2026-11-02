
package com.railbook.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.railbook.backend.dto.BookingResponse;
import com.railbook.backend.dto.PassengerInfo;
import com.railbook.backend.entity.Booking;
import com.railbook.backend.entity.BookingStatus;
import com.railbook.backend.entity.Passenger;
import com.railbook.backend.entity.Payment;
import com.railbook.backend.entity.PaymentStatus;
import com.railbook.backend.entity.SeatStatus;
import com.railbook.backend.entity.Train;
import com.railbook.backend.repository.BookingRepository;
import com.railbook.backend.repository.PassengerRepository;
import com.railbook.backend.repository.PaymentRepository;

@Service
public class PaymentService {

    private final BookingRepository bookingRepo;
    private final PassengerRepository passengerRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationService notifications;

    public PaymentService(
            BookingRepository bookingRepo,
            PassengerRepository passengerRepo,
            PaymentRepository paymentRepo,
            NotificationService notifications) {
        this.bookingRepo = bookingRepo;
        this.passengerRepo = passengerRepo;
        this.paymentRepo = paymentRepo;
        this.notifications = notifications;
    }

    @Transactional
    public BookingResponse pay(String email, Long bookingId) {
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Not your booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Booking is " + booking.getStatus() + ", payment not allowed");
        }

        List<Passenger> passengers =
                passengerRepo.findByBookingId(bookingId);

        // The hold must still be valid
        LocalDateTime now = LocalDateTime.now();

        boolean expired = passengers.stream().anyMatch(p ->
                p.getSeat().getStatus() != SeatStatus.HELD
                || p.getSeat().getHeldUntil() == null
                || p.getSeat().getHeldUntil().isBefore(now));

        if (expired) {
            throw new ResponseStatusException(
                    HttpStatus.GONE, "Seat hold expired. Please book again");
        }

        // Simulate the gateway delay
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        paymentRepo.save(Payment.builder()
                .booking(booking)
                .amount(booking.getTotalFare())
                .status(PaymentStatus.SUCCESS)
                .txnRef("TXN" + UUID.randomUUID()
                        .toString().replace("-", "")
                        .substring(0, 12).toUpperCase())
                .paidAt(now)
                .build());

        booking.setStatus(BookingStatus.CONFIRMED);

        passengers.forEach(p -> {
            p.getSeat().setStatus(SeatStatus.BOOKED);
            p.getSeat().setHeldUntil(null);
        });

        // Send confirmation email after the transaction commits
        notifications.send(booking, NotificationService.Type.CONFIRMED);

        Train t = booking.getRun().getTrain();

        List<PassengerInfo> infos = passengers.stream()
                .map(p -> new PassengerInfo(
                        p.getName(),
                        p.getAge(),
                        p.getGender(),
                        p.getSeat().getCoach(),
                        p.getSeat().getSeatNo(),
                        p.getSeat().getBerth().name()))
                .toList();

        return new BookingResponse(
                booking.getId(),
                booking.getPnr(),
                booking.getStatus(),
                booking.getClassType(),
                booking.getTotalFare(),
                t.getNumber(),
                t.getName(),
                booking.fromCode(),
                booking.toCode(),
                booking.getRun().getRunDate(),
                null,
                infos,
                null,
                null);
    }
}

