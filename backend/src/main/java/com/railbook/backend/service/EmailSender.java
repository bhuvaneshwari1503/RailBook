package com.railbook.backend.service;

import com.railbook.backend.service.NotificationService.BookingEvent;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;

@Component
public class EmailSender {

    private static final Logger log =
            LoggerFactory.getLogger(EmailSender.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;

    public EmailSender(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${app.mail.from:RailBook <no-reply@railbook.com>}") String from
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingEvent(BookingEvent e) {

        JavaMailSender sender = mailSenderProvider.getIfAvailable();

        if (!enabled || sender == null) {
            log.info("Email skipped (mail disabled or not configured) for PNR {}", e.pnr());
            return;
        }

        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(msg, "UTF-8");

            helper.setFrom(from);
            helper.setTo(e.toEmail());
            helper.setSubject(subject(e));
            helper.setText(html(e), true);

            sender.send(msg);

            log.info("Email sent: {} for PNR {}", e.type(), e.pnr());

        } catch (Exception ex) {
            // Email failure must never affect the booking.
            log.warn("Could not send {} email for PNR {}: {}",
                    e.type(), e.pnr(), ex.getMessage());
        }
    }

    private String subject(BookingEvent e) {
        return switch (e.type()) {
            case CONFIRMED ->
                    "Booking confirmed - PNR " + e.pnr();
            case PROMOTED ->
                    "Your waitlisted ticket is confirmed - PNR " + e.pnr();
            case WAITLISTED ->
                    "You are on the waitlist (WL/" + e.waitlistPosition()
                            + ") - PNR " + e.pnr();
            case CANCELLED ->
                    "Booking cancelled - PNR " + e.pnr();
        };
    }

    private String html(BookingEvent e) {

        String headline = switch (e.type()) {
            case CONFIRMED -> "Your ticket is confirmed";
            case PROMOTED -> "Good news! Your ticket is confirmed";
            case WAITLISTED -> "You are on the waitlist: WL/" + e.waitlistPosition();
            case CANCELLED -> "Your booking is cancelled";
        };

        boolean hasRefund = e.refund() != null
                && e.refund().compareTo(BigDecimal.ZERO) > 0;

        String message = switch (e.type()) {
            case CONFIRMED ->
                    "Thank you for booking with RailBook. Have a safe journey!";
            case PROMOTED ->
                    "A berth became free and your waitlisted ticket is now confirmed. "
                            + "The fare of Rs " + e.totalFare() + " has been charged (simulated).";
            case WAITLISTED ->
                    "Berths will be allotted automatically if seats become free, in the order "
                            + "people joined. Nothing has been charged yet.";
            case CANCELLED -> hasRefund
                    ? "A refund of Rs " + e.refund()
                            + " will be credited to your original payment method."
                    : "No amount is due for refund on this booking.";
        };

        String color = switch (e.type()) {
            case CONFIRMED, PROMOTED -> "#16a34a";
            case WAITLISTED -> "#d97706";
            case CANCELLED -> "#dc2626";
        };

        StringBuilder rows = new StringBuilder();

        for (String p : e.passengers()) {
            rows.append("<li>")
                    .append(HtmlUtils.htmlEscape(p))
                    .append("</li>");
        }

        return """
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
                  <div style="background:#1d4ed8;color:#fff;padding:16px 20px;font-size:20px;font-weight:bold">RailBook</div>
                  <div style="padding:20px">
                    <p>Hi %s,</p>
                    <h2 style="color:%s;margin:8px 0">%s</h2>
                    <p>%s</p>
                    <table style="width:100%%;font-size:14px;border-collapse:collapse;margin-top:12px">
                      <tr><td style="color:#64748b;padding:4px 0">PNR</td><td><b>%s</b></td></tr>
                      <tr><td style="color:#64748b;padding:4px 0">Train</td><td>%s (#%s)</td></tr>
                      <tr><td style="color:#64748b;padding:4px 0">Journey</td><td>%s to %s</td></tr>
                      <tr><td style="color:#64748b;padding:4px 0">Departure</td><td>%s %s</td></tr>
                      <tr><td style="color:#64748b;padding:4px 0">Class</td><td>%s</td></tr>
                      <tr><td style="color:#64748b;padding:4px 0">Fare</td><td>Rs %s</td></tr>
                    </table>
                    <p style="margin-bottom:4px"><b>Passengers</b></p>
                    <ul style="margin-top:0">%s</ul>
                    <p style="font-size:12px;color:#94a3b8;margin-top:24px">
                      This is a demo project email. Not affiliated with Indian Railways or IRCTC.</p>
                  </div>
                </div>
                """.formatted(
                HtmlUtils.htmlEscape(e.userName()),
                color,
                headline,
                message,
                e.pnr(),
                HtmlUtils.htmlEscape(e.trainName()),
                e.trainNumber(),
                e.from(),
                e.to(),
                e.date(),
                e.departure(),
                e.classType(),
                e.totalFare(),
                rows
        );
    }
}