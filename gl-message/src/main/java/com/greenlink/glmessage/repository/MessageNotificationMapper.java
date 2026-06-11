package com.greenlink.glmessage.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmessage.domain.MessageNotification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MessageNotificationMapper extends BaseMapper<MessageNotification> {

    /**
     * 统计指定渠道、指定发送状态的消息数量。
     * channel: 'SITE' / 'WECHAT'；sendStatus: 1=已发送 2=失败
     */
    @Select("SELECT COUNT(*) FROM message_notification " +
            "WHERE channel = #{channel} AND send_status = #{sendStatus}")
    long countByChannelAndStatus(@Param("channel") String channel,
                                  @Param("sendStatus") int sendStatus);
}
