package com.railbook.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BookingRequest(
        @NotNull Long runId,
        @NotBlank String from,
        @NotBlank String to,
        @NotEmpty @Size(max = 6) @Valid List<PassengerRequest> passengers
) {}