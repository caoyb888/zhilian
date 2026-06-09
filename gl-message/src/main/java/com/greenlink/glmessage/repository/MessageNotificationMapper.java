package com.greenlink.glmessage.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmessage.domain.MessageNotification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageNotificationMapper extends BaseMapper<MessageNotification> {
}
