package com.greenlink.glportal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.domain.PortalCategory;
import com.greenlink.glportal.dto.request.CreateCategoryRequest;
import com.greenlink.glportal.dto.request.UpdateCategoryRequest;
import com.greenlink.glportal.dto.response.CategoryVO;
import com.greenlink.glportal.repository.PortalCategoryMapper;
import com.greenlink.glportal.service.PortalCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortalCategoryServiceImpl implements PortalCategoryService {

    private final PortalCategoryMapper categoryMapper;

    @Override
    public List<CategoryVO> listTree() {
        List<PortalCategory> all = categoryMapper.selectList(
                new LambdaQueryWrapper<PortalCategory>().orderByAsc(PortalCategory::getSortOrder));

        Map<Long, List<CategoryVO>> childrenMap = all.stream()
                .filter(c -> c.getParentId() != null)
                .map(this::toVO)
                .collect(Collectors.groupingBy(CategoryVO::getParentId));

        return all.stream()
                .filter(c -> c.getParentId() == null)
                .map(c -> {
                    CategoryVO vo = toVO(c);
                    vo.setChildren(childrenMap.getOrDefault(c.getId(), List.of()));
                    return vo;
                })
                .toList();
    }

    @Override
    public CategoryVO getById(Long id) {
        PortalCategory cat = categoryMapper.selectById(id);
        if (cat == null) {
            throw new BizException(ResultCode.CATEGORY_NOT_FOUND);
        }
        return toVO(cat);
    }

    @Override
    @Transactional
    public CategoryVO create(CreateCategoryRequest request) {
        if (categoryMapper.findIdByCode(request.getCode()) != null) {
            throw new BizException(ResultCode.PARAM_ERROR, "栏目编码已存在: " + request.getCode());
        }
        if (request.getParentId() != null && categoryMapper.selectById(request.getParentId()) == null) {
            throw new BizException(ResultCode.CATEGORY_NOT_FOUND, "父栏目不存在");
        }
        PortalCategory cat = new PortalCategory();
        cat.setName(request.getName());
        cat.setCode(request.getCode().toUpperCase());
        cat.setParentId(request.getParentId());
        cat.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
        cat.setIsVisible(request.getIsVisible() == null || request.getIsVisible() ? 1 : 0);
        categoryMapper.insert(cat);
        log.info("创建门户栏目 id={} code={}", cat.getId(), cat.getCode());
        return toVO(cat);
    }

    @Override
    @Transactional
    public CategoryVO update(Long id, UpdateCategoryRequest request) {
        PortalCategory cat = categoryMapper.selectById(id);
        if (cat == null) {
            throw new BizException(ResultCode.CATEGORY_NOT_FOUND);
        }
        if (request.getName() != null) cat.setName(request.getName());
        if (request.getSortOrder() != null) cat.setSortOrder(request.getSortOrder());
        if (request.getIsVisible() != null) cat.setIsVisible(request.getIsVisible() ? 1 : 0);
        categoryMapper.updateById(cat);
        log.info("更新门户栏目 id={}", id);
        return toVO(cat);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PortalCategory cat = categoryMapper.selectById(id);
        if (cat == null) {
            throw new BizException(ResultCode.CATEGORY_NOT_FOUND);
        }
        if (categoryMapper.countChildren(id) > 0) {
            throw new BizException(ResultCode.PARAM_ERROR, "栏目下存在子栏目，请先删除子栏目");
        }
        categoryMapper.deleteById(id);
        log.info("删除门户栏目 id={}", id);
    }

    private CategoryVO toVO(PortalCategory cat) {
        CategoryVO vo = new CategoryVO();
        vo.setId(cat.getId());
        vo.setParentId(cat.getParentId());
        vo.setName(cat.getName());
        vo.setCode(cat.getCode());
        vo.setSortOrder(cat.getSortOrder());
        vo.setIsVisible(cat.getIsVisible() == 1);
        vo.setChildren(List.of());
        return vo;
    }
}
