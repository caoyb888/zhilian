package com.greenlink.gltag.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.gltag.domain.TagCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface TagCategoryMapper extends BaseMapper<TagCategory> {

    @Select("SELECT id FROM tag_category WHERE code = #{code} LIMIT 1")
    Long findIdByCode(String code);
}
