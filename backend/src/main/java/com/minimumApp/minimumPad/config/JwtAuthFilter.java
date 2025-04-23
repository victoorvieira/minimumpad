package com.minimumApp.minimumPad.config;

import com.minimumApp.minimumPad.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI(); // ex: /minimumPad-0.0.1-SNAPSHOT/api/publicnotes
        String filteredPath = uri.replaceFirst("^/[^/]+", ""); // remove o WAR prefix

        System.out.println("🔍 JwtAuthFilter - URI: " + uri);
        System.out.println("🔍 JwtAuthFilter - Filtered path: " + filteredPath);

        boolean skip = filteredPath.startsWith("/api/public/")
                || filteredPath.startsWith("/api/publicnotes")
                || filteredPath.startsWith("/oauth2/")
                || filteredPath.startsWith("/login")
                || filteredPath.startsWith("/error");

        System.out.println("✅ JwtAuthFilter - shouldNotFilter: " + skip);
        return skip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        final String email;

        try {
            email = jwtService.getEmailFromToken(token);
        } catch (Exception e) {
            System.out.println("❌ JwtAuthFilter - Token inválido");
            filterChain.doFilter(request, response);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
            if (jwtService.isTokenValid(token, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("✅ JwtAuthFilter - Usuário autenticado: " + email);
            }
        }

        filterChain.doFilter(request, response);
    }
}
