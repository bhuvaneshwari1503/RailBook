package com.railbook.backend.dto;

public record PassengerInfo(
        String name,
        int age,
        String gender,
        String coach,
        Integer seatNo,
        String berth
) {}