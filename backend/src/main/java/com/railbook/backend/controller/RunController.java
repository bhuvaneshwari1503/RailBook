package com.railbook.backend.controller;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.railbook.backend.dto.SeatDto;
import com.railbook.backend.entity.ClassType;
import com.railbook.backend.service.SeatService;

@RestController
@RequestMapping("/api/runs")
public class RunController {

    private final SeatService seatService;

    public RunController(SeatService seatService) {
        this.seatService = seatService;
    }

       @GetMapping("/{runId}/seats")
    public List<SeatDto> seats(@PathVariable Long runId,
                               @RequestParam ClassType classType,
                               @RequestParam(required = false) String from,
                               @RequestParam(required = false) String to) {
        return seatService.getSeats(runId, classType, from, to);
    }
}