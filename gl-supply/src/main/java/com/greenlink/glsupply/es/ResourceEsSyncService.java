package com.greenlink.glsupply.es;

import com.greenlink.glsupply.domain.SupplyResource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceEsSyncService {

    private final ElasticsearchOperations elasticsearchOperations;

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
