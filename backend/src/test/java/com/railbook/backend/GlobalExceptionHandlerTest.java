package com.railbook.backend;

import com.railbook.backend.exception.GlobalExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @RestController
    static class DemoController {
        record Body(@NotBlank String name) {}

        @GetMapping("/demo/conflict")
        String conflict() {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat 4 is no longer available");
        }

        @GetMapping("/demo/crash")
        String crash() {
            throw new IllegalStateException("secret internal detail");
        }

        @PostMapping("/demo/validate")
        String validate(@Valid @RequestBody Body body) {
            return "ok";
        }
    }

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new DemoController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void our_own_status_exceptions_keep_their_status_and_message() throws Exception {
        mvc.perform(get("/demo/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Seat 4 is no longer available"))
                .andExpect(jsonPath("$.path").value("/demo/conflict"));
    }

    @Test
    void validation_errors_name_the_bad_field() throws Exception {
        mvc.perform(post("/demo/validate").contentType("application/json").content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("name")));
    }

    @Test
    void broken_json_returns_400() throws Exception {
        mvc.perform(post("/demo/validate").contentType("application/json").content("{oops"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unexpected_errors_return_500_without_leaking_details() throws Exception {
        mvc.perform(get("/demo/crash"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Something went wrong")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(containsString("secret"))));
    }
}
