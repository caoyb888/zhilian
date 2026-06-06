package com.greenlink.gltag.service;

import com.greenlink.gltag.dto.request.CreateTagCategoryRequest;
import com.greenlink.gltag.dto.request.UpdateTagCategoryRequest;
import com.greenlink.gltag.dto.response.TagCategoryVO;

import java.util.List;

public interface TagCategoryService {

    List<TagCategoryVO> listAll();

    TagCategoryVO create(CreateTagCategoryRequest request);

    TagCategoryVO update(Long id, UpdateTagCategoryRequest request);

    void delete(Long id);
}
