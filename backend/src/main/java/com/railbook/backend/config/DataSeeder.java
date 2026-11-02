
package com.railbook.backend.config;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.railbook.backend.entity.ClassType;
import com.railbook.backend.entity.Station;
import com.railbook.backend.entity.Train;
import com.railbook.backend.entity.TrainRun;
import com.railbook.backend.entity.TrainStop;
import com.railbook.backend.repository.StationRepository;
import com.railbook.backend.repository.TrainRepository;
import com.railbook.backend.repository.TrainRunRepository;
import com.railbook.backend.repository.TrainStopRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final int HALT_MIN = 2;
    private static final int DAYS = 7;

    private record CoachSpec(ClassType classType, String name, int berths) {}

    private static final List<CoachSpec> COACHES = List.of(
            new CoachSpec(ClassType.SL, "S1", 72),
            new CoachSpec(ClassType.SL, "S2", 72),
            new CoachSpec(ClassType.AC3, "B1", 72),
            new CoachSpec(ClassType.AC2, "A1", 48),
            new CoachSpec(ClassType.AC1, "H1", 24));

    private static String berthFor(ClassType ct, int n) {
        if (ct == ClassType.AC1) {
            return (n - 1) % 2 == 0 ? "LB" : "UB";
        }
        if (ct == ClassType.AC2) {
            return new String[]{"LB", "UB", "LB", "UB", "SL", "SU"}[(n - 1) % 6];
        }
        return new String[]{"LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"}[(n - 1) % 8];
    }

    private static final Map<ClassType, BigDecimal> RATE_PER_KM = Map.of(
            ClassType.SL, new BigDecimal("0.60"),
            ClassType.AC3, new BigDecimal("1.60"),
            ClassType.AC2, new BigDecimal("2.30"),
            ClassType.AC1, new BigDecimal("3.80"));

    private record Corridor(String[] codes, int[] kms) {}

    // ---------- stations: CODE|Name ----------
    private static final String[] STATIONS = {
        "MAS|Chennai Central", "AJJ|Arakkonam Junction", "KPD|Katpadi Junction",
        "JTJ|Jolarpettai Junction", "BWT|Bangarapet Junction", "KJM|Krishnarajapuram",
        "SBC|KSR Bengaluru City", "SA|Salem Junction", "ED|Erode Junction",
        "TUP|Tiruppur", "CBE|Coimbatore Junction", "VM|Villupuram Junction",
        "TPJ|Tiruchirappalli Junction", "DG|Dindigul Junction", "MDU|Madurai Junction",
        "KVP|Kovilpatti", "TEN|Tirunelveli Junction", "NCJ|Nagercoil Junction",
        "CAPE|Kanniyakumari", "PGT|Palakkad Junction", "TCR|Thrissur",
        "ERS|Ernakulam Junction", "KTYM|Kottayam", "TVC|Thiruvananthapuram Central",
        "NLR|Nellore", "OGL|Ongole", "BZA|Vijayawada Junction", "KMT|Khammam",
        "WL|Warangal", "SC|Secunderabad Junction", "NGP|Nagpur Junction",
        "BPL|Bhopal Junction", "JHS|Jhansi Junction", "AGC|Agra Cantt",
        "NDLS|New Delhi", "BCT|Mumbai Central", "ST|Surat", "BRC|Vadodara Junction",
        "RTM|Ratlam Junction", "KOTA|Kota Junction", "CSMT|Mumbai CSMT",
        "PUNE|Pune Junction", "SUR|Solapur", "RC|Raichur Junction",
        "GTL|Guntakal Junction", "ATP|Anantapur", "KRNT|Kurnool City",
        "CNB|Kanpur Central", "PRYJ|Prayagraj Junction", "DDU|Pt DD Upadhyaya Junction",
        "PNBE|Patna Junction", "ASN|Asansol Junction", "HWH|Howrah Junction",
        "JP|Jaipur Junction", "AII|Ajmer Junction", "ABR|Abu Road",
        "ADI|Ahmedabad Junction", "PNP|Panipat Junction", "UMB|Ambala Cantt",
        "LDH|Ludhiana Junction", "JUC|Jalandhar City", "ASR|Amritsar Junction"
    };

    // ---------- corridors: ordered stations with km from the first one (approximate) ----------
    private static final List<Corridor> CORRIDORS = List.of(
        /* 0 */ new Corridor(new String[]{"MAS","AJJ","KPD","JTJ","BWT","KJM","SBC"},
                             new int[]{0,69,132,213,270,346,362}),
        /* 1 */ new Corridor(new String[]{"MAS","AJJ","KPD","SA","ED","TUP","CBE"},
                             new int[]{0,69,132,340,400,441,495}),
        /* 2 */ new Corridor(new String[]{"MAS","VM","TPJ","DG","MDU","KVP","TEN","NCJ","CAPE"},
                             new int[]{0,160,330,420,497,580,650,720,740}),
        /* 3 */ new Corridor(new String[]{"MAS","KPD","SA","ED","CBE","PGT","TCR","ERS","KTYM","TVC"},
                             new int[]{0,132,340,400,495,540,620,700,770,920}),
        /* 4 */ new Corridor(new String[]{"MAS","NLR","OGL","BZA","KMT","WL","SC"},
                             new int[]{0,175,280,430,530,625,715}),
        /* 5 */ new Corridor(new String[]{"MAS","NLR","BZA","WL","NGP","BPL","JHS","AGC","NDLS"},
                             new int[]{0,175,430,625,1100,1550,1750,1930,2180}),
        /* 6 */ new Corridor(new String[]{"BCT","ST","BRC","RTM","KOTA","NDLS"},
                             new int[]{0,263,392,640,920,1385}),
        /* 7 */ new Corridor(new String[]{"CSMT","PUNE","SUR","RC","GTL","SBC"},
                             new int[]{0,192,455,700,850,1180}),
        /* 8 */ new Corridor(new String[]{"SBC","ATP","GTL","KRNT","SC"},
                             new int[]{0,220,310,420,630}),
        /* 9 */ new Corridor(new String[]{"NDLS","CNB","PRYJ","DDU","PNBE","ASN","HWH"},
                             new int[]{0,440,635,760,990,1300,1450}),
        /* 10 */ new Corridor(new String[]{"NDLS","JP","AII","ABR","ADI"},
                              new int[]{0,308,440,690,935}),
        /* 11 */ new Corridor(new String[]{"NDLS","PNP","UMB","LDH","JUC","ASR"},
                              new int[]{0,90,200,315,365,450})
    );

    // corridor|number|name|from|to|forwardStart|returnStart|avgSpeedKmh|skipEveryOtherStop
    // each line creates TWO trains: number (forward) and number+1 (return)
    private static final String[] TEMPLATES = {
        "0|12607|Lalbagh Express|MAS|SBC|06:00|15:30|65|true",
        "0|12027|Shatabdi Express|MAS|SBC|05:50|14:30|85|true",
        "0|22625|Double Decker Express|MAS|SBC|07:25|16:20|60|false",
        "1|12675|Kovai Express|MAS|CBE|06:15|14:00|60|true",
        "1|12679|Intercity Express|MAS|CBE|07:15|15:10|55|false",
        "1|22671|Coimbatore Superfast|MAS|CBE|21:30|21:00|65|true",
        "2|12633|Kanyakumari Express|MAS|CAPE|17:30|17:20|55|false",
        "2|12635|Vaigai Express|MAS|MDU|13:50|06:40|60|true",
        "2|12661|Pothigai Express|MAS|TEN|19:00|18:50|55|true",
        "3|12623|Trivandrum Mail|MAS|TVC|19:45|14:00|60|true",
        "3|12695|Trivandrum Superfast|MAS|TVC|16:30|15:45|65|true",
        "3|22639|Ernakulam Express|MAS|ERS|20:10|19:30|60|false",
        "4|12759|Charminar Express|MAS|SC|18:10|18:30|60|true",
        "4|12603|Hyderabad Express|MAS|SC|16:55|16:30|65|true",
        "4|12711|Pinakini Express|MAS|BZA|07:10|15:50|60|false",
        "5|12621|Tamil Nadu Express|MAS|NDLS|22:00|21:30|65|true",
        "5|12433|Chennai Rajdhani|MAS|NDLS|06:10|16:00|85|true",
        "5|12295|Nagpur Express|MAS|NGP|20:00|06:30|60|false",
        "6|12951|Mumbai Rajdhani|BCT|NDLS|16:35|16:55|85|true",
        "6|12953|August Kranti Express|BCT|NDLS|17:40|17:15|75|true",
        "6|12901|Gujarat Mail|BCT|BRC|22:00|05:00|60|false",
        "7|11301|Udyan Express|CSMT|SBC|08:05|07:45|55|false",
        "7|11139|Hutatma Express|CSMT|SUR|21:00|22:00|60|true",
        "7|22103|Bengaluru Superfast|PUNE|SBC|19:20|19:00|65|true",
        "8|12785|Kacheguda Express|SBC|SC|19:20|18:40|60|true",
        "8|12735|Yesvantpur Express|SBC|SC|17:00|16:30|65|true",
        "8|17603|Kurnool Intercity|SBC|KRNT|06:00|17:30|50|false",
        "9|12301|Howrah Rajdhani|NDLS|HWH|16:55|16:50|85|true",
        "9|12305|Poorva Express|NDLS|HWH|17:00|16:15|70|true",
        "9|12381|Prayagraj Express|NDLS|PRYJ|22:30|21:50|65|true",
        "10|12915|Ashram Express|NDLS|ADI|15:30|17:30|70|true",
        "10|12957|Ahmedabad Rajdhani|NDLS|ADI|19:55|19:35|80|true",
        "10|12413|Ajmer Shatabdi|NDLS|AII|06:05|15:50|85|true",
        "11|12029|Swarna Shatabdi|NDLS|ASR|07:20|17:20|85|true",
        "11|12497|Shan-e-Punjab Express|NDLS|ASR|15:00|06:00|65|true",
        "11|14649|Ludhiana Intercity|NDLS|LDH|06:00|17:00|55|false"
    };

    private final StationRepository stationRepo;
    private final TrainRepository trainRepo;
    private final TrainStopRepository stopRepo;
    private final TrainRunRepository runRepo;
    private final JdbcTemplate jdbc;

    public DataSeeder(StationRepository stationRepo, TrainRepository trainRepo,
                      TrainStopRepository stopRepo, TrainRunRepository runRepo,
                      JdbcTemplate jdbc) {
        this.stationRepo = stationRepo;
        this.trainRepo = trainRepo;
        this.stopRepo = stopRepo;
        this.runRepo = runRepo;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        if (stationRepo.count() > 0) {
            return;
        }

        Map<String, Station> stations = new HashMap<>();
        for (String line : STATIONS) {
            String[] f = line.split("\\|");
            stations.put(f[0], stationRepo.save(
                    Station.builder().code(f[0]).name(f[1]).build()));
        }

        int trains = 0;
        for (String line : TEMPLATES) {
            String[] f = line.split("\\|");
            Corridor c = CORRIDORS.get(Integer.parseInt(f[0]));
            createTrain(c, f, false, stations);
            createTrain(c, f, true, stations);
            trains += 2;
        }

        System.out.println("Seed data created: " + stations.size()
                + " stations, " + trains + " trains.");
    }

    private void createTrain(Corridor c, String[] f, boolean reverse,
                             Map<String, Station> stations) {
        List<String> codes = Arrays.asList(c.codes());
        int from = codes.indexOf(f[3]);
        int to = codes.indexOf(f[4]);
        if (from < 0 || to < 0 || from >= to) {
            throw new IllegalStateException("Bad train template: " + f[2]);
        }

        int startMin = toMinutes(reverse ? f[6] : f[5]);
        int speed = Integer.parseInt(f[7]);
        boolean fast = Boolean.parseBoolean(f[8]);

        List<Integer> route = new ArrayList<>();
        if (!reverse) {
            for (int i = from; i <= to; i++) route.add(i);
        } else {
            for (int i = to; i >= from; i--) route.add(i);
        }

        List<Integer> kept = new ArrayList<>();
        for (int p = 0; p < route.size(); p++) {
            if (!fast || p == 0 || p == route.size() - 1 || p % 2 == 1) {
                kept.add(route.get(p));
            }
        }

        int originKm = c.kms()[kept.get(0)];
        List<TrainStop> stops = new ArrayList<>();
        int halts = 0;
        for (int p = 0; p < kept.size(); p++) {
            int idx = kept.get(p);
            int km = Math.abs(c.kms()[idx] - originKm);
            int arrAbs = startMin + (int) Math.round(km * 60.0 / speed) + halts * HALT_MIN;
            boolean first = p == 0;
            boolean last = p == kept.size() - 1;

            stops.add(TrainStop.builder()
                    .station(stations.get(c.codes()[idx]))
                    .stopOrder(p + 1)
                    .arrivalTime(first ? null : toTime(arrAbs))
                    .departureTime(last ? null : toTime(first ? startMin : arrAbs + HALT_MIN))
                    .dayOffset(first ? 0 : arrAbs / 1440)
                    .distanceKm(km)
                    .build());
            if (!first && !last) halts++;
        }

        TrainStop firstStop = stops.get(0);
        TrainStop lastStop = stops.get(stops.size() - 1);

        Train train = trainRepo.save(Train.builder()
                .number(reverse ? String.valueOf(Integer.parseInt(f[1]) + 1) : f[1])
                .name(f[2])
                .source(firstStop.getStation())
                .destination(lastStop.getStation())
                .departureTime(firstStop.getDepartureTime())
                .arrivalTime(lastStop.getArrivalTime())
                .build());

        stops.forEach(s -> s.setTrain(train));
        stopRepo.saveAll(stops);

        LocalDate today = LocalDate.now();
        List<TrainRun> runs = new ArrayList<>();
        for (int d = 0; d < DAYS; d++) {
            runs.add(TrainRun.builder().train(train).runDate(today.plusDays(d)).build());
        }
        runs = runRepo.saveAll(runs);

        int totalKm = lastStop.getDistanceKm();
        Map<ClassType, BigDecimal> fares = new EnumMap<>(ClassType.class);
        for (ClassType ct : ClassType.values()) {
            fares.put(ct, RATE_PER_KM.get(ct)
                    .multiply(BigDecimal.valueOf(totalKm))
                    .setScale(0, RoundingMode.HALF_UP)
                    .max(new BigDecimal("100")));
        }

        // Create all seats with coach and berth information in one JDBC batch.
        List<Object[]> rows = new ArrayList<>();
        for (TrainRun r : runs) {
            for (CoachSpec cs : COACHES) {
                for (int n = 1; n <= cs.berths(); n++) {
                    rows.add(new Object[]{
                            r.getId(), cs.classType().name(), cs.name(), n,
                            berthFor(cs.classType(), n), fares.get(cs.classType()), "AVAILABLE"
                    });
                }
            }
        }

        jdbc.batchUpdate(
                "insert into seats (run_id, class_type, coach, seat_no, berth, fare, status) "
                        + "values (?,?,?,?,?,?,?)",
                rows);
    }

    private static int toMinutes(String hhmm) {
        LocalTime t = LocalTime.parse(hhmm);
        return t.getHour() * 60 + t.getMinute();
    }

    private static LocalTime toTime(int minutes) {
        int m = minutes % 1440;
        return LocalTime.of(m / 60, m % 60);
    }
}
