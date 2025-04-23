package com.minimumApp.minimumPad.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.SerializationUtils;

import java.util.Base64;

@Component
public class HttpCookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTH_REQUEST_COOKIE_NAME = "oauth2_auth_request";
    private static final int cookieExpireSeconds = 180;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return getCookie(request, OAUTH2_AUTH_REQUEST_COOKIE_NAME)
                .map(this::deserialize)
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            deleteCookies(request, response, OAUTH2_AUTH_REQUEST_COOKIE_NAME);
            return;
        }

        addCookie(response, OAUTH2_AUTH_REQUEST_COOKIE_NAME, serialize(authorizationRequest), cookieExpireSeconds);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        return null;
    }


    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request) {
        return loadAuthorizationRequest(request);
    }

    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        deleteCookies(request, response, OAUTH2_AUTH_REQUEST_COOKIE_NAME);
    }

    private String serialize(OAuth2AuthorizationRequest obj) {
        return Base64.getUrlEncoder().encodeToString(SerializationUtils.serialize(obj));
    }

    private OAuth2AuthorizationRequest deserialize(Cookie cookie) {
        return (OAuth2AuthorizationRequest) SerializationUtils.deserialize(Base64.getUrlDecoder().decode(cookie.getValue()));
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }

    private void deleteCookies(HttpServletRequest request, HttpServletResponse response, String... cookies) {
        for (String cookieName : cookies) {
            Cookie cookie = new Cookie(cookieName, null);
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(0);
            response.addCookie(cookie);
        }
    }

    private java.util.Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return java.util.Optional.empty();
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(name)) {
                return java.util.Optional.of(cookie);
            }
        }
        return java.util.Optional.empty();
    }
}
