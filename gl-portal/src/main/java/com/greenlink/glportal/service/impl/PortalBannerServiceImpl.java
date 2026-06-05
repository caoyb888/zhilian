package com.greenlink.glportal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.domain.PortalBanner;
import com.greenlink.glportal.dto.request.BannerPageRequest;
import com.greenlink.glportal.dto.request.CreateBannerRequest;
import com.greenlink.glportal.dto.request.UpdateBannerRequest;
import com.greenlink.glportal.dto.response.BannerVO;
import com.greenlink.glportal.repository.PortalBannerMapper;
import com.greenlink.glportal.service.PortalBannerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortalBannerServiceImpl implements PortalBannerService {

    private final PortalBannerMapper bannerMapper;

    @Override
    public List<BannerVO> listActive() {
        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<PortalBanner> wrapper = new LambdaQueryWrapper<PortalBanner>()
                .eq(PortalBanner::getIsDeleted, 0)
                .eq(PortalBanner::getIsActive, 1)
                .and(w -> w
                        .isNull(PortalBanner::getStartDate)
                        .or().le(PortalBanner::getStartDate, today))
                .and(w -> w
                        .isNull(PortalBanner::getEndDate)
                        .or().ge(PortalBanner::getEndDate, today))
                .orderByAsc(PortalBanner::getSortOrder)
                .orderByDesc(PortalBanner::getCreatedAt);
        return bannerMapper.selectList(wrapper).stream().map(this::toVO).toList();
    }

    @Override
    public Page<BannerVO> pageAdmin(BannerPageRequest request) {
        LambdaQueryWrapper<PortalBanner> wrapper = new LambdaQueryWrapper<PortalBanner>()
                .eq(PortalBanner::getIsDeleted, 0)
                .eq(request.getIsActive() != null, PortalBanner::getIsActive, request.getIsActive())
                .orderByAsc(PortalBanner::getSortOrder)
                .orderByDesc(PortalBanner::getCreatedAt);
        Page<PortalBanner> dbPage = bannerMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);
        Page<BannerVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    public BannerVO getById(Long id) {
        PortalBanner banner = requireBanner(id);
        return toVO(banner);
    }

    @Override
    @Transactional
    public BannerVO create(CreateBannerRequest request) {
        PortalBanner banner = new PortalBanner();
        banner.setTitle(request.getTitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setLinkUrl(request.getLinkUrl());
        banner.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        banner.setIsActive(request.getIsActive() != null ? request.getIsActive() : 1);
        banner.setStartDate(request.getStartDate());
        banner.setEndDate(request.getEndDate());
        banner.setIsDeleted(0);
        bannerMapper.insert(banner);
        log.info("轮播图已创建 id={} title={}", banner.getId(), banner.getTitle());
        return toVO(banner);
    }

    @Override
    @Transactional
    public BannerVO update(Long id, UpdateBannerRequest request) {
        PortalBanner banner = requireBanner(id);
        if (request.getTitle() != null) banner.setTitle(request.getTitle());
        if (request.getImageUrl() != null) banner.setImageUrl(request.getImageUrl());
        if (request.getLinkUrl() != null) banner.setLinkUrl(request.getLinkUrl().isEmpty() ? null : request.getLinkUrl());
        if (request.getSortOrder() != null) banner.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) banner.setIsActive(request.getIsActive());
        if (request.getStartDate() != null) banner.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) banner.setEndDate(request.getEndDate());
        bannerMapper.updateById(banner);
        log.info("轮播图已更新 id={}", id);
        return toVO(banner);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        requireBanner(id);
        UpdateWrapper<PortalBanner> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", id).set("is_deleted", 1);
        bannerMapper.update(null, wrapper);
        log.info("轮播图已软删除 id={}", id);
    }

    @Override
    @Transactional
    public void updateActive(Long id, Integer isActive) {
        requireBanner(id);
        UpdateWrapper<PortalBanner> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", id).set("is_active", isActive);
        bannerMapper.update(null, wrapper);
        log.info("轮播图启用状态已更新 id={} isActive={}", id, isActive);
    }

    // ─── 内部辅助 ─────────────────────────────────────────────────────────────

    private PortalBanner requireBanner(Long id) {
        PortalBanner banner = bannerMapper.selectOne(
                new LambdaQueryWrapper<PortalBanner>()
                        .eq(PortalBanner::getId, id)
                        .eq(PortalBanner::getIsDeleted, 0));
        if (banner == null) {
            throw new BizException(ResultCode.BANNER_NOT_FOUND);
        }
        return banner;
    }

    private BannerVO toVO(PortalBanner banner) {
        BannerVO vo = new BannerVO();
        vo.setId(banner.getId());
        vo.setTitle(banner.getTitle());
        vo.setImageUrl(banner.getImageUrl());
        vo.setLinkUrl(banner.getLinkUrl());
        vo.setSortOrder(banner.getSortOrder());
        vo.setIsActive(banner.getIsActive());
        vo.setStartDate(banner.getStartDate());
        vo.setEndDate(banner.getEndDate());
        vo.setCreatedAt(banner.getCreatedAt());
        vo.setUpdatedAt(banner.getUpdatedAt());
        return vo;
    }
}
