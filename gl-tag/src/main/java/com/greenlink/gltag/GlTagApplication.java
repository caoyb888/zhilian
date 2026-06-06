package com.greenlink.gltag;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.greenlink.gltag.repository")
public class GlTagApplication {
    public static void main(String[] args) {
        SpringApplication.run(GlTagApplication.class, args);
    }
}
