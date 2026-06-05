package com.greenlink.glportal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glportal.domain.PortalCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PortalCategoryMapper extends BaseMapper<PortalCategory> {

    @Select("SELECT id FROM portal_category WHERE code = #{code} LIMIT 1")
    Long findIdByCode(String code);

    @Select("SELECT COUNT(1) FROM portal_category WHERE parent_id = #{parentId}")
    long countChildren(Long parentId);
}
