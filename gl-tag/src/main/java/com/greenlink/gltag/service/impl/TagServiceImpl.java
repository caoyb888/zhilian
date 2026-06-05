package com.greenlink.gltag.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.gltag.domain.Tag;
import com.greenlink.gltag.domain.TagCategory;
import com.greenlink.gltag.dto.request.CreateTagRequest;
import com.greenlink.gltag.dto.request.UpdateTagRequest;
import com.greenlink.gltag.dto.response.TagVO;
import com.greenlink.gltag.repository.TagCategoryMapper;
import com.greenlink.gltag.repository.TagMapper;
import com.greenlink.gltag.service.TagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import cn.hutool.core.util.StrUtil;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;
    private final TagCategoryMapper categoryMapper;

    @Override
    public Page<TagVO> list(Long categoryId, String keyword, int page, int size) {
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<Tag>()
                .eq(categoryId != null, Tag::getCategoryId, categoryId)
                .like(StrUtil.isNotBlank(keyword), Tag::getName, keyword)
                .orderByAsc(Tag::getSortOrder);

        Page<Tag> tagPage = tagMapper.selectPage(new Page<>(page, size), wrapper);

        Page<TagVO> voPage = new Page<>(tagPage.getCurrent(), tagPage.getSize(), tagPage.getTotal());
        voPage.setRecords(tagPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    public TagVO getById(Long id) {
        Tag tag = tagMapper.selectById(id);
        if (tag == null) {
            throw new BizException(ResultCode.NOT_FOUND, "标签不存在");
        }
        return toVO(tag);
    }

    @Override
    @Transactional
    public TagVO create(CreateTagRequest request) {
        TagCategory category = categoryMapper.selectById(request.getCategoryId());
        if (category == null) {
            throw new BizException(ResultCode.NOT_FOUND, "标签分类不存在");
        }
        if (tagMapper.findIdByNameAndCategory(request.getName(), request.getCategoryId()) != null) {
            throw new BizException(ResultCode.PARAM_ERROR, "同分类下标签名称已存在");
        }
        Tag tag = new Tag();
        tag.setCategoryId(request.getCategoryId());
        tag.setName(request.getName());
        tag.setAlias(request.getAlias());
        tag.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
        tag.setIsActive(1);
        tag.setIsDeleted(0);
        tagMapper.insert(tag);
        log.info("创建标签 id={} name={} categoryId={}", tag.getId(), tag.getName(), tag.getCategoryId());
        return toVO(tag, category.getCode());
    }

    @Override
    @Transactional
    public TagVO update(Long id, UpdateTagRequest request) {
        Tag tag = tagMapper.selectById(id);
        if (tag == null) {
            throw new BizException(ResultCode.NOT_FOUND, "标签不存在");
        }
        if (StrUtil.isNotBlank(request.getName())) {
            Long existId = tagMapper.findIdByNameAndCategory(request.getName(), tag.getCategoryId());
            if (existId != null && !existId.equals(id)) {
                throw new BizException(ResultCode.PARAM_ERROR, "同分类下标签名称已存在");
            }
            tag.setName(request.getName());
        }
        if (request.getAlias() != null) tag.setAlias(request.getAlias());
        if (request.getSortOrder() != null) tag.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) tag.setIsActive(request.getIsActive());
        tagMapper.updateById(tag);
        return toVO(tag);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Tag tag = tagMapper.selectById(id);
        if (tag == null) {
            throw new BizException(ResultCode.NOT_FOUND, "标签不存在");
        }
        tagMapper.deleteById(id);
        log.info("删除标签 id={}", id);
    }

    private TagVO toVO(Tag tag) {
        TagCategory cat = categoryMapper.selectById(tag.getCategoryId());
        return toVO(tag, cat != null ? cat.getCode() : null);
    }

    private TagVO toVO(Tag tag, String categoryCode) {
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
