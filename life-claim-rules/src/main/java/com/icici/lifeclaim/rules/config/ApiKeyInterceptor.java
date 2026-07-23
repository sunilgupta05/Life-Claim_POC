package com.icici.lifeclaim.rules.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Requires a shared-secret header on every intercepted request. This service has no
 * user-facing auth of its own and is only ever called server-to-server by the Node
 * backend, so a static API key (matched on both sides via RULES_ENGINE_API_KEY) is
 * enough to stop it being reachable by anything else that can hit this port.
 */
@Component
public class ApiKeyInterceptor implements HandlerInterceptor {

    private static final String API_KEY_HEADER = "X-Internal-Api-Key";

    private final String expectedApiKey;

    public ApiKeyInterceptor(@Value("${rules.engine.api-key}") String expectedApiKey) {
        this.expectedApiKey = expectedApiKey;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String providedKey = request.getHeader(API_KEY_HEADER);
        if (expectedApiKey != null && expectedApiKey.equals(providedKey)) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Missing or invalid " + API_KEY_HEADER + " header.\"}");
        return false;
    }
}
