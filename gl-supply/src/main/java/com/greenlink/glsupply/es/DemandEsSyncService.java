package com.greenlink.glsupply.es;

import com.greenlink.glsupply.domain.SupplyDemand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DemandEsSyncService {

    private final ElasticsearchOperations elasticsearchOperations;

    public void syncSave(SupplyDemand demand, List<String> tagNames) {
        elasticsearchOperations.save(toDoc(demand, tagNames));
        log.debug("ES 同步需求 id={}", demand.getId());
    }

    public void syncDelete(Long id) {
        elasticsearchOperations.delete(String.valueOf(id), DemandEsDoc.class);
        log.debug("ES 删除需求 id={}", id);
    }

    public int syncAll(List<SupplyDemand> demands) {
        if (demands.isEmpty()) return 0;
        try {
            List<DemandEsDoc> docs = demands.stream()
                    .map(d -> toDoc(d, List.of()))
                    .toList();
            elasticsearchOperations.save(docs);
            log.info("ES 全量同步需求完成，共 {} 条", docs.size());
            return docs.size();
        } catch (Exception e) {
            log.error("ES 全量同步需求失败", e);
            return 0;
        }
    }

    DemandEsDoc toDoc(SupplyDemand d, List<String> tagNames) {
        DemandEsDoc doc = new DemandEsDoc();
        doc.setId(d.getId());
        doc.setTitle(d.getTitle());
        doc.setSummary(d.getSummary());
        doc.setTagNames(tagNames == null || tagNames.isEmpty() ? null : String.join(" ", tagNames));
        doc.setType(d.getType());
        doc.setProvince(d.getProvince());
        doc.setAuditStatus(d.getAuditStatus());
        doc.setIsDeleted(d.getIsDeleted() != null ? d.getIsDeleted() : 0);
        return doc;
    }
}
