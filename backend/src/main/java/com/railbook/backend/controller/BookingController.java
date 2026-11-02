
package com.railbook.backend.controller;

import com.railbook.backend.dto.BookingRequest;
import com.railbook.backend.dto.BookingResponse;
import com.railbook.backend.dto.WaitlistRequest;
import com.railbook.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public BookingResponse book(
            Authentication authentication,
            @Valid @RequestBody BookingRequest req) {
        return bookingService.book(authentication.getName(), req);
    }

    @PostMapping("/waitlist")
    public BookingResponse joinWaitlist(
            Authentication authentication,
            @Valid @RequestBody WaitlistRequest req) {
        return bookingService.joinWaitlist(authentication.getName(), req);
    }

    @GetMapping("/my")
    public List<BookingResponse> my(Authentication authentication) {
        return bookingService.myBookings(authentication.getName());
    }

    @PutMapping("/{id}/cancel")
    public BookingResponse cancel(
            Authentication authentication,
            @PathVariable Long id) {
        return bookingService.cancel(authentication.getName(), id);
    }
}
