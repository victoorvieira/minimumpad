package com.minimumApp.minimumPad.config;

import com.minimumApp.minimumPad.model.User;
import com.minimumApp.minimumPad.repository.UserRepository;
import com.minimumApp.minimumPad.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String username = oauth2User.getAttribute("name"); // nome do Google

        // Verifica se o usuário já existe no banco; se não, cria e salva
        userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setEmail(email);
            user.setName(username);
            return userRepository.save(user);
        });

        // Gera o JWT
        String token = jwtService.generateToken(username, email);

        // Redireciona para o frontend com o token na URL
        // Define o redirecionamento a partir do ambiente (dev ou prod)
//  PROD      String redirectUrl = UriComponentsBuilder.fromUriString("https://minimumpad.com/note.html")
//                .queryParam("token", token)
//                .build()
//                .toUriString();

        String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:5500/note-dev.html")
                .queryParam("token", token)
                .build()
                .toUriString();


        response.sendRedirect(redirectUrl);
    }
}
