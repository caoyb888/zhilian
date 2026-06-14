package com.greenlink.glportal.es;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.MultiMatchQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import com.greenlink.glportal.domain.PortalArticle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArticleEsSyncService {

    private final ElasticsearchOperations elasticsearchOperations;

    public void syncSave(PortalArticle article) {
        elasticsearchOperations.save(toDoc(article));
        log.debug("ES 同步文章 id={}", article.getId());
    }

    public void syncDelete(Long id) {
        elasticsearchOperations.delete(String.valueOf(id), ArticleEsDoc.class);
        log.debug("ES 删除文章 id={}", id);
    }

    public void syncAll(List<PortalArticle> articles) {
        if (articles.isEmpty()) return;
        try {
            List<ArticleEsDoc> docs = articles.stream().map(this::toDoc).toList();
            elasticsearchOperations.save(docs);
            log.info("ES 全量同步完成，共 {} 篇文章", docs.size());
        } catch (Exception e) {
            log.error("ES 全量同步失败", e);
        }
    }

    /**
     * IK 分词关键词检索，title 权重 2x，返回高亮结果。
     * <p>
     * ES 默认高亮标签即为 {@code <em>...</em>}，无需额外配置。
     */
    /**
     * @param published null=不过滤（管理员），true=仅已发布，false=仅草稿
     */
    public EsPageResult searchByKeyword(String keyword, Long categoryId, Boolean published, int page, int size) {
        List<Query> filterQueries = new ArrayList<>();
        if (published != null) {
            int pubVal = Boolean.TRUE.equals(published) ? 1 : 0;
            filterQueries.add(TermQuery.of(t -> t.field("isPublished").value(pubVal))._toQuery());
        }
        filterQueries.add(TermQuery.of(t -> t.field("isDeleted").value(0))._toQuery());
        if (categoryId != null) {
            filterQueries.add(TermQuery.of(t -> t.field("categoryId").value(categoryId))._toQuery());
        }

        Query esQuery = BoolQuery.of(b -> b
                .must(MultiMatchQuery.of(mm -> mm
                        .query(keyword)
                        .fields(List.of("title^2", "summary"))
                        .analyzer("ik_smart")
                        .operator(co.elastic.clients.elasticsearch._types.query_dsl.Operator.And)
                )._toQuery())
                .filter(filterQueries)
        )._toQuery();

        Highlight highlight = new Highlight(List.of(
                new HighlightField("title"),
                new HighlightField("summary")
        ));
        org.springframework.data.elasticsearch.core.query.HighlightQuery highlightQuery =
                new org.springframework.data.elasticsearch.core.query.HighlightQuery(highlight, ArticleEsDoc.class);

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(esQuery)
                .withHighlightQuery(highlightQuery)
                .withPageable(PageRequest.of(page - 1, size))
                .build();

        SearchHits<ArticleEsDoc> hits = elasticsearchOperations.search(nativeQuery, ArticleEsDoc.class);

        List<Long> ids = new ArrayList<>();
        Map<Long, String> highlightTitles = new HashMap<>();
        Map<Long, String> highlightSummaries = new HashMap<>();

        for (SearchHit<ArticleEsDoc> hit : hits.getSearchHits()) {
            Long id = hit.getContent().getId();
            ids.add(id);
            List<String> titleHls = hit.getHighlightField("title");
            if (!titleHls.isEmpty()) {
                highlightTitles.put(id, String.join("...", titleHls));
            }
            List<String> summaryHls = hit.getHighlightField("summary");
            if (!summaryHls.isEmpty()) {
                highlightSummaries.put(id, String.join("...", summaryHls));
            }
        }

        return new EsPageResult(hits.getTotalHits(), ids, highlightTitles, highlightSummaries);
    }

    private ArticleEsDoc toDoc(PortalArticle article) {
        ArticleEsDoc doc = new ArticleEsDoc();
        doc.setId(article.getId());
        doc.setCategoryId(article.getCategoryId());
        doc.setTitle(article.getTitle());
        doc.setSummary(article.getSummary());
        doc.setIsPublished(article.getIsPublished() != null ? article.getIsPublished() : 0);
        doc.setIsDeleted(article.getIsDeleted() != null ? article.getIsDeleted() : 0);
        return doc;
    }
}
