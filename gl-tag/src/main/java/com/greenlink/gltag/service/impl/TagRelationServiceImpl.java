package com.greenlink.gltag.service.impl;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.gltag.domain.TagRelation;
import com.greenlink.gltag.dto.request.BatchSetTagRelationsRequest;
import com.greenlink.gltag.dto.response.TagSimpleVO;
import com.greenlink.gltag.repository.TagMapper;
import com.greenlink.gltag.repository.TagRelationMapper;
import com.greenlink.gltag.service.TagRelationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagRelationServiceImpl implements TagRelationService {

    private final TagRelationMapper tagRelationMapper;
    private final TagMapper tagMapper;

    @Override
    public List<TagSimpleVO> getTagsByBiz(String bizType, Long bizId) {
        return tagRelationMapper.findTagsByBiz(bizType, bizId);
    }

    @Override
    public List<Long> getBizIdsByTag(Long tagId, String bizType) {
        return tagRelationMapper.findBizIdsByTag(tagId, bizType);
    }

    @Override
    @Transactional
    public void batchSet(BatchSetTagRelationsRequest request) {
        tagRelationMapper.deleteByBiz(request.getBizType(), request.getBizId());

        if (CollectionUtils.isEmpty(request.getTagIds())) {
            return;
        }

        for (Long tagId : request.getTagIds()) {
            if (tagMapper.selectById(tagId) == null) {
                throw new BizException(ResultCode.NOT_FOUND, "标签不存在: " + tagId);
            }
            TagRelation relation = new TagRelation();
            relation.setBizType(request.getBizType());
            relation.setBizId(request.getBizId());
            relation.setTagId(tagId);
            relation.setCreatedAt(LocalDateTime.now());
            tagRelationMapper.insert(relation);
        }
        log.info("批量设置标签关联 bizType={} bizId={} tagCount={}",
                request.getBizType(), request.getBizId(), request.getTagIds().size());
    }

    @Override
    @Transactional
    public void deleteByBiz(String bizType, Long bizId) {
        int deleted = tagRelationMapper.deleteByBiz(bizType, bizId);
        log.info("删除业务标签关联 bizType={} bizId={} count={}", bizType, bizId, deleted);
    }
}
