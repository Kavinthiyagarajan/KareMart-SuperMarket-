package com.example.supermarket.dto;

import com.example.supermarket.model.Role;

public class AuthResponse {
    private String token;
    private String username;
    private Role role;

    public AuthResponse(String token, String username, Role role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public Role getRole() { return role; }
}
