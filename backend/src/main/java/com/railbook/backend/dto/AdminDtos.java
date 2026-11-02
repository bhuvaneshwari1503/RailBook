package com.railbook.backend.dto;

import com.railbook.backend.entity.BookingStatus;
import com.railbook.backend.entity.ClassType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}

    public record DailyRevenue(LocalDate date, BigDecimal amount) {}

    public record TopTrain(String trainNumber, String trainName, long bookings, BigDecimal revenue) {}

    public record Stats(long totalUsers, long totalBookings, long confirmed, long cancelled,
                        long waitlisted, long pending, BigDecimal revenue, BigDecimal refunds,
                        BigDecimal netRevenue, List<DailyRevenue> daily, List<TopTrain> topTrains) {}

    public record BookingRow(Long id, String pnr, String userName, String userEmail,
                             BookingStatus status, String trainNumber, String trainName,
                             String from, String to, LocalDate date, ClassType classType,
                             BigDecimal totalFare, BigDecimal refundAmount, LocalDateTime createdAt) {}

    public record PageResult<T>(List<T> items, int page, int totalPages, long totalElements) {}

    public record OccupancyRow(String trainNumber, String trainName, ClassType classType,
                               long total, long booked, long held) {}
}