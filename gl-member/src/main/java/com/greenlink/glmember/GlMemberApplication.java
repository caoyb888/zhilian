package com.greenlink.glmember;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = "com.greenlink")
@EnableDiscoveryClient
@EnableFeignClients
public class GlMemberApplication {
    public static void main(String[] args) {
        SpringApplication.run(GlMemberApplication.class, args);
    }
}
