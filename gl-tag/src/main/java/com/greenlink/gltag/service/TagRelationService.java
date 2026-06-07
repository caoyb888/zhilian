package com.greenlink.gltag.service;

import com.greenlink.gltag.dto.request.BatchSetTagRelationsRequest;
import com.greenlink.gltag.dto.response.TagSimpleVO;

import java.util.List;
import java.util.Map;

public interface TagRelationService {

    List<TagSimpleVO> getTagsByBiz(String bizType, Long bizId);

    List<Long> getBizIdsByTag(Long tagId, String bizType);

    /** 批量查询多个 tagId 的 bizId 列表，返回 tagId → bizIds 映射 */
    Map<Long, List<Long>> getBizIdsByTagsBatch(List<Long> tagIds, String bizType);

    void batchSet(BatchSetTagRelationsRequest request);

    void deleteByBiz(String bizType, Long bizId);
}
