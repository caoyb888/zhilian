package com.greenlink.glsupply.mq;

import com.greenlink.common.result.Result;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.es.ResourceEsSyncService;
import com.greenlink.glsupply.feign.TagRelationClient;
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(
        topic = ResourceEventProducer.TOPIC,
        consumerGroup = "gl-supply-es-sync-group"
)
public class ResourceEventConsumer implements RocketMQListener<ResourceEventMessage> {

    private final SupplyResourceMapper resourceMapper;
    private final ResourceEsSyncService esSyncService;

    @Autowired(required = false)
    private TagRelationClient tagRelationClient;

    @Override
    public void onMessage(ResourceEventMessage message) {
        log.debug("收到资源事件 type={} id={}", message.getEventType(), message.getResourceId());
        if (ResourceEventMessage.EVENT_SAVE.equals(message.getEventType())) {
            SupplyResource resource = resourceMapper.selectById(message.getResourceId());
            // null: 已被软删除（全局逻辑删除过滤）或物理不存在；isDeleted 二次保险防止 MQ 乱序
            if (resource != null && resource.getIsDeleted() == 0) {
                esSyncService.syncSave(resource, fetchTagNames(message.getResourceId()));
            }
        } else if (ResourceEventMessage.EVENT_DELETE.equals(message.getEventType())) {
            esSyncService.syncDelete(message.getResourceId());
        }
    }

    private List<String> fetchTagNames(Long resourceId) {
        if (tagRelationClient == null) return Collections.emptyList();
        try {
            Result<List<TagSimpleVO>> result = tagRelationClient.getByBiz("RESOURCE", resourceId);
            if (result == null || result.getData() == null) return Collections.emptyList();
            return result.getData().stream().map(TagSimpleVO::getName).toList();
        } catch (Exception e) {
            log.warn("ES 同步时获取标签失败 resourceId={}，tagNames 将为空", resourceId, e);
            return Collections.emptyList();
        }
    }
}
