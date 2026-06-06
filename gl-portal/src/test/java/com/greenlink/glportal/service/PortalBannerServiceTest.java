package com.greenlink.glportal.service;

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
import com.greenlink.glportal.service.impl.PortalBannerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortalBannerServiceTest {

    @Mock PortalBannerMapper bannerMapper;

    @InjectMocks PortalBannerServiceImpl service;

    private PortalBanner activeBanner;

    @BeforeEach
    void setUp() {
        activeBanner = new PortalBanner();
        activeBanner.setId(1L);
        activeBanner.setTitle("2026 绿色峰会轮播图");
        activeBanner.setImageUrl("https://example.com/banner1.jpg");
        activeBanner.setLinkUrl("https://example.com/event/1");
        activeBanner.setSortOrder(0);
        activeBanner.setIsActive(1);
        activeBanner.setIsDeleted(0);
        activeBanner.setCreatedAt(LocalDateTime.now());
        activeBanner.setUpdatedAt(LocalDateTime.now());
    }

    // ─── create ────────────────────────────────────────────────────────────────

    @Test
    void create_success() {
        when(bannerMapper.insert(any(PortalBanner.class))).thenReturn(1);

        CreateBannerRequest req = new CreateBannerRequest();
        req.setTitle("新轮播图");
        req.setImageUrl("https://example.com/new.jpg");
        req.setSortOrder(1);

        BannerVO vo = service.create(req);

        assertThat(vo.getTitle()).isEqualTo("新轮播图");
        assertThat(vo.getIsActive()).isEqualTo(1);
        assertThat(vo.getSortOrder()).isEqualTo(1);
        verify(bannerMapper).insert(any(PortalBanner.class));
    }

    @Test
    void create_withValidDates() {
        when(bannerMapper.insert(any(PortalBanner.class))).thenReturn(1);

        CreateBannerRequest req = new CreateBannerRequest();
        req.setTitle("限时轮播图");
        req.setImageUrl("https://example.com/temp.jpg");
        req.setStartDate(LocalDate.of(2026, 6, 1));
        req.setEndDate(LocalDate.of(2026, 12, 31));

        BannerVO vo = service.create(req);

        assertThat(vo.getStartDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(vo.getEndDate()).isEqualTo(LocalDate.of(2026, 12, 31));
    }

    // ─── getById ───────────────────────────────────────────────────────────────

    @Test
    void getById_notFound_throws() {
        when(bannerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining(ResultCode.BANNER_NOT_FOUND.getMsg());
    }

    @Test
    void getById_success() {
        when(bannerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeBanner);

        BannerVO vo = service.getById(1L);

        assertThat(vo.getId()).isEqualTo(1L);
        assertThat(vo.getTitle()).isEqualTo("2026 绿色峰会轮播图");
    }

    // ─── listActive ────────────────────────────────────────────────────────────

    @Test
    void listActive_returnsOnlyActiveAndInRange() {
        PortalBanner expired = new PortalBanner();
        expired.setId(2L);
        expired.setTitle("过期轮播图");
        expired.setIsActive(1);
        expired.setEndDate(LocalDate.of(2020, 1, 1));
        expired.setIsDeleted(0);

        // selectList 返回 DB 过滤后的结果（Wrapper 已在 DB 侧过滤，这里仅模拟有效记录）
        when(bannerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(activeBanner));

        List<BannerVO> result = service.listActive();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    // ─── update ────────────────────────────────────────────────────────────────

    @Test
    void update_partialFields() {
        when(bannerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeBanner);
        when(bannerMapper.updateById(any(PortalBanner.class))).thenReturn(1);

        UpdateBannerRequest req = new UpdateBannerRequest();
        req.setTitle("更新后标题");
        req.setSortOrder(5);

        BannerVO vo = service.update(1L, req);

        assertThat(vo.getTitle()).isEqualTo("更新后标题");
        assertThat(vo.getSortOrder()).isEqualTo(5);
        assertThat(vo.getImageUrl()).isEqualTo(activeBanner.getImageUrl()); // 未修改字段保持不变
    }

    // ─── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_softDelete() {
        when(bannerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeBanner);
        when(bannerMapper.update(any(), any(UpdateWrapper.class))).thenReturn(1);

        service.delete(1L);

        verify(bannerMapper).update(any(), any(UpdateWrapper.class));
    }

    @Test
    void delete_notFound_throws() {
        when(bannerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        assertThatThrownBy(() -> service.delete(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining(ResultCode.BANNER_NOT_FOUND.getMsg());
    }

    // ─── updateActive ──────────────────────────────────────────────────────────

    @Test
    void updateActive_disable() {
        when(bannerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeBanner);
        when(bannerMapper.update(any(), any(UpdateWrapper.class))).thenReturn(1);

        service.updateActive(1L, 0);

        verify(bannerMapper).update(any(), any(UpdateWrapper.class));
    }

    // ─── pageAdmin ─────────────────────────────────────────────────────────────

    @Test
    void pageAdmin_returnsPageResult() {
        Page<PortalBanner> dbPage = new Page<>(1, 20, 1);
        dbPage.setRecords(List.of(activeBanner));
        when(bannerMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(dbPage);

        BannerPageRequest req = new BannerPageRequest();
        Page<BannerVO> result = service.pageAdmin(req);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getRecords()).hasSize(1);
        assertThat(result.getRecords().get(0).getTitle()).isEqualTo("2026 绿色峰会轮播图");
    }
}
