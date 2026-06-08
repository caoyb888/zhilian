package com.greenlink.glmatch.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.domain.MatchFavorite;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.response.FavoriteVO;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchFavoriteMapper;
import com.greenlink.glmatch.service.impl.FavoriteServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S5-09 单元测试：收藏/取消收藏接口（7 个核心场景）
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FavoriteServiceTest {

    @Mock private MatchFavoriteMapper favoriteMapper;
    @Mock private SupplyClient        supplyClient;

    @InjectMocks
    private FavoriteServiceImpl service;

    private static final Long ACCOUNT_ID = 10L;
    private static final Long BIZ_ID     = 100L;

    // ───── add ─────

    @Test
    @DisplayName("场景1：add - 未收藏时正常插入")
    void add_notExists_inserts() {
        when(favoriteMapper.selectCount(any(QueryWrapper.class))).thenReturn(0L);
        doReturn(1).when(favoriteMapper).insert(any(MatchFavorite.class));

        service.add(ACCOUNT_ID, "RESOURCE", BIZ_ID);

        verify(favoriteMapper).insert(any(MatchFavorite.class));
    }

    @Test
    @DisplayName("场景2：add - 已收藏时幂等跳过")
    void add_alreadyExists_skips() {
        when(favoriteMapper.selectCount(any(QueryWrapper.class))).thenReturn(1L);

        service.add(ACCOUNT_ID, "RESOURCE", BIZ_ID);

        verify(favoriteMapper, never()).insert(any(MatchFavorite.class));
    }

    // ───── remove ─────

    @Test
    @DisplayName("场景3：remove - 物理删除对应记录")
    void remove_deletesRecord() {
        when(favoriteMapper.delete(any(QueryWrapper.class))).thenReturn(1);

        service.remove(ACCOUNT_ID, "DEMAND", BIZ_ID);

        verify(favoriteMapper).delete(any(QueryWrapper.class));
    }

    // ───── check ─────

    @Test
    @DisplayName("场景4：check - 已收藏返回 true")
    void check_exists_returnsTrue() {
        when(favoriteMapper.selectCount(any(QueryWrapper.class))).thenReturn(1L);
        assertThat(service.check(ACCOUNT_ID, "RESOURCE", BIZ_ID)).isTrue();
    }

    @Test
    @DisplayName("场景5：check - 未收藏返回 false")
    void check_notExists_returnsFalse() {
        when(favoriteMapper.selectCount(any(QueryWrapper.class))).thenReturn(0L);
        assertThat(service.check(ACCOUNT_ID, "RESOURCE", BIZ_ID)).isFalse();
    }

    // ───── list ─────

    @Test
    @DisplayName("场景6：list - 有收藏数据时返回带 supply 信息的 VO")
    void list_withData_returnsEnrichedVO() {
        MatchFavorite fav = new MatchFavorite();
        fav.setId(1L);
        fav.setAccountId(ACCOUNT_ID);
        fav.setBizType("RESOURCE");
        fav.setBizId(BIZ_ID);
        fav.setCreatedAt(LocalDateTime.now());

        Page<MatchFavorite> dbPage = new Page<>(1, 20);
        dbPage.setRecords(List.of(fav));
        dbPage.setTotal(1);
        doReturn(dbPage).when(favoriteMapper).selectPage(any(), any());

        SupplyBriefDTO brief = new SupplyBriefDTO();
        brief.setId(BIZ_ID);
        brief.setTitle("测试资源");
        brief.setSummary("摘要");
        brief.setType("PRODUCT");
        when(supplyClient.batchBriefResources(anyList()))
                .thenReturn(Result.ok(List.of(brief)));

        PageResult<FavoriteVO> result = service.list(ACCOUNT_ID, "RESOURCE", 1, 20);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getRecords()).hasSize(1);
        FavoriteVO vo = result.getRecords().get(0);
        assertThat(vo.getFavoriteId()).isEqualTo(1L);
        assertThat(vo.getBizType()).isEqualTo("RESOURCE");
        assertThat(vo.getBizId()).isEqualTo(BIZ_ID);
        assertThat(vo.getTitle()).isEqualTo("测试资源");
        assertThat(vo.getType()).isEqualTo("PRODUCT");
    }

    @Test
    @DisplayName("场景7：list - 无收藏数据时返回空分页")
    void list_empty_returnsEmptyPage() {
        Page<MatchFavorite> dbPage = new Page<>(1, 20);
        dbPage.setRecords(List.of());
        dbPage.setTotal(0);
        doReturn(dbPage).when(favoriteMapper).selectPage(any(), any());

        PageResult<FavoriteVO> result = service.list(ACCOUNT_ID, "DEMAND", 1, 20);

        assertThat(result.getTotal()).isEqualTo(0);
        assertThat(result.getRecords()).isEmpty();
        verify(supplyClient, never()).batchBriefDemands(anyList());
    }
}
