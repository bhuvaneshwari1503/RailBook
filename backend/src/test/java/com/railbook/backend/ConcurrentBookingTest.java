
package com.railbook.backend;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import com.railbook.backend.dto.BookingRequest;
import com.railbook.backend.dto.PassengerRequest;
import com.railbook.backend.entity.Role;
import com.railbook.backend.entity.Seat;
import com.railbook.backend.entity.SeatStatus;
import com.railbook.backend.entity.User;
import com.railbook.backend.repository.SeatRepository;
import com.railbook.backend.repository.UserRepository;
import com.railbook.backend.service.BookingService;

@SpringBootTest
class ConcurrentBookingTest {

    @Autowired BookingService bookingService;
    @Autowired SeatRepository seatRepo;
    @Autowired UserRepository userRepo;

    @Test
    void only_one_user_gets_the_seat() throws Exception {
        int threads = 500;

        User user = userRepo.findByEmail("loadtest@test.com").orElseGet(() ->
                userRepo.save(User.builder()
                        .name("Load Test")
                        .email("loadtest@test.com")
                        .passwordHash("not-used")
                        .role(Role.USER)
                        .build()));

        Seat seat = seatRepo.findAll().stream()
                .filter(s -> s.getStatus() == SeatStatus.AVAILABLE)
                .reduce((first, second) -> second)
                .orElseThrow();

        Long seatId = seat.getId();
        Long runId = seat.getRun().getId();

        String src = seat.getRun().getTrain().getSource().getCode();
        String dst = seat.getRun().getTrain().getDestination().getCode();

        BookingRequest request = new BookingRequest(
                runId,
                src,
                dst,
                List.of(new PassengerRequest("Test", 25, "MALE", seatId))
        );

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger conflict = new AtomicInteger();
        AtomicInteger errors = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    bookingService.book(user.getEmail(), request);
                    success.incrementAndGet();
                } catch (ResponseStatusException e) {
                    if (e.getStatusCode().value() == 409) conflict.incrementAndGet();
                    else errors.incrementAndGet();
                } catch (Exception e) {
                    errors.incrementAndGet();
                    System.out.println("Unexpected: " + e);
                }
            });
        }

        long begin = System.currentTimeMillis();
        start.countDown();
        pool.shutdown();
        pool.awaitTermination(60, TimeUnit.SECONDS);
        long took = System.currentTimeMillis() - begin;

        System.out.println("========== RESULT ==========");
        System.out.println("Requests : " + threads);
        System.out.println("Success  : " + success.get());
        System.out.println("Rejected : " + conflict.get());
        System.out.println("Errors   : " + errors.get());
        System.out.println("Time     : " + took + " ms");
        System.out.println("============================");

        assertEquals(1, success.get(), "Exactly one booking must succeed");
        assertEquals(threads - 1, conflict.get(), "All others must be rejected with 409");
        assertEquals(0, errors.get());
        assertEquals(SeatStatus.HELD, seatRepo.findById(seatId).orElseThrow().getStatus());
    }
}
