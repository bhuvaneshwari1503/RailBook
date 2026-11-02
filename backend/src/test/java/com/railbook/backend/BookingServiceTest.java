package com.railbook.backend;

import com.railbook.backend.dto.*;
import com.railbook.backend.entity.*;
import com.railbook.backend.repository.*;
import com.railbook.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock UserRepository userRepo;
    @Mock SeatRepository seatRepo;
    @Mock BookingRepository bookingRepo;
    @Mock PassengerRepository passengerRepo;
    @Mock TrainRunRepository runRepo;
    @Mock FareService fareService;
    @Mock WaitlistService waitlistService;
    @Mock NotificationService notifications;
    @InjectMocks BookingService bookingService;

    private static final String EMAIL = "asha@test.com";

    private User user;
    private TrainRun run;
    private FareService.Segment segment;

    @BeforeEach
    void setUp() {
        Station mas = Station.builder().id(1L).code("MAS").build();
        Station sbc = Station.builder().id(2L).code("SBC").build();
        Train train = Train.builder().id(10L).number("12607").name("Lalbagh Express")
                .source(mas).destination(sbc).build();
        run = TrainRun.builder().id(1L).train(train).runDate(LocalDate.now().plusDays(1)).build();
        user = User.builder().id(5L).name("Asha").email(EMAIL).build();
        segment = new FareService.Segment(
                TrainStop.builder().station(mas).stopOrder(1).distanceKm(0).build(),
                TrainStop.builder().station(sbc).stopOrder(2).distanceKm(362).build());
    }

    private Seat seat(long id, int no, SeatStatus status) {
        return Seat.builder().id(id).run(run).classType(ClassType.SL).seatNo(no)
                .coach("S1").berth(Berth.LB).fare(new BigDecimal("500")).status(status).build();
    }

    private PassengerRequest passenger(String name, long seatId) {
        return new PassengerRequest(name, 25, "MALE", seatId);
    }

    @Test
    void booking_two_free_seats_holds_them_and_charges_the_segment_fare() {
        Seat s1 = seat(1, 1, SeatStatus.AVAILABLE);
        Seat s2 = seat(2, 2, SeatStatus.AVAILABLE);
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(seatRepo.findAllByIdForUpdate(List.of(1L, 2L))).thenReturn(List.of(s1, s2));
        when(fareService.segment(10L, "MAS", "SBC")).thenReturn(segment);
        when(fareService.fareForKm(ClassType.SL, 362)).thenReturn(new BigDecimal("217"));
        when(bookingRepo.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse res = bookingService.book(EMAIL, new BookingRequest(1L, "MAS", "SBC",
                List.of(passenger("Asha", 1), passenger("Ravi", 2))));

        assertEquals(BookingStatus.PENDING_PAYMENT, res.status());
        assertEquals(0, new BigDecimal("434").compareTo(res.totalFare()));   // 2 x 217
        assertEquals(10, res.pnr().length());
        assertNotNull(res.heldUntil());
        assertEquals(2, res.passengers().size());
        assertEquals(SeatStatus.HELD, s1.getStatus());
        assertEquals(SeatStatus.HELD, s2.getStatus());
        verify(passengerRepo, times(2)).save(any(Passenger.class));
    }

    @Test
    void booking_a_taken_seat_returns_409_and_saves_nothing() {
        Seat taken = seat(1, 1, SeatStatus.BOOKED);
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(seatRepo.findAllByIdForUpdate(List.of(1L))).thenReturn(List.of(taken));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.book(EMAIL, new BookingRequest(1L, "MAS", "SBC", List.of(passenger("Asha", 1)))));

        assertEquals(409, ex.getStatusCode().value());
        verify(bookingRepo, never()).save(any());
    }

    @Test
    void selecting_the_same_seat_twice_returns_400_before_touching_seats() {
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.book(EMAIL, new BookingRequest(1L, "MAS", "SBC",
                        List.of(passenger("Asha", 1), passenger("Ravi", 1)))));

        assertEquals(400, ex.getStatusCode().value());
        verifyNoInteractions(seatRepo);
    }

    @Test
    void joining_the_waitlist_while_berths_are_free_returns_409() {
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(runRepo.findById(1L)).thenReturn(Optional.of(run));
        when(fareService.segment(10L, "MAS", "SBC")).thenReturn(segment);
        when(seatRepo.countByRunIdAndClassTypeAndStatus(1L, ClassType.SL, SeatStatus.AVAILABLE))
                .thenReturn(5L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.joinWaitlist(EMAIL, new WaitlistRequest(1L, "MAS", "SBC", ClassType.SL,
                        List.of(new WaitlistPassenger("Asha", 25, "FEMALE")))));

        assertEquals(409, ex.getStatusCode().value());
        verify(bookingRepo, never()).save(any());
    }

    @Test
    void joining_a_sold_out_class_creates_a_waitlisted_booking_at_position_one() {
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(runRepo.findById(1L)).thenReturn(Optional.of(run));
        when(fareService.segment(10L, "MAS", "SBC")).thenReturn(segment);
        when(fareService.fareForKm(ClassType.SL, 362)).thenReturn(new BigDecimal("217"));
        when(seatRepo.countByRunIdAndClassTypeAndStatus(1L, ClassType.SL, SeatStatus.AVAILABLE))
                .thenReturn(0L);
        when(bookingRepo.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse res = bookingService.joinWaitlist(EMAIL, new WaitlistRequest(1L, "MAS", "SBC",
                ClassType.SL, List.of(new WaitlistPassenger("Asha", 25, "FEMALE"))));

        assertEquals(BookingStatus.WAITLISTED, res.status());
        assertEquals(1, res.waitlistPosition());
        assertEquals(0, new BigDecimal("217").compareTo(res.totalFare()));
        verify(waitlistService).lockRun(1L);
        verify(notifications).send(any(Booking.class), eq(NotificationService.Type.WAITLISTED));
    }
}
