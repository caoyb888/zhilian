package com.greenlink.glmatch.mq;

import com.greenlink.common.mq.MatchEventMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MatchEventProducer {

    private final RocketMQTemplate rocketMQTemplate;

    public void publish(MatchEventMessage event) {
        try {
            rocketMQTemplate.convertAndSend(MatchEventMessage.TOPIC, event);
            log.info("对接事件已发送 topic={} eventType={} matchId={}",
                    MatchEventMessage.TOPIC, event.getEventType(), event.getMatchId());
        } catch (Exception e) {
            // 通知发送失败不影响主业务，仅记录日志
            log.warn("对接事件发送失败 eventType={} matchId={}", event.getEventType(), event.getMatchId(), e);
        }
    }
}
