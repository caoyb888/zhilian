package com.greenlink.glmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.greenlink.glmatch.domain.MatchFavorite;
import com.greenlink.glmatch.repository.MatchFavoriteMapper;
import com.greenlink.glmatch.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final MatchFavoriteMapper favoriteMapper;

    @Override
    @Transactional
    public void add(Long accountId, String bizType, Long bizId) {
        boolean exists = check(accountId, bizType, bizId);
        if (exists) {
            return;
        }
        MatchFavorite fav = new MatchFavorite();
        fav.setAccountId(accountId);
        fav.setBizType(bizType);
        fav.setBizId(bizId);
        favoriteMapper.insert(fav);
    }

    @Override
    @Transactional
    public void remove(Long accountId, String bizType, Long bizId) {
        QueryWrapper<MatchFavorite> qw = new QueryWrapper<>();
        qw.eq("account_id", accountId)
          .eq("biz_type", bizType)
          .eq("biz_id", bizId);
        favoriteMapper.delete(qw);
    }

    @Override
    public boolean check(Long accountId, String bizType, Long bizId) {
        QueryWrapper<MatchFavorite> qw = new QueryWrapper<>();
        qw.eq("account_id", accountId)
          .eq("biz_type", bizType)
          .eq("biz_id", bizId);
        return favoriteMapper.selectCount(qw) > 0;
    }
}
