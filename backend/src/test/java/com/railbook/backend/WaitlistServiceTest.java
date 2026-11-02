package com.railbook.backend;

import com.railbook.backend.entity.*;
import com.railbook.backend.repository.*;
import com.railbook.backend.service.NotificationService;
import com.railbook.backend.service.WaitlistService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock TrainRunRepository runRepo;
    @Mock SeatRepository seatRepo;
    @Mock BookingRepository bookingRepo;
    @Mock PassengerRepository passengerRepo;
    @Mock PaymentRepository paymentRepo;
    @Mock NotificationService notifications;
    @InjectMocks WaitlistService waitlistService;

    private Booking waitlisted(long id) {
        return Booking.builder().id(id).classType(ClassType.AC1).status(BookingStatus.WAITLISTED)
                .totalFare(new BigDecimal("1000")).build();
    }

    private Passenger passenger(long id, Booking b) {
        return Passenger.builder().id(id).booking(b).name("P" + id).age(30).gender("MALE").build();
    }

    @Test
    void first_waitlisted_booking_is_confirmed_and_the_next_one_waits_if_it_does_not_fit() {
        Booking first = waitlisted(1);     // needs 1 berth
        Booking second = waitlisted(2);    // needs 2 berths
        Passenger p1 = passenger(11, first);
        Passenger p2a = passenger(21, second);
        Passenger p2b = passenger(22, second);
        Seat freeSeat = Seat.builder().id(100L).classType(ClassType.AC1).status(SeatStatus.AVAILABLE).build();

        when(runRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(new TrainRun()));
        when(bookingRepo.findByRunIdAndClassTypeAndStatusOrderByIdAsc(1L, ClassType.AC1, BookingStatus.WAITLISTED))
                .thenReturn(List.of(first, second));
        when(passengerRepo.findByBookingId(1L)).thenReturn(List.of(p1));
        when(passengerRepo.findByBookingId(2L)).thenReturn(List.of(p2a, p2b));
        // only one berth is free, so the second lookup comes back short
        when(seatRepo.findAvailableForUpdate(eq(1L), eq(ClassType.AC1), any(Pageable.class)))
                .thenReturn(List.of(freeSeat), List.of());

        int promoted = waitlistService.promote(1L, ClassType.AC1);

        assertEquals(1, promoted);
        assertEquals(BookingStatus.CONFIRMED, first.getStatus());
        assertEquals(BookingStatus.WAITLISTED, second.getStatus());
        assertEquals(SeatStatus.BOOKED, freeSeat.getStatus());
        assertSame(freeSeat, p1.getSeat());
        verify(paymentRepo, times(1)).save(any(Payment.class));
        verify(notifications).send(first, NotificationService.Type.PROMOTED);
        verify(notifications, never()).send(eq(second), any());
    }

    @Test
    void nothing_happens_when_the_queue_is_empty() {
        when(runRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(new TrainRun()));
        when(bookingRepo.findByRunIdAndClassTypeAndStatusOrderByIdAsc(1L, ClassType.AC1, BookingStatus.WAITLISTED))
                .thenReturn(List.of());

        assertEquals(0, waitlistService.promote(1L, ClassType.AC1));
        verifyNoInteractions(paymentRepo, notifications);
    }
}