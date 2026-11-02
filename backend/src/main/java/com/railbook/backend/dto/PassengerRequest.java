package com.railbook.backend.dto;

import jakarta.validation.constraints.*;

public record PassengerRequest(
        @NotBlank String name,
        @Min(1) @Max(120) int age,
        @NotBlank @Pattern(regexp = "MALE|FEMALE|OTHER") String gender,
        @NotNull Long seatId
) {}