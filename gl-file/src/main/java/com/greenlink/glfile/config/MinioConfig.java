package com.greenlink.glfile.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MinioConfig {

    private final MinioProperties props;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();
        initBuckets(client);
        return client;
    }

    private void initBuckets(MinioClient client) {
        ensureBucket(client, props.getBucketName(), false);
        ensureBucket(client, props.getPublicBucketName(), true);
    }

    private void ensureBucket(MinioClient client, String bucket, boolean isPublic) {
        try {
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("MinIO bucket created: {}", bucket);
            }
            if (isPublic) {
                String policy = buildPublicReadPolicy(bucket);
                client.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(bucket).config(policy).build());
            }
        } catch (Exception e) {
            log.warn("MinIO bucket init failed for bucket={}: {}", bucket, e.getMessage());
        }
    }

    private String buildPublicReadPolicy(String bucket) {
        return String.format("""
                {
                  "Version":"2012-10-17",
                  "Statement":[{
                    "Effect":"Allow",
                    "Principal":"*",
                    "Action":["s3:GetObject"],
                    "Resource":["arn:aws:s3:::%s/*"]
                  }]
                }""", bucket);
    }
}
