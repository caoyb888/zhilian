package com.greenlink.glmatch.service;

import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.response.FavoriteVO;

public interface FavoriteService {

    void add(Long accountId, String bizType, Long bizId);

    void remove(Long accountId, String bizType, Long bizId);

    boolean check(Long accountId, String bizType, Long bizId);

    PageResult<FavoriteVO> list(Long accountId, String bizType, int page, int size);
}
