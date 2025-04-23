package com.minimumApp.minimumPad.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        CustomOAuth2User customOAuth2User = new CustomOAuth2User(oAuth2User);

        // Registra usuário se ainda não existir
        String email = customOAuth2User.getEmail();
        userService.processOAuthPostLogin(email);

        return customOAuth2User;
    }
}
