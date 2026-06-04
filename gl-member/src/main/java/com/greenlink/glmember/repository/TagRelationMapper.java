package com.greenlink.glmember.repository;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 业务标签关联（跨库 gl_common.tag_relation）
 * Sprint 1 直接访问公共库，Sprint 2 迁移至 gl-common 服务 API 调用
 */
@Mapper
public interface TagRelationMapper {

    @Select("<script>" +
            "SELECT t.id, t.name, tc.code as category_code " +
            "FROM gl_common.tag t " +
            "JOIN gl_common.tag_category tc ON t.category_id = tc.id " +
            "JOIN gl_common.tag_relation tr ON t.id = tr.tag_id " +
            "WHERE tr.biz_type = #{bizType} AND tr.biz_id = #{bizId} " +
            "AND t.is_deleted = 0 AND t.is_active = 1" +
            "</script>")
    List<TagVO> findTagsByBiz(@Param("bizType") String bizType, @Param("bizId") Long bizId);

    @Select("INSERT INTO gl_common.tag_relation (biz_type, biz_id, tag_id, created_at) " +
            "VALUES (#{bizType}, #{bizId}, #{tagId}, NOW()) " +
            "ON DUPLICATE KEY UPDATE created_at = created_at")
    void upsertTagRelation(@Param("bizType") String bizType,
                           @Param("bizId") Long bizId,
                           @Param("tagId") Long tagId);

    @Delete("DELETE FROM gl_common.tag_relation WHERE biz_type = #{bizType} AND biz_id = #{bizId}")
    void deleteByBiz(@Param("bizType") String bizType, @Param("bizId") Long bizId);

    record TagVO(Long id, String name, String categoryCode) {}
}
