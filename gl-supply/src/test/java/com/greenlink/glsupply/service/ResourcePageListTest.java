package com.greenlink.glsupply.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.dto.request.ResourcePageRequest;
import com.greenlink.glsupply.dto.response.ResourceVO;
import com.greenlink.glsupply.es.EsPageResult;
import com.greenlink.glsupply.es.ResourceEsSyncService;
import com.greenlink.glsupply.feign.TagRelationClient;
import com.greenlink.glsupply.repository.SupplyAttachmentMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import com.greenlink.glsupply.service.impl.SupplyResourceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourcePageListTest {

    @Mock
    SupplyResourceMapper resourceMapper;
    @Mock
    SupplyAttachmentMapper attachmentMapper;
    @Mock
    ResourceEsSyncService esSyncService;
    @Mock
    TagRelationClient tagRelationClient;

    @InjectMocks
    SupplyResourceServiceImpl service;

    @BeforeEach
    void setUp() {
        // @Autowired(required=false) 字段需手动注入
        ReflectionTestUtils.setField(service, "esSyncService", esSyncService);
        ReflectionTestUtils.setField(service, "tagRelationClient", tagRelationClient);
    }

    // ──────────────── MySQL 路径（无 keyword）────────────────

    @Test
    void pageList_noKeyword_usesMysqlPath() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);

        Page<SupplyResource> dbPage = new Page<>(1, 20, 0);
        dbPage.setRecords(List.of());
        when(resourceMapper.selectPage(any(), any(QueryWrapper.class))).thenReturn(dbPage);

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(0);
        verifyNoInteractions(esSyncService);
    }

    @Test
    void pageList_noKeyword_withTagId_resolvesTagScopeAndFilters() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setTagId(5L);

        when(tagRelationClient.getBizIdsByTag(5L, "RESOURCE"))
                .thenReturn(Result.ok(List.of(10L, 20L)));

        Page<SupplyResource> dbPage = new Page<>(1, 20, 2);
        dbPage.setRecords(List.of(buildResource(10L), buildResource(20L)));
        when(resourceMapper.selectPage(any(), any(QueryWrapper.class))).thenReturn(dbPage);

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(2);
        assertThat(result.getRecords()).hasSize(2);
        verifyNoInteractions(esSyncService);
    }

    @Test
    void pageList_noKeyword_tagIdHasNoResources_returnsEmpty() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setTagId(99L);

        when(tagRelationClient.getBizIdsByTag(99L, "RESOURCE"))
                .thenReturn(Result.ok(List.of()));

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(0);
        assertThat(result.getRecords()).isEmpty();
        verifyNoInteractions(esSyncService);
        verifyNoInteractions(resourceMapper);
    }

    // ──────────────── ES 路径（有 keyword）────────────────

    @Test
    void pageList_withKeyword_usesEsPath() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setKeyword("光伏");

        EsPageResult esResult = new EsPageResult(2L, List.of(10L, 20L), Map.of(), Map.of());
        when(esSyncService.searchByKeyword(eq("光伏"), isNull(), isNull(), isNull(), eq(1), eq(20)))
                .thenReturn(esResult);

        when(resourceMapper.selectList(any(QueryWrapper.class)))
                .thenReturn(List.of(buildResource(10L), buildResource(20L)));

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(2L);
        assertThat(result.getRecords()).hasSize(2);
        // 验证顺序与 ES 一致
        assertThat(result.getRecords().get(0).getId()).isEqualTo(10L);
        assertThat(result.getRecords().get(1).getId()).isEqualTo(20L);
        verify(resourceMapper, never()).selectPage(any(), any());
    }

    @Test
    void pageList_withKeyword_esReturnsEmpty_returnsEmpty() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setKeyword("无结果");

        when(esSyncService.searchByKeyword(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(EsPageResult.empty());

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(0);
        assertThat(result.getRecords()).isEmpty();
        verifyNoInteractions(resourceMapper);
    }

    @Test
    void pageList_withKeyword_esException_fallbackToMysql() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setKeyword("光伏");

        when(esSyncService.searchByKeyword(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("ES 不可用"));

        Page<SupplyResource> dbPage = new Page<>(1, 20, 1);
        dbPage.setRecords(List.of(buildResource(5L)));
        when(resourceMapper.selectPage(any(), any(QueryWrapper.class))).thenReturn(dbPage);

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(1);
        verify(resourceMapper).selectPage(any(), any(QueryWrapper.class));
    }

    @Test
    void pageList_withKeywordAndTagId_passesScopeIdsToEs() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setKeyword("绿色");
        req.setTagId(3L);

        when(tagRelationClient.getBizIdsByTag(3L, "RESOURCE"))
                .thenReturn(Result.ok(List.of(1L, 2L)));

        EsPageResult esResult = new EsPageResult(1L, List.of(1L), Map.of(), Map.of());
        when(esSyncService.searchByKeyword(eq("绿色"), isNull(), isNull(), eq(List.of(1L, 2L)), eq(1), eq(20)))
                .thenReturn(esResult);

        when(resourceMapper.selectList(any(QueryWrapper.class)))
                .thenReturn(List.of(buildResource(1L)));

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getTotal()).isEqualTo(1L);
        assertThat(result.getRecords().get(0).getId()).isEqualTo(1L);
    }

    @Test
    void pageList_withKeyword_highlightApplied() {
        ResourcePageRequest req = new ResourcePageRequest();
        req.setPage(1);
        req.setSize(20);
        req.setKeyword("光伏");

        EsPageResult esResult = new EsPageResult(1L, List.of(10L),
                Map.of(10L, "<em>光伏</em>组件"), Map.of());
        when(esSyncService.searchByKeyword(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(esResult);

        SupplyResource r = buildResource(10L);
        r.setTitle("光伏组件供应商");
        when(resourceMapper.selectList(any(QueryWrapper.class))).thenReturn(List.of(r));

        Page<ResourceVO> result = service.pageList(req);

        assertThat(result.getRecords().get(0).getHighlightTitle()).isEqualTo("<em>光伏</em>组件");
        assertThat(result.getRecords().get(0).getTitle()).isEqualTo("光伏组件供应商");
    }

    private SupplyResource buildResource(Long id) {
        SupplyResource r = new SupplyResource();
        r.setId(id);
        r.setType("PRODUCT");
        r.setTitle("测试资源" + id);
        r.setSummary("摘要" + id);
        r.setAuditStatus(1);
        r.setIsDeleted(0);
        r.setViewCount(0);
        return r;
    }
}
