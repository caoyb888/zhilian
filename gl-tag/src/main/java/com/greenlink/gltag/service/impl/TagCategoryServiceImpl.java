package com.greenlink.gltag.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.gltag.domain.Tag;
import com.greenlink.gltag.domain.TagCategory;
import com.greenlink.gltag.dto.request.CreateTagCategoryRequest;
import com.greenlink.gltag.dto.request.UpdateTagCategoryRequest;
import com.greenlink.gltag.dto.response.TagCategoryVO;
import com.greenlink.gltag.dto.response.TagVO;
import com.greenlink.gltag.repository.TagCategoryMapper;
import com.greenlink.gltag.repository.TagMapper;
import com.greenlink.gltag.service.TagCategoryService;
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
public class TagCategoryServiceImpl implements TagCategoryService {

    private final TagCategoryMapper categoryMapper;
    private final TagMapper tagMapper;

    @Override
    public List<TagCategoryVO> listAll() {
        List<TagCategory> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<TagCategory>().orderByAsc(TagCategory::getSortOrder));

        List<Tag> allTags = tagMapper.selectList(
                new LambdaQueryWrapper<Tag>()
                        .eq(Tag::getIsActive, 1)
                        .orderByAsc(Tag::getSortOrder));

        Map<Long, List<Tag>> tagsByCat = allTags.stream()
                .collect(Collectors.groupingBy(Tag::getCategoryId));

        return categories.stream()
                .map(cat -> toVO(cat, tagsByCat.getOrDefault(cat.getId(), List.of())))
                .toList();
    }

    @Override
    @Transactional
    public TagCategoryVO create(CreateTagCategoryRequest request) {
        if (categoryMapper.findIdByCode(request.getCode()) != null) {
            throw new BizException(ResultCode.PARAM_ERROR, "分类编码已存在: " + request.getCode());
        }
        TagCategory cat = new TagCategory();
        cat.setName(request.getName());
        cat.setCode(request.getCode().toUpperCase());
        cat.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
        cat.setIsActive(1);
        categoryMapper.insert(cat);
        log.info("创建标签分类 id={} code={}", cat.getId(), cat.getCode());
        return toVO(cat, List.of());
    }

    @Override
    @Transactional
    public TagCategoryVO update(Long id, UpdateTagCategoryRequest request) {
        TagCategory cat = categoryMapper.selectById(id);
        if (cat == null) {
            throw new BizException(ResultCode.NOT_FOUND, "标签分类不存在");
        }
        if (request.getName() != null) cat.setName(request.getName());
        if (request.getSortOrder() != null) cat.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) cat.setIsActive(request.getIsActive());
        categoryMapper.updateById(cat);
        return toVO(cat, List.of());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TagCategory cat = categoryMapper.selectById(id);
        if (cat == null) {
            throw new BizException(ResultCode.NOT_FOUND, "标签分类不存在");
        }
        long tagCount = tagMapper.selectCount(
                new LambdaQueryWrapper<Tag>().eq(Tag::getCategoryId, id));
        if (tagCount > 0) {
            throw new BizException(ResultCode.PARAM_ERROR, "分类下存在标签，请先删除标签");
        }
        categoryMapper.deleteById(id);
        log.info("删除标签分类 id={}", id);
    }

    private TagCategoryVO toVO(TagCategory cat, List<Tag> tags) {
        TagCategoryVO vo = new TagCategoryVO();
        vo.setId(cat.getId());
        vo.setName(cat.getName());
        vo.setCode(cat.getCode());
        vo.setSortOrder(cat.getSortOrder());
        vo.setIsActive(cat.getIsActive() == 1);
        vo.setTags(tags.stream().map(t -> toTagVO(t, cat.getCode())).toList());
        return vo;
    }

    private TagVO toTagVO(Tag tag, String categoryCode) {
        TagVO vo = new TagVO();
        vo.setId(tag.getId());
        vo.setCategoryId(tag.getCategoryId());
        vo.setCategoryCode(categoryCode);
        vo.setName(tag.getName());
        vo.setAlias(tag.getAlias());
        vo.setSortOrder(tag.getSortOrder());
        vo.setIsActive(tag.getIsActive() == 1);
        return vo;
    }
}
