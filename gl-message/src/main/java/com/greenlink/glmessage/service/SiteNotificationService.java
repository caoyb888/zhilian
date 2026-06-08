package com.greenlink.glmessage.service;

import com.greenlink.common.mq.MatchEventMessage;

public interface SiteNotificationService {

    /** 根据对接事件生成站内信通知（可能创建多条，如完成通知双方）。*/
    void createFromMatchEvent(MatchEventMessage event);
}
