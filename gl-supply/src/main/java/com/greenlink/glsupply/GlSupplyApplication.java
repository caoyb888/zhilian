package com.greenlink.glsupply;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.greenlink")
@EnableDiscoveryClient
@EnableFeignClients
@EnableScheduling
public class GlSupplyApplication {
    public static void main(String[] args) {
        SpringApplication.run(GlSupplyApplication.class, args);
    }
}
