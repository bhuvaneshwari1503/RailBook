package com.railbook.backend.dto;

import com.railbook.backend.entity.BookingStatus;
import com.railbook.backend.entity.ClassType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        String pnr,
        BookingStatus status,
        ClassType classType,
        BigDecimal totalFare,
        String trainNumber,
        String trainName,
        String from,
        String to,
        LocalDate date,
        LocalDateTime heldUntil,
        List<PassengerInfo> passengers,
        BigDecimal refundAmount,
        Integer waitlistPosition
) {}