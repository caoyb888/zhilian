package com.greenlink.glauth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.server.servlet.OAuth2AuthorizationServerAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.server.servlet.OAuth2AuthorizationServerJwtAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(exclude = {
        OAuth2AuthorizationServerAutoConfiguration.class,
        OAuth2AuthorizationServerJwtAutoConfiguration.class
})
@EnableDiscoveryClient
@EnableFeignClients
@EnableAsync
public class GlAuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(GlAuthApplication.class, args);
    }
}
