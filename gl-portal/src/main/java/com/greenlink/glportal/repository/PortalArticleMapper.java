package com.greenlink.glportal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glportal.domain.PortalArticle;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PortalArticleMapper extends BaseMapper<PortalArticle> {

    @Select("SELECT COUNT(1) FROM portal_article WHERE category_id = #{categoryId} AND is_deleted = 0")
    long countByCategory(Long categoryId);

    @Update("UPDATE portal_article SET view_count = view_count + #{delta} WHERE id = #{id} AND is_deleted = 0")
    void addViewCount(@Param("id") Long id, @Param("delta") long delta);

    @Update("UPDATE portal_article SET is_published = 1, published_at = NOW() " +
            "WHERE is_published = 0 AND published_at IS NOT NULL AND published_at <= NOW() AND is_deleted = 0")
    int publishScheduled();
}
