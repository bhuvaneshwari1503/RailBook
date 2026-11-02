package com.railbook.backend.dto;

import com.railbook.backend.entity.BookingStatus;
import com.railbook.backend.entity.ClassType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record PnrStatusResponse(
        String pnr,
        BookingStatus status,
        Integer waitlistPosition,
        String trainNumber,
        String trainName,
        String from,
        String to,
        LocalDate date,
        LocalTime departureTime,
        ClassType classType,
        List<PassengerInfo> passengers
) {}