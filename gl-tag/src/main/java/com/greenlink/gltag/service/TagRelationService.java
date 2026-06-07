package com.greenlink.gltag.service;

import com.greenlink.gltag.dto.request.BatchSetTagRelationsRequest;
import com.greenlink.gltag.dto.response.TagSimpleVO;

import java.util.List;

public interface TagRelationService {

    List<TagSimpleVO> getTagsByBiz(String bizType, Long bizId);

    List<Long> getBizIdsByTag(Long tagId, String bizType);

    void batchSet(BatchSetTagRelationsRequest request);

    void deleteByBiz(String bizType, Long bizId);
}
