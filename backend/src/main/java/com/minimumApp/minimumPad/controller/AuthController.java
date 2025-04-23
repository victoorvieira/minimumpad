package com.minimumApp.minimumPad.controller;


import com.minimumApp.minimumPad.service.JwtService;
import com.minimumApp.minimumPad.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @GetMapping("/auth")
    public String authenticate(Authentication authentication) {
        // Assumindo que o usuário OAuth2 (Google, por exemplo) possui um "username" e um "email"
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        // Recuperando o nome de usuário e o email do OAuth2
        String username = oauth2User.getName();
        String email = oauth2User.getAttribute("email");

        // Gerando o JWT com o username e o email
        String token = jwtService.generateToken(username, email);

        return "Bearer " + token; // Retorna o token JWT gerado
    }
}
