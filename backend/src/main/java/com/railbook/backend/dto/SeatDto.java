package com.railbook.backend.dto;

import java.math.BigDecimal;

import com.railbook.backend.entity.Berth;
import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.SeatStatus;

public record SeatDto(Long id, String coach, int seatNo, Berth berth,
                      ClassType classType, BigDecimal fare, SeatStatus status) {}