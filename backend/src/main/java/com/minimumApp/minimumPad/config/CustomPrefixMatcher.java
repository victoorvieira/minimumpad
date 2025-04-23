package com.minimumApp.minimumPad.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.AntPathMatcher;

import java.util.List;

public class CustomPrefixMatcher implements RequestMatcher {

    private static final AntPathMatcher pathMatcher = new AntPathMatcher();

    private final List<String> publicPatterns = List.of(
            "/api/public/**",
            "/api/publicnotes/**"
    );

    @Override
    public boolean matches(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Remove prefix tipo /minimumPad-0.0.1-SNAPSHOT
        String contextPath = request.getContextPath();
        if (path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        // Testa contra padrões conhecidos
        for (String pattern : publicPatterns) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }

        return false;
    }
}
