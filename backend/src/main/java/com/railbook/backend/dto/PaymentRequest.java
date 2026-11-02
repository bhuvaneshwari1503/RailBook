package com.railbook.backend.dto;

import jakarta.validation.constraints.NotNull;

public record PaymentRequest(@NotNull Long bookingId) {}