package com.railbook.backend.dto;

import com.railbook.backend.entity.ClassType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record WaitlistRequest(
        @NotNull Long runId,
        @NotBlank String from,
        @NotBlank String to,
        @NotNull ClassType classType,
        @NotEmpty @Size(max = 6) @Valid List<WaitlistPassenger> passengers
) {}