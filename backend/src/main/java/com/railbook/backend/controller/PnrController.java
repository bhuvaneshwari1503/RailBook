package com.railbook.backend.controller;

import com.railbook.backend.dto.PnrStatusResponse;
import com.railbook.backend.service.PnrService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/pnr")
public class PnrController {

    private final PnrService pnrService;

    public PnrController(PnrService pnrService) {
        this.pnrService = pnrService;
    }

    @GetMapping("/{pnr}")
    public PnrStatusResponse status(@PathVariable String pnr) {
        if (!pnr.matches("\\d{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PNR must be 10 digits");
        }
        return pnrService.status(pnr);
    }
}
