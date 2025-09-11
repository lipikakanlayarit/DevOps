package com.example.devops.web;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

record LoginReq(String username, String password) {}
record LoginRes(Map<String, String> user, String token) {}


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public LoginRes login(@RequestBody LoginReq req){
        // Mock: map username to role
        String role = "USER";
        if ("ADMIN".equalsIgnoreCase(req.username())) role = "ADMIN";
        if ("ORGANIZER".equalsIgnoreCase(req.username())) role = "ORGANIZER";
        var user = Map.of("id","1","username",req.username(),"role",role);
        return new LoginRes(user, "fake-jwt-token");
    }

    @GetMapping("/me")
    public Map<String,Object> me(){
        return Map.of("id","1","username","demo","role","USER");
    }

    @PostMapping("/logout")
    public void logout(){}
}