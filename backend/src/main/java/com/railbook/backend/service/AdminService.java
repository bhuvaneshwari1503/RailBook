package com.railbook.backend.service;

import com.railbook.backend.dto.AdminDtos.*;
import com.railbook.backend.entity.*;
import com.railbook.backend.repository.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepo;
    private final BookingRepository bookingRepo;
    private final PaymentRepository paymentRepo;
    private final SeatRepository seatRepo;

    public AdminService(UserRepository userRepo, BookingRepository bookingRepo,
                        PaymentRepository paymentRepo, SeatRepository seatRepo) {
        this.userRepo = userRepo;
        this.bookingRepo = bookingRepo;
        this.paymentRepo = paymentRepo;
        this.seatRepo = seatRepo;
    }

    @Transactional(readOnly = true)
    public Stats stats() {
        BigDecimal revenue = paymentRepo.totalRevenue();
        BigDecimal refunds = bookingRepo.totalRefunds();

        // revenue for the last 7 days (today included), zero-filled
        LocalDate start = LocalDate.now().minusDays(6);
        Map<LocalDate, BigDecimal> byDay = new TreeMap<>();
        for (int i = 0; i < 7; i++) byDay.put(start.plusDays(i), BigDecimal.ZERO);
        for (Object[] r : paymentRepo.paymentsSince(start.atStartOfDay())) {
            LocalDate d = ((LocalDateTime) r[0]).toLocalDate();
            byDay.merge(d, (BigDecimal) r[1], BigDecimal::add);
        }
        List<DailyRevenue> daily = byDay.entrySet().stream()
                .map(e -> new DailyRevenue(e.getKey(), e.getValue())).toList();

        List<TopTrain> top = bookingRepo.topTrains(PageRequest.of(0, 5)).stream()
                .map(r -> new TopTrain((String) r[0], (String) r[1],
                        ((Number) r[2]).longValue(), (BigDecimal) r[3]))
                .toList();

        return new Stats(
                userRepo.count(), bookingRepo.count(),
                bookingRepo.countByStatus(BookingStatus.CONFIRMED),
                bookingRepo.countByStatus(BookingStatus.CANCELLED),
                bookingRepo.countByStatus(BookingStatus.WAITLISTED),
                bookingRepo.countByStatus(BookingStatus.PENDING_PAYMENT),
                revenue, refunds, revenue.subtract(refunds), daily, top);
    }

    @Transactional(readOnly = true)
    public PageResult<BookingRow> bookings(String status, String q, int page, int size) {
        List<BookingStatus> statuses;
        if (status == null || status.isBlank()) {
            statuses = Arrays.asList(BookingStatus.values());
        } else {
            try {
                statuses = List.of(BookingStatus.valueOf(status));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
            }
        }
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Booking> result = bookingRepo.search(statuses, q == null ? "" : q.trim(), pageable);

        List<BookingRow> rows = result.getContent().stream().map(b -> {
            Train t = b.getRun().getTrain();
            return new BookingRow(b.getId(), b.getPnr(), b.getUser().getName(), b.getUser().getEmail(),
                    b.getStatus(), t.getNumber(), t.getName(), b.fromCode(), b.toCode(),
                    b.getRun().getRunDate(), b.getClassType(), b.getTotalFare(),
                    b.getRefundAmount(), b.getCreatedAt());
        }).toList();

        return new PageResult<>(rows, result.getNumber(), result.getTotalPages(),
                result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<OccupancyRow> occupancy(LocalDate date) {
        return seatRepo.occupancy(date).stream()
                .map(r -> new OccupancyRow((String) r[0], (String) r[1], (ClassType) r[2],
                        ((Number) r[3]).longValue(), ((Number) r[4]).longValue(),
                        ((Number) r[5]).longValue()))
                .toList();
    }
}