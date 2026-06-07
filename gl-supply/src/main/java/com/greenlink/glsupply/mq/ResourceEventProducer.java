package com.greenlink.glsupply.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ResourceEventProducer {

    static final String TOPIC = "SUPPLY_RESOURCE_EVENT";

    private final RocketMQTemplate rocketMQTemplate;

    public void sendSave(Long resourceId) {
        send(new ResourceEventMessage(ResourceEventMessage.EVENT_SAVE, resourceId));
    }

    public void sendDelete(Long resourceId) {
        send(new ResourceEventMessage(ResourceEventMessage.EVENT_DELETE, resourceId));
    }

    private void send(ResourceEventMessage message) {
        try {
            rocketMQTemplate.convertAndSend(TOPIC, message);
            log.debug("发送资源事件 type={} id={}", message.getEventType(), message.getResourceId());
        } catch (Exception e) {
            log.warn("资源事件发送失败 type={} id={}", message.getEventType(), message.getResourceId(), e);
        }
    }
}
