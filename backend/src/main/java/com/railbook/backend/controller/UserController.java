
package com.railbook.backend.controller;

import com.railbook.backend.dto.*;
import com.railbook.backend.entity.SavedPassenger;
import com.railbook.backend.entity.User;
import com.railbook.backend.repository.SavedPassengerRepository;
import com.railbook.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final int MAX_SAVED = 10;

    private final UserRepository userRepo;
    private final SavedPassengerRepository savedRepo;
    private final PasswordEncoder encoder;

    public UserController(
            UserRepository userRepo,
            SavedPassengerRepository savedRepo,
            PasswordEncoder encoder
    ) {
        this.userRepo = userRepo;
        this.savedRepo = savedRepo;
        this.encoder = encoder;
    }

    private User current(Authentication authentication) {
        return userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));
    }

    private ProfileResponse toProfile(User user) {
        return new ProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name()
        );
    }

    private SavedPassengerResponse toDto(SavedPassenger passenger) {
        return new SavedPassengerResponse(
                passenger.getId(),
                passenger.getName(),
                passenger.getAge(),
                passenger.getGender()
        );
    }

    @GetMapping("/me")
    public ProfileResponse me(Authentication authentication) {
        return toProfile(current(authentication));
    }

    @PutMapping("/me")
    public ProfileResponse update(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        User user = current(authentication);
        user.setName(request.name().trim());
        user.setPhone(
                request.phone() == null || request.phone().isBlank()
                        ? null : request.phone()
        );
        return toProfile(userRepo.save(user));
    }

    @PutMapping("/me/password")
    public Map<String, String> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        User user = current(authentication);

        if (!encoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current password is incorrect"
            );
        }

        user.setPasswordHash(encoder.encode(request.newPassword()));
        userRepo.save(user);

        return Map.of("message", "Password changed");
    }

    @GetMapping("/me/passengers")
    public List<SavedPassengerResponse> passengers(
            Authentication authentication
    ) {
        return savedRepo.findByUserEmailOrderByIdDesc(
                authentication.getName()
        ).stream().map(this::toDto).toList();
    }

    @PostMapping("/me/passengers")
    public SavedPassengerResponse addPassenger(
            Authentication authentication,
            @Valid @RequestBody SavedPassengerRequest request
    ) {
        if (savedRepo.countByUserEmail(authentication.getName()) >= MAX_SAVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You can save at most " + MAX_SAVED + " passengers"
            );
        }

        SavedPassenger passenger = SavedPassenger.builder()
                .user(current(authentication))
                .name(request.name().trim())
                .age(request.age())
                .gender(request.gender())
                .build();

        return toDto(savedRepo.save(passenger));
    }

    @PutMapping("/me/passengers/{id}")
    public SavedPassengerResponse editPassenger(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SavedPassengerRequest request
    ) {
        SavedPassenger passenger = savedRepo.findByIdAndUserEmail(
                id, authentication.getName()
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Passenger not found"
        ));

        passenger.setName(request.name().trim());
        passenger.setAge(request.age());
        passenger.setGender(request.gender());

        return toDto(savedRepo.save(passenger));
    }

    @DeleteMapping("/me/passengers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePassenger(
            Authentication authentication,
            @PathVariable Long id
    ) {
        SavedPassenger passenger = savedRepo.findByIdAndUserEmail(
                id, authentication.getName()
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Passenger not found"
        ));

        savedRepo.delete(passenger);
    }
}
