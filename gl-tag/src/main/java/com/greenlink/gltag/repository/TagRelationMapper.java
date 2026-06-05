package com.greenlink.gltag.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.gltag.domain.TagRelation;
import com.greenlink.gltag.dto.response.TagSimpleVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TagRelationMapper extends BaseMapper<TagRelation> {

    @Select("SELECT t.id, t.name, tc.code AS categoryCode " +
            "FROM tag t " +
            "JOIN tag_category tc ON t.category_id = tc.id " +
            "JOIN tag_relation tr ON t.id = tr.tag_id " +
            "WHERE tr.biz_type = #{bizType} AND tr.biz_id = #{bizId} " +
            "AND t.is_deleted = 0 AND t.is_active = 1")
    List<TagSimpleVO> findTagsByBiz(@Param("bizType") String bizType, @Param("bizId") Long bizId);

    @Delete("DELETE FROM tag_relation WHERE biz_type = #{bizType} AND biz_id = #{bizId}")
    int deleteByBiz(@Param("bizType") String bizType, @Param("bizId") Long bizId);
}
