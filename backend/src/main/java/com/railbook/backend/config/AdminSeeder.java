package com.railbook.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.railbook.backend.entity.Role;
import com.railbook.backend.entity.User;
import com.railbook.backend.repository.UserRepository;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final String adminPassword;

    public AdminSeeder(
            UserRepository userRepo,
            PasswordEncoder encoder,
            @Value("${app.admin.password}") String adminPassword) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (userRepo.existsByEmail("admin@railbook.com")) return;

        userRepo.save(User.builder()
                .name("Admin")
                .email("admin@railbook.com")
                .passwordHash(encoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build());

        System.out.println("Admin created: admin@railbook.com");
    }
}