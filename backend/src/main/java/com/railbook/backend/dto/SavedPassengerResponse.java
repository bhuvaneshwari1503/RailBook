
package com.railbook.backend.dto;

public record SavedPassengerResponse(
        Long id,
        String name,
        int age,
        String gender
) {}
