package com.greenlink.glsupply.es;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.IdsQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.MultiMatchQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import com.greenlink.glsupply.domain.SupplyResource;
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
public class ResourceEsSyncService {

    private final ElasticsearchOperations elasticsearchOperations;

    // ──────────────── 索引同步 ────────────────

    public void syncSave(SupplyResource resource, List<String> tagNames) {
        elasticsearchOperations.save(toDoc(resource, tagNames));
        log.debug("ES 同步资源 id={}", resource.getId());
    }

    public void syncDelete(Long id) {
        elasticsearchOperations.delete(String.valueOf(id), ResourceEsDoc.class);
        log.debug("ES 删除资源 id={}", id);
    }

    /**
     * 批量全量同步（管理端历史数据重建）。tagNames 不逐条拉取，写入 null；
     * 如需补全 tagNames，可对每条资源重新发送 MQ SAVE 事件触发单条同步。
     *
     * @return 实际写入 ES 的条数；写入失败返回 0（异常已记录，不上抛避免 admin API 500）
     */
    public int syncAll(List<SupplyResource> resources) {
        if (resources.isEmpty()) return 0;
        try {
            List<ResourceEsDoc> docs = resources.stream()
                    .map(r -> toDoc(r, List.of()))
                    .toList();
            elasticsearchOperations.save(docs);
            log.info("ES 全量同步完成，共 {} 条资源", docs.size());
            return docs.size();
        } catch (Exception e) {
            log.error("ES 全量同步失败", e);
            return 0;
        }
    }

    // ──────────────── 全文检索 ────────────────

    /**
     * IK 分词全文检索：title 权重 2x、summary 1x、tagNames 1x，返回高亮 + 有序 ID 列表。
     *
     * @param keyword    关键词（非空）
     * @param type       资源类型过滤（nullable）
     * @param province   省份过滤（nullable）
     * @param scopeIds   候选 ID 白名单，非空时只在此范围内检索（tagId 过滤场景）
     * @param page       页码（从 1 开始）
     * @param size       每页条数
     */
    public EsPageResult searchByKeyword(String keyword, String type, String province,
                                        List<Long> scopeIds, int page, int size) {
        List<Query> filterQueries = new ArrayList<>();
        filterQueries.add(TermQuery.of(t -> t.field("auditStatus").value(1))._toQuery());
        filterQueries.add(TermQuery.of(t -> t.field("isDeleted").value(0))._toQuery());
        if (type != null && !type.isBlank()) {
            filterQueries.add(TermQuery.of(t -> t.field("type").value(type))._toQuery());
        }
        if (province != null && !province.isBlank()) {
            filterQueries.add(TermQuery.of(t -> t.field("province").value(province))._toQuery());
        }
        if (scopeIds != null && !scopeIds.isEmpty()) {
            List<String> idStrs = scopeIds.stream().map(String::valueOf).toList();
            filterQueries.add(IdsQuery.of(i -> i.values(idStrs))._toQuery());
        }

        Query esQuery = BoolQuery.of(b -> b
                .must(MultiMatchQuery.of(mm -> mm
                        .query(keyword)
                        .fields(List.of("title^2", "summary", "tagNames"))
                        .analyzer("ik_smart")
                )._toQuery())
                .filter(filterQueries)
        )._toQuery();

        Highlight highlight = new Highlight(List.of(
                new HighlightField("title"),
                new HighlightField("summary")
        ));
        org.springframework.data.elasticsearch.core.query.HighlightQuery highlightQuery =
                new org.springframework.data.elasticsearch.core.query.HighlightQuery(highlight, ResourceEsDoc.class);

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(esQuery)
                .withHighlightQuery(highlightQuery)
                .withPageable(PageRequest.of(page - 1, size))
                .build();

        SearchHits<ResourceEsDoc> hits = elasticsearchOperations.search(nativeQuery, ResourceEsDoc.class);

        List<Long> ids = new ArrayList<>();
        Map<Long, String> highlightTitles = new HashMap<>();
        Map<Long, String> highlightSummaries = new HashMap<>();

        for (SearchHit<ResourceEsDoc> hit : hits.getSearchHits()) {
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

    // ──────────────── 内部工具 ────────────────

    ResourceEsDoc toDoc(SupplyResource r, List<String> tagNames) {
        ResourceEsDoc doc = new ResourceEsDoc();
        doc.setId(r.getId());
        doc.setTitle(r.getTitle());
        doc.setSummary(r.getSummary());
        doc.setTagNames(tagNames == null || tagNames.isEmpty() ? null : String.join(" ", tagNames));
        doc.setType(r.getType());
        doc.setProvince(r.getProvince());
        doc.setAuditStatus(r.getAuditStatus());
        doc.setIsDeleted(r.getIsDeleted() != null ? r.getIsDeleted() : 0);
        return doc;
    }
}
