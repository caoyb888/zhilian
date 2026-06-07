package com.greenlink.glsupply.es;

import com.greenlink.glsupply.domain.SupplyResource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceEsSyncServiceTest {

    @Mock
    ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    ResourceEsSyncService service;

    @Test
    void syncSave_shouldIndexDocumentWithTagNames() {
        SupplyResource resource = buildResource(1L, "绿色能源技术转让", "高效光伏组件技术");

        service.syncSave(resource, List.of("光伏", "新能源"));

        ArgumentCaptor<ResourceEsDoc> captor = ArgumentCaptor.forClass(ResourceEsDoc.class);
        verify(elasticsearchOperations).save(captor.capture());
        ResourceEsDoc doc = captor.getValue();
        assertThat(doc.getId()).isEqualTo(1L);
        assertThat(doc.getTitle()).isEqualTo("绿色能源技术转让");
        assertThat(doc.getSummary()).isEqualTo("高效光伏组件技术");
        assertThat(doc.getTagNames()).isEqualTo("光伏 新能源");
        assertThat(doc.getType()).isEqualTo("TECHNOLOGY");
        assertThat(doc.getProvince()).isEqualTo("山东");
        assertThat(doc.getAuditStatus()).isEqualTo(1);
        assertThat(doc.getIsDeleted()).isEqualTo(0);
    }

    @Test
    void syncSave_emptyTagNames_shouldSetNullTagNames() {
        SupplyResource resource = buildResource(2L, "产品出售", "优质低碳产品");

        service.syncSave(resource, List.of());

        ArgumentCaptor<ResourceEsDoc> captor = ArgumentCaptor.forClass(ResourceEsDoc.class);
        verify(elasticsearchOperations).save(captor.capture());
        assertThat(captor.getValue().getTagNames()).isNull();
    }

    @Test
    void syncSave_esException_shouldPropagate() {
        doThrow(new RuntimeException("ES 连接失败")).when(elasticsearchOperations).save(any(ResourceEsDoc.class));

        SupplyResource resource = buildResource(1L, "标题", "摘要");
        // 异常向上传播，使 RocketMQ 触发重试而非永久丢失消息
        assertThatThrownBy(() -> service.syncSave(resource, List.of()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ES 连接失败");
    }

    @Test
    void syncDelete_shouldRemoveDocument() {
        service.syncDelete(42L);

        verify(elasticsearchOperations).delete("42", ResourceEsDoc.class);
    }

    @Test
    void syncAll_shouldBulkSave() {
        List<SupplyResource> resources = List.of(
                buildResource(1L, "资源一", "摘要一"),
                buildResource(2L, "资源二", "摘要二")
        );

        service.syncAll(resources, List.of());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<ResourceEsDoc>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(elasticsearchOperations).save(captor.capture());
        List<ResourceEsDoc> docs = (List<ResourceEsDoc>) captor.getValue();
        assertThat(docs).hasSize(2);
    }

    @Test
    void syncAll_emptyList_shouldSkip() {
        service.syncAll(List.of(), List.of());
        verifyNoInteractions(elasticsearchOperations);
    }

    @Test
    void syncAll_esException_shouldNotPropagate() {
        doThrow(new RuntimeException("ES 连接失败")).when(elasticsearchOperations).save(any(Iterable.class));

        // syncAll 是管理员一次性操作，内部 catch 保证接口不报 500
        service.syncAll(List.of(buildResource(1L, "标题", "摘要")), List.of());
    }

    @Test
    void toDoc_deletedResource_shouldPreserveIsDeleted() {
        SupplyResource resource = buildResource(5L, "已删除资源", "摘要");
        resource.setIsDeleted(1);

        ResourceEsDoc doc = service.toDoc(resource, List.of());

        assertThat(doc.getIsDeleted()).isEqualTo(1);
    }

    private SupplyResource buildResource(Long id, String title, String summary) {
        SupplyResource r = new SupplyResource();
        r.setId(id);
        r.setType("TECHNOLOGY");
        r.setTitle(title);
        r.setSummary(summary);
        r.setProvince("山东");
        r.setAuditStatus(1);
        r.setIsDeleted(0);
        return r;
    }
}
