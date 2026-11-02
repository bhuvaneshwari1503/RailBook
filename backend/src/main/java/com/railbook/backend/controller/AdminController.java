package com.railbook.backend.controller;

import com.railbook.backend.dto.AdminDtos.*;
import com.railbook.backend.service.AdminService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public Stats stats() {
        return adminService.stats();
    }

    @GetMapping("/bookings")
    public PageResult<BookingRow> bookings(@RequestParam(required = false) String status,
                                           @RequestParam(defaultValue = "") String q,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return adminService.bookings(status, q, page, size);
    }

    @GetMapping("/occupancy")
    public List<OccupancyRow> occupancy(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return adminService.occupancy(date);
    }
}