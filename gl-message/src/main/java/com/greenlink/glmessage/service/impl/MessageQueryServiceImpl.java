package com.greenlink.glmessage.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.dto.response.MessageVO;
import com.greenlink.glmessage.dto.response.UnreadCountVO;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.MessageQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageQueryServiceImpl implements MessageQueryService {

    private final MessageNotificationMapper notificationMapper;

    @Override
    public PageResult<MessageVO> pageList(Long accountId, String channel, String bizType,
                                          Boolean isRead, int page, int size) {
        QueryWrapper<MessageNotification> wrapper = new QueryWrapper<>();
        wrapper.select("id", "biz_type", "biz_id", "title", "content", "channel", "is_read", "created_at");
        wrapper.eq("account_id", accountId);
        wrapper.eq("channel", channel != null ? channel : "SITE");
        if (bizType != null) {
            wrapper.eq("biz_type", bizType);
        }
        if (isRead != null) {
            wrapper.eq("is_read", isRead ? 1 : 0);
        }
        wrapper.orderByDesc("created_at");

        IPage<MessageNotification> p = notificationMapper.selectPage(new Page<>(page, size), wrapper);
        List<MessageVO> records = p.getRecords().stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(records, p.getTotal(), p.getCurrent(), p.getSize());
    }

    @Override
    public UnreadCountVO unreadCount(Long accountId) {
        long match    = countUnread(accountId, "MATCH");
        long audit    = countUnread(accountId, "AUDIT");
        long activity = countUnread(accountId, "ACTIVITY");
        long system   = countUnread(accountId, "SYSTEM");

        UnreadCountVO vo = new UnreadCountVO();
        vo.setMatch(match);
        vo.setAudit(audit);
        vo.setActivity(activity);
        vo.setSystem(system);
        vo.setTotal(match + audit + activity + system);
        return vo;
    }

    @Override
    public void markRead(Long accountId, Long messageId) {
        MessageNotification msg = notificationMapper.selectById(messageId);
        if (msg == null || !Objects.equals(msg.getAccountId(), accountId)) {
            throw new BizException(1003, "无权操作");
        }
        if (Objects.equals(msg.getIsRead(), 1)) {
            return;
        }
        UpdateWrapper<MessageNotification> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", messageId).eq("account_id", accountId);
        wrapper.set("is_read", 1).set("read_at", LocalDateTime.now());
        notificationMapper.update(null, wrapper);
    }

    @Override
    public void markAllRead(Long accountId, String bizType) {
        UpdateWrapper<MessageNotification> wrapper = new UpdateWrapper<>();
        wrapper.eq("account_id", accountId).eq("is_read", 0);
        if (bizType != null) {
            wrapper.eq("biz_type", bizType);
        }
        wrapper.set("is_read", 1).set("read_at", LocalDateTime.now());
        notificationMapper.update(null, wrapper);
    }

    private long countUnread(Long accountId, String bizType) {
        QueryWrapper<MessageNotification> w = new QueryWrapper<>();
        w.eq("account_id", accountId)
         .eq("biz_type", bizType)
         .eq("is_read", 0)
         .eq("channel", "SITE");
        return notificationMapper.selectCount(w);
    }

    private MessageVO toVO(MessageNotification n) {
        MessageVO vo = new MessageVO();
        vo.setId(n.getId());
        vo.setBizType(n.getBizType());
        vo.setBizId(n.getBizId());
        vo.setTitle(n.getTitle());
        vo.setContent(n.getContent());
        vo.setChannel(n.getChannel());
        vo.setIsRead(Objects.equals(n.getIsRead(), 1));
        vo.setCreatedAt(n.getCreatedAt());
        return vo;
    }
}
