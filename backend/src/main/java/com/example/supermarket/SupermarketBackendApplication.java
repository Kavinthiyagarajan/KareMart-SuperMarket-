package com.example.supermarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SupermarketBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(SupermarketBackendApplication.class, args);
    }
}
