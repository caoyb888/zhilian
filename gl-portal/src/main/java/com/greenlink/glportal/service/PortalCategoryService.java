package com.greenlink.glportal.service;

import com.greenlink.glportal.dto.request.CreateCategoryRequest;
import com.greenlink.glportal.dto.request.UpdateCategoryRequest;
import com.greenlink.glportal.dto.response.CategoryVO;

import java.util.List;

public interface PortalCategoryService {

    List<CategoryVO> listTree();

    CategoryVO getById(Long id);

    CategoryVO create(CreateCategoryRequest request);

    CategoryVO update(Long id, UpdateCategoryRequest request);

    void delete(Long id);
}
