
package com.railbook.backend.dto;

public record ProfileResponse(
        String name,
        String email,
        String phone,
        String role
) {}
