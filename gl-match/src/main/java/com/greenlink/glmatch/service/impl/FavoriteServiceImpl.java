package com.greenlink.glmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.domain.MatchFavorite;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.response.FavoriteVO;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchFavoriteMapper;
import com.greenlink.glmatch.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final MatchFavoriteMapper favoriteMapper;
    private final SupplyClient supplyClient;

    @Override
    @Transactional
    public void add(Long accountId, String bizType, Long bizId) {
        if (check(accountId, bizType, bizId)) {
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

    @Override
    public PageResult<FavoriteVO> list(Long accountId, String bizType, int page, int size) {
        QueryWrapper<MatchFavorite> wrapper = new QueryWrapper<MatchFavorite>()
                .select("id", "account_id", "biz_type", "biz_id", "created_at")
                .eq("account_id", accountId)
                .eq("biz_type", bizType)
                .orderByDesc("created_at");

        IPage<MatchFavorite> dbPage = favoriteMapper.selectPage(new Page<>(page, size), wrapper);
        List<MatchFavorite> records = dbPage.getRecords();

        if (records.isEmpty()) {
            return PageResult.of(Collections.emptyList(), 0, page, size);
        }

        List<Long> bizIds = records.stream().map(MatchFavorite::getBizId).distinct().toList();
        Map<Long, SupplyBriefDTO> briefs = fetchBriefs(bizType, bizIds);

        List<FavoriteVO> vos = records.stream().map(fav -> {
            SupplyBriefDTO brief = briefs.get(fav.getBizId());
            return FavoriteVO.builder()
                    .favoriteId(fav.getId())
                    .bizType(fav.getBizType())
                    .bizId(fav.getBizId())
                    .title(brief != null ? brief.getTitle() : "")
                    .summary(brief != null ? brief.getSummary() : "")
                    .type(brief != null ? brief.getType() : "")
                    .createdAt(fav.getCreatedAt())
                    .build();
        }).toList();

        return PageResult.of(vos, dbPage.getTotal(), page, size);
    }

    @Override
    public List<Long> listIds(Long accountId, String bizType) {
        QueryWrapper<MatchFavorite> qw = new QueryWrapper<MatchFavorite>()
                .select("biz_id")
                .eq("account_id", accountId)
                .eq("biz_type", bizType);
        return favoriteMapper.selectList(qw).stream()
                .map(MatchFavorite::getBizId)
                .toList();
    }

    private Map<Long, SupplyBriefDTO> fetchBriefs(String bizType, List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) return Collections.emptyMap();
        try {
            Result<List<SupplyBriefDTO>> result = "RESOURCE".equals(bizType)
                    ? supplyClient.batchBriefResources(ids)
                    : supplyClient.batchBriefDemands(ids);
            if (result == null || result.getData() == null) return Collections.emptyMap();
            return result.getData().stream()
                    .collect(Collectors.toMap(SupplyBriefDTO::getId, b -> b));
        } catch (Exception e) {
            log.warn("批量获取 {} 详情失败", bizType, e);
            return Collections.emptyMap();
        }
    }
}
