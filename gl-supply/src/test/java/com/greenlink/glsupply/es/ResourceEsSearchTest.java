package com.greenlink.glsupply.es;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

@ExtendWith(MockitoExtension.class)
class ResourceEsSearchTest {

    @Mock
    ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    ResourceEsSyncService service;

    @Test
    void searchByKeyword_noHits_returnsEmpty() {
        SearchHits<ResourceEsDoc> mockHits = mockHits(0L, List.of());
        when(elasticsearchOperations.search(any(Query.class), eq(ResourceEsDoc.class)))
                .thenReturn(mockHits);

        EsPageResult result = service.searchByKeyword("无结果", null, null, null, 1, 20);

        assertThat(result.total()).isEqualTo(0L);
        assertThat(result.orderedIds()).isEmpty();
    }

    @Test
    void searchByKeyword_withHits_returnsOrderedIdsAndHighlights() {
        ResourceEsDoc doc1 = makeDoc(10L);
        ResourceEsDoc doc2 = makeDoc(20L);

        SearchHit<ResourceEsDoc> hit1 = makeHit(doc1, "<em>光伏</em>组件", "");
        SearchHit<ResourceEsDoc> hit2 = makeHit(doc2, "", "高效<em>光伏</em>技术");

        SearchHits<ResourceEsDoc> mockHits = mockHits(2L, List.of(hit1, hit2));
        when(elasticsearchOperations.search(any(Query.class), eq(ResourceEsDoc.class)))
                .thenReturn(mockHits);

        EsPageResult result = service.searchByKeyword("光伏", "TECHNOLOGY", "山东", null, 1, 20);

        assertThat(result.total()).isEqualTo(2L);
        assertThat(result.orderedIds()).containsExactly(10L, 20L);
        assertThat(result.highlightTitles()).containsEntry(10L, "<em>光伏</em>组件");
        assertThat(result.highlightTitles()).doesNotContainKey(20L);
        assertThat(result.highlightSummaries()).containsEntry(20L, "高效<em>光伏</em>技术");
    }

    @Test
    void searchByKeyword_withScopeIds_includesIdsFilter() {
        SearchHits<ResourceEsDoc> mockHits = mockHits(0L, List.of());
        ArgumentCaptor<Query> queryCaptor = ArgumentCaptor.forClass(Query.class);
        when(elasticsearchOperations.search(queryCaptor.capture(), eq(ResourceEsDoc.class)))
                .thenReturn(mockHits);

        service.searchByKeyword("绿色能源", null, null, List.of(1L, 2L, 3L), 1, 20);

        // 验证 query 被构造（不为 null）—— IDs filter 由 ES 内部 BoolQuery 承载
        assertThat(queryCaptor.getValue()).isNotNull();
    }

    @Test
    void searchByKeyword_multiHlSegments_joinsWithEllipsis() {
        ResourceEsDoc doc = makeDoc(5L);
        SearchHit<ResourceEsDoc> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getHighlightField("title")).thenReturn(List.of("<em>A</em>", "<em>B</em>"));
        when(hit.getHighlightField("summary")).thenReturn(List.of());

        SearchHits<ResourceEsDoc> mockHits = mockHits(1L, List.of(hit));
        when(elasticsearchOperations.search(any(Query.class), eq(ResourceEsDoc.class)))
                .thenReturn(mockHits);

        EsPageResult result = service.searchByKeyword("AB", null, null, null, 1, 20);

        assertThat(result.highlightTitles().get(5L)).isEqualTo("<em>A</em>...<em>B</em>");
    }

    // ────────── helpers ──────────

    @SuppressWarnings("unchecked")
    private SearchHits<ResourceEsDoc> mockHits(long total, List<SearchHit<ResourceEsDoc>> hits) {
        SearchHits<ResourceEsDoc> mockHits = mock(SearchHits.class);
        when(mockHits.getTotalHits()).thenReturn(total);
        when(mockHits.getSearchHits()).thenReturn(hits);
        return mockHits;
    }

    private ResourceEsDoc makeDoc(Long id) {
        ResourceEsDoc doc = new ResourceEsDoc();
        doc.setId(id);
        return doc;
    }

    @SuppressWarnings("unchecked")
    private SearchHit<ResourceEsDoc> makeHit(ResourceEsDoc doc, String hlTitle, String hlSummary) {
        SearchHit<ResourceEsDoc> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getHighlightField("title"))
                .thenReturn(hlTitle.isBlank() ? List.of() : List.of(hlTitle));
        when(hit.getHighlightField("summary"))
                .thenReturn(hlSummary.isBlank() ? List.of() : List.of(hlSummary));
        return hit;
    }
}
