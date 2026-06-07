package com.greenlink.glmatch.service;

import com.greenlink.glmatch.engine.recall.EsRecallCandidate;
import com.greenlink.glmatch.es.SupplyDemandEsRef;
import com.greenlink.glmatch.es.SupplyResourceEsRef;
import com.greenlink.glmatch.service.impl.EsRecallServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * S5-02 单元测试：ES MLT 召回
 */
@ExtendWith(MockitoExtension.class)
class EsRecallServiceTest {

    @Mock
    ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    EsRecallServiceImpl service;

    // ─────────────────────────────────────────────
    // TC-01  likeText 为空，直接返回空列表（不触发 ES 查询）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 likeText 为空时跳过 ES 查询，返回空列表")
    void recall_emptyLikeText_returnsEmpty() {
        List<EsRecallCandidate> result = service.recall("", "DEMAND", null, 200);
        assertThat(result).isEmpty();
    }

    // ─────────────────────────────────────────────
    // TC-02  目标为 DEMAND，ES 命中 2 条，按 BM25 分数返回
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 目标 DEMAND，ES 命中 2 条，candidateId 与 esScore 正确映射")
    void recall_targetDemand_returnsHits() {
        SupplyDemandEsRef doc1 = demandDoc(200L);
        SupplyDemandEsRef doc2 = demandDoc(201L);

        SearchHit<SupplyDemandEsRef> hit1 = makeHit(doc1, 8.5f);
        SearchHit<SupplyDemandEsRef> hit2 = makeHit(doc2, 5.0f);

        SearchHits<SupplyDemandEsRef> mockHits = mockSearchHits(List.of(hit1, hit2));
        when(elasticsearchOperations.search(any(Query.class), eq(SupplyDemandEsRef.class)))
                .thenReturn(mockHits);

        List<EsRecallCandidate> result = service.recall("光伏储能 新能源", "DEMAND", null, 200);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).candidateId()).isEqualTo(200L);
        assertThat(result.get(0).esScore()).isEqualTo(8.5f);
        assertThat(result.get(1).candidateId()).isEqualTo(201L);
    }

    // ─────────────────────────────────────────────
    // TC-03  目标为 RESOURCE，ES 无命中，返回空列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 目标 RESOURCE，ES 无命中，返回空列表")
    void recall_targetResource_noHits() {
        SearchHits<SupplyResourceEsRef> mockHits = mockSearchHits(List.of());
        when(elasticsearchOperations.search(any(Query.class), eq(SupplyResourceEsRef.class)))
                .thenReturn(mockHits);

        List<EsRecallCandidate> result = service.recall("节能降耗技术", "RESOURCE", null, 200);

        assertThat(result).isEmpty();
    }

    // ─────────────────────────────────────────────
    // TC-04  ES 查询异常时降级返回空列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 ES 查询抛出异常，降级返回空列表（不上抛）")
    void recall_esException_returnsEmpty() {
        when(elasticsearchOperations.search(any(Query.class), eq(SupplyDemandEsRef.class)))
                .thenThrow(new RuntimeException("ES connection timeout"));

        List<EsRecallCandidate> result = service.recall("新能源汽车", "DEMAND", null, 200);

        assertThat(result).isEmpty();
    }

    // ──────────── helpers ────────────

    private SupplyDemandEsRef demandDoc(Long id) {
        SupplyDemandEsRef doc = new SupplyDemandEsRef();
        doc.setId(id);
        return doc;
    }

    @SuppressWarnings("unchecked")
    private <T> SearchHit<T> makeHit(T doc, float score) {
        SearchHit<T> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getScore()).thenReturn(score);
        return hit;
    }

    @SuppressWarnings("unchecked")
    private <T> SearchHits<T> mockSearchHits(List<SearchHit<T>> hits) {
        SearchHits<T> sh = mock(SearchHits.class);
        when(sh.getSearchHits()).thenReturn(hits);
        return sh;
    }
}
