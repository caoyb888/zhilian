package com.greenlink.glportal.es;

import com.greenlink.glportal.domain.PortalArticle;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArticleEsSyncServiceTest {

    @Mock
    ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    ArticleEsSyncService service;

    @Test
    void syncSave_shouldIndexDocument() {
        PortalArticle article = buildArticle(1L, "绿色能源新技术", "最新绿色能源技术介绍");

        service.syncSave(article);

        ArgumentCaptor<ArticleEsDoc> captor = ArgumentCaptor.forClass(ArticleEsDoc.class);
        verify(elasticsearchOperations).save(captor.capture());
        ArticleEsDoc doc = captor.getValue();
        assertThat(doc.getId()).isEqualTo(1L);
        assertThat(doc.getTitle()).isEqualTo("绿色能源新技术");
        assertThat(doc.getSummary()).isEqualTo("最新绿色能源技术介绍");
        assertThat(doc.getIsPublished()).isEqualTo(1);
        assertThat(doc.getIsDeleted()).isEqualTo(0);
    }

    @Test
    void syncDelete_shouldRemoveDocument() {
        service.syncDelete(42L);

        verify(elasticsearchOperations).delete("42", ArticleEsDoc.class);
    }

    @Test
    void syncAll_shouldBulkSave() {
        List<PortalArticle> articles = List.of(
                buildArticle(1L, "文章一", "摘要一"),
                buildArticle(2L, "文章二", "摘要二")
        );

        service.syncAll(articles);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<ArticleEsDoc>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(elasticsearchOperations).save(captor.capture());
        List<ArticleEsDoc> docs = (List<ArticleEsDoc>) captor.getValue();
        assertThat(docs).hasSize(2);
    }

    @Test
    void syncAll_emptyList_shouldSkip() {
        service.syncAll(List.of());
        verifyNoInteractions(elasticsearchOperations);
    }

    @Test
    void searchByKeyword_noHits_returnsEmpty() {
        SearchHits<ArticleEsDoc> mockHits = mock(SearchHits.class);
        when(mockHits.getTotalHits()).thenReturn(0L);
        when(mockHits.getSearchHits()).thenReturn(List.of());
        when(elasticsearchOperations.search(any(Query.class), eq(ArticleEsDoc.class)))
                .thenReturn(mockHits);

        EsPageResult result = service.searchByKeyword("无结果关键词", null, null, 1, 20);

        assertThat(result.total()).isEqualTo(0L);
        assertThat(result.orderedIds()).isEmpty();
    }

    @Test
    void searchByKeyword_withHits_returnsHighlights() {
        ArticleEsDoc doc = new ArticleEsDoc();
        doc.setId(10L);

        SearchHit<ArticleEsDoc> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getHighlightField("title")).thenReturn(List.of("<em>绿色</em>能源"));
        when(hit.getHighlightField("summary")).thenReturn(List.of());

        SearchHits<ArticleEsDoc> mockHits = mock(SearchHits.class);
        when(mockHits.getTotalHits()).thenReturn(1L);
        when(mockHits.getSearchHits()).thenReturn(List.of(hit));
        when(elasticsearchOperations.search(any(Query.class), eq(ArticleEsDoc.class)))
                .thenReturn(mockHits);

        EsPageResult result = service.searchByKeyword("绿色能源", null, null, 1, 20);

        assertThat(result.total()).isEqualTo(1L);
        assertThat(result.orderedIds()).containsExactly(10L);
        assertThat(result.highlightTitles()).containsEntry(10L, "<em>绿色</em>能源");
        assertThat(result.highlightSummaries()).isEmpty();
    }

    @Test
    void syncSave_esException_shouldPropagate() {
        doThrow(new RuntimeException("ES 连接失败")).when(elasticsearchOperations).save(any(ArticleEsDoc.class));

        PortalArticle article = buildArticle(1L, "标题", "摘要");
        // 异常向上传播，使 RocketMQ 触发重试而非永久丢失消息
        assertThatThrownBy(() -> service.syncSave(article))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ES 连接失败");
    }

    @Test
    void syncAll_esException_shouldNotPropagate() {
        doThrow(new RuntimeException("ES 连接失败")).when(elasticsearchOperations).save(any(Iterable.class));

        // syncAll 是管理员一次性操作，内部 catch 保证接口不报 500
        service.syncAll(List.of(buildArticle(1L, "标题", "摘要")));
    }

    private PortalArticle buildArticle(Long id, String title, String summary) {
        PortalArticle a = new PortalArticle();
        a.setId(id);
        a.setCategoryId(100L);
        a.setTitle(title);
        a.setSummary(summary);
        a.setIsPublished(1);
        a.setIsDeleted(0);
        return a;
    }
}
