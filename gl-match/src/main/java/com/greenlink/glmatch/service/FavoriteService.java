package com.greenlink.glmatch.service;

public interface FavoriteService {

    void add(Long accountId, String bizType, Long bizId);

    void remove(Long accountId, String bizType, Long bizId);

    boolean check(Long accountId, String bizType, Long bizId);
}
