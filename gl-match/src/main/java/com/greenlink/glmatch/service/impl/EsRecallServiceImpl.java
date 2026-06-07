package com.greenlink.glmatch.service.impl;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Like;
import co.elastic.clients.elasticsearch._types.query_dsl.MoreLikeThisQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import com.greenlink.glmatch.engine.recall.EsRecallCandidate;
import com.greenlink.glmatch.es.SupplyDemandEsRef;
import com.greenlink.glmatch.es.SupplyResourceEsRef;
import com.greenlink.glmatch.service.EsRecallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsRecallServiceImpl implements EsRecallService {

    private static final List<String> MLT_FIELDS = List.of("title", "summary", "tagNames");

    private final ElasticsearchOperations elasticsearchOperations;

    @Override
    public List<EsRecallCandidate> recall(String likeText, String targetBizType,
                                           String provinceFilter, int maxResults) {
        if (!StringUtils.hasText(likeText)) {
            log.debug("ES 召回：likeText 为空，跳过 bizType={}", targetBizType);
            return Collections.emptyList();
        }

        try {
            NativeQuery query = buildMltQuery(likeText, provinceFilter, maxResults);
            return "RESOURCE".equals(targetBizType)
                    ? executeOnResourceIndex(query)
                    : executeOnDemandIndex(query);
        } catch (Exception e) {
            log.warn("ES MLT 召回失败 targetBizType={}", targetBizType, e);
            return Collections.emptyList();
        }
    }

    // ───────────────────── private ─────────────────────

    private NativeQuery buildMltQuery(String likeText, String provinceFilter, int maxResults) {
        // more_like_this 查询：从 likeText 提取关键词，在目标索引中找相似文档
        Query mltQuery = MoreLikeThisQuery.of(m -> m
                .fields(MLT_FIELDS)
                .like(Like.of(l -> l.text(likeText)))
                .minTermFreq(1)
                .minDocFreq(1)
                .maxQueryTerms(25)
        )._toQuery();

        // filter：仅检索已审核通过且未删除的记录
        List<Query> filters = new ArrayList<>();
        filters.add(TermQuery.of(t -> t.field("auditStatus").value(1))._toQuery());
        filters.add(TermQuery.of(t -> t.field("isDeleted").value(0))._toQuery());
        if (StringUtils.hasText(provinceFilter)) {
            filters.add(TermQuery.of(t -> t.field("province").value(provinceFilter))._toQuery());
        }

        Query boolQuery = BoolQuery.of(b -> b.must(mltQuery).filter(filters))._toQuery();

        return NativeQuery.builder()
                .withQuery(boolQuery)
                .withPageable(PageRequest.of(0, maxResults))
                .build();
    }

    private List<EsRecallCandidate> executeOnResourceIndex(NativeQuery query) {
        SearchHits<SupplyResourceEsRef> hits =
                elasticsearchOperations.search(query, SupplyResourceEsRef.class);
        return toEsCandidates(hits.getSearchHits(),
                hit -> hit.getContent().getId(), hit -> hit.getScore());
    }

    private List<EsRecallCandidate> executeOnDemandIndex(NativeQuery query) {
        SearchHits<SupplyDemandEsRef> hits =
                elasticsearchOperations.search(query, SupplyDemandEsRef.class);
        return toEsCandidates(hits.getSearchHits(),
                hit -> hit.getContent().getId(), hit -> hit.getScore());
    }

    @FunctionalInterface
    interface IdExtractor<T> {
        Long extract(SearchHit<T> hit);
    }

    @FunctionalInterface
    interface ScoreExtractor<T> {
        Float extract(SearchHit<T> hit);
    }

    private <T> List<EsRecallCandidate> toEsCandidates(List<SearchHit<T>> hits,
                                                         IdExtractor<T> idExtractor,
                                                         ScoreExtractor<T> scoreExtractor) {
        List<EsRecallCandidate> result = new ArrayList<>(hits.size());
        for (SearchHit<T> hit : hits) {
            Long id = idExtractor.extract(hit);
            Float score = scoreExtractor.extract(hit);
            if (id != null) {
                result.add(new EsRecallCandidate(id, score != null ? score : 0f));
            }
        }
        return result;
    }
}
