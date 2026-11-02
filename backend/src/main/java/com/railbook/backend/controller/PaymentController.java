package com.railbook.backend.controller;

import com.railbook.backend.dto.BookingResponse;
import com.railbook.backend.dto.PaymentRequest;
import com.railbook.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/simulate")
    public BookingResponse simulate(Authentication authentication,
                                    @Valid @RequestBody PaymentRequest req) {
        return paymentService.pay(authentication.getName(), req.bookingId());
    }
}