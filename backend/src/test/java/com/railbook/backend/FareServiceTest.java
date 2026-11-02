package com.railbook.backend;

import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.Station;
import com.railbook.backend.entity.TrainStop;
import com.railbook.backend.repository.TrainStopRepository;
import com.railbook.backend.service.FareService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FareServiceTest {

    @Mock TrainStopRepository stopRepo;
    @InjectMocks FareService fareService;

    private static void assertFare(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), "fare was " + actual);
    }

    private static TrainStop stop(String code, int order, int km) {
        return TrainStop.builder()
                .station(Station.builder().code(code).build())
                .stopOrder(order).distanceKm(km).build();
    }

    private void stubStops() {
        when(stopRepo.findByTrainIdOrderByStopOrder(1L)).thenReturn(List.of(
                stop("MAS", 1, 0), stop("KPD", 2, 132), stop("SBC", 3, 362)));
    }

    @Test
    void fare_is_rate_times_distance_rounded() {
        assertFare("211", fareService.fareForKm(ClassType.AC3, 132));   // 1.60 x 132 = 211.2
        assertFare("1376", fareService.fareForKm(ClassType.AC1, 362));  // 3.80 x 362 = 1375.6
    }

    @Test
    void short_journeys_pay_the_minimum_fare() {
        assertFare("100", fareService.fareForKm(ClassType.SL, 132));    // 79.2 -> minimum 100
    }

    @Test
    void segment_between_two_stops_uses_the_distance_between_them() {
        stubStops();
        FareService.Segment seg = fareService.segment(1L, "kpd", "SBC");   // case-insensitive
        assertEquals(230, seg.km());
    }

    @Test
    void wrong_direction_is_rejected() {
        stubStops();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fareService.segment(1L, "SBC", "MAS"));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void unknown_station_is_rejected() {
        stubStops();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fareService.segment(1L, "MAS", "XYZ"));
        assertEquals(400, ex.getStatusCode().value());
    }
}