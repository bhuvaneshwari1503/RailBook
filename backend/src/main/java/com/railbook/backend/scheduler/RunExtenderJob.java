package com.railbook.backend.scheduler;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class RunExtenderJob implements CommandLineRunner {

    private static final Logger log =
            LoggerFactory.getLogger(RunExtenderJob.class);

    private static final int DAYS = 7;

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;

    public RunExtenderJob(
            JdbcTemplate jdbc,
            PlatformTransactionManager txManager) {
        this.jdbc = jdbc;
        this.tx = new TransactionTemplate(txManager);
    }

    @Override
    public void run(String... args) {
        extend();
    }

    @Scheduled(cron = "0 5 0 * * *")
    public void extend() {
        LocalDate today = LocalDate.now();
        int created = 0;

        for (int d = 0; d < DAYS; d++) {
            LocalDate date = today.plusDays(d);

            List<Map<String, Object>> missing = jdbc.queryForList("""
                    select t.id as train_id,
                           (select r.id from train_runs r
                            where r.train_id = t.id
                            order by r.run_date desc limit 1) as template_id
                    from trains t
                    where not exists (
                        select 1 from train_runs r
                        where r.train_id = t.id and r.run_date = ?
                    )
                    """, date);

            for (Map<String, Object> row : missing) {
                if (row.get("template_id") == null) {
                    continue;
                }

                Long trainId =
                        ((Number) row.get("train_id")).longValue();

                Long templateId =
                        ((Number) row.get("template_id")).longValue();

                tx.executeWithoutResult(status -> {
                    Long runId = jdbc.queryForObject(
                            "insert into train_runs (train_id, run_date) "
                                    + "values (?, ?) returning id",
                            Long.class, trainId, date);

                    jdbc.update(
                            "insert into seats "
                                    + "(run_id, class_type, coach, seat_no, berth, fare, status) "
                                    + "select ?, class_type, coach, seat_no, berth, fare, 'AVAILABLE' "
                                    + "from seats where run_id = ?",
                            runId, templateId);
                });

                created++;
            }
        }

        if (created > 0) {
            log.info("RunExtender: created {} train runs", created);
        }
    }
}
