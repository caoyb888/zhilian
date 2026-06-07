package com.greenlink.glsupply.mq;

import com.greenlink.common.result.Result;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import com.greenlink.glsupply.es.ResourceEsSyncService;
import com.greenlink.glsupply.feign.TagRelationClient;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceEventConsumerTest {

    @Mock
    SupplyResourceMapper resourceMapper;

    @Mock
    ResourceEsSyncService esSyncService;

    @Mock
    TagRelationClient tagRelationClient;

    @InjectMocks
    ResourceEventConsumer consumer;

    @BeforeEach
    void setUp() {
        // @Autowired(required=false) 필드는 Lombok 생성자 주입 후 Mockito가 자동 주입하지 않으므로 직접 설정
        ReflectionTestUtils.setField(consumer, "tagRelationClient", tagRelationClient);
    }

    @Test
    void onMessage_saveEvent_existsAndNotDeleted_shouldSyncWithTags() {
        SupplyResource resource = buildResource(1L, 0);
        when(resourceMapper.selectById(1L)).thenReturn(resource);
        TagSimpleVO tag = new TagSimpleVO();
        tag.setId(10L);
        tag.setName("光伏");
        when(tagRelationClient.getByBiz("RESOURCE", 1L)).thenReturn(Result.ok(List.of(tag)));

        consumer.onMessage(new ResourceEventMessage(ResourceEventMessage.EVENT_SAVE, 1L));

        verify(esSyncService).syncSave(eq(resource), eq(List.of("光伏")));
        verify(esSyncService, never()).syncDelete(any());
    }

    @Test
    void onMessage_saveEvent_resourceNotFound_shouldSkip() {
        when(resourceMapper.selectById(99L)).thenReturn(null);

        consumer.onMessage(new ResourceEventMessage(ResourceEventMessage.EVENT_SAVE, 99L));

        verifyNoInteractions(esSyncService);
    }

    @Test
    void onMessage_saveEvent_softDeleted_shouldSkip() {
        SupplyResource resource = buildResource(2L, 1);
        when(resourceMapper.selectById(2L)).thenReturn(resource);

        consumer.onMessage(new ResourceEventMessage(ResourceEventMessage.EVENT_SAVE, 2L));

        verifyNoInteractions(esSyncService);
    }

    @Test
    void onMessage_deleteEvent_shouldSyncDelete() {
        consumer.onMessage(new ResourceEventMessage(ResourceEventMessage.EVENT_DELETE, 5L));

        verify(esSyncService).syncDelete(5L);
        verify(resourceMapper, never()).selectById(any());
    }

    @Test
    void onMessage_saveEvent_feignFails_shouldSyncWithEmptyTags() {
        SupplyResource resource = buildResource(3L, 0);
        when(resourceMapper.selectById(3L)).thenReturn(resource);
        when(tagRelationClient.getByBiz(anyString(), anyLong()))
                .thenThrow(new RuntimeException("Feign 超时"));

        consumer.onMessage(new ResourceEventMessage(ResourceEventMessage.EVENT_SAVE, 3L));

        verify(esSyncService).syncSave(eq(resource), eq(List.of()));
    }

    private SupplyResource buildResource(Long id, int isDeleted) {
        SupplyResource r = new SupplyResource();
        r.setId(id);
        r.setTitle("测试资源");
        r.setIsDeleted(isDeleted);
        return r;
    }
}
