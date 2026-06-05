package com.greenlink.gltag.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.gltag.dto.request.CreateTagRequest;
import com.greenlink.gltag.dto.request.UpdateTagRequest;
import com.greenlink.gltag.dto.response.TagVO;

public interface TagService {

    Page<TagVO> list(Long categoryId, String keyword, int page, int size);

    TagVO getById(Long id);

    TagVO create(CreateTagRequest request);

    TagVO update(Long id, UpdateTagRequest request);

    void delete(Long id);
}
