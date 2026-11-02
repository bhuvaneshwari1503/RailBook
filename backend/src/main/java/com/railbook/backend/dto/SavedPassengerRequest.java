
package com.railbook.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SavedPassengerRequest(
        @NotBlank String name,
        @Min(1) @Max(120) int age,
        @NotBlank
        @Pattern(regexp = "MALE|FEMALE|OTHER")
        String gender
) {}
