package com.railbook.backend.dto;

import com.railbook.backend.entity.ClassType;
import java.math.BigDecimal;

public record ClassAvailability(ClassType classType, long available, BigDecimal fare) {}