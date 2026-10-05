package com.rgctraining.chatbot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Só é necessário se o frontend rodar em outra origem (Live Server, npm, etc.).
 * Se o front estiver em src/main/resources/static, pode ignorar este arquivo.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5500", "http://127.0.0.1:5500",
                        "http://localhost:3000", "http://localhost:8081")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }
}
