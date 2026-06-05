package com.greenlink.glportal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glportal.domain.PortalActivity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PortalActivityMapper extends BaseMapper<PortalActivity> {

    /**
     * 原子递增 reg_count，仅在容量未满时执行；无限容量（max_capacity IS NULL）无条件递增。
     * 返回受影响行数：0 表示已满，1 表示成功。
     */
    @Update("UPDATE portal_activity SET reg_count = reg_count + 1 " +
            "WHERE id = #{id} AND is_deleted = 0 " +
            "AND (max_capacity IS NULL OR reg_count < max_capacity)")
    int incrementRegCount(@Param("id") Long id);

    @Update("UPDATE portal_activity SET reg_count = GREATEST(0, reg_count - 1) " +
            "WHERE id = #{id} AND is_deleted = 0")
    void decrementRegCount(@Param("id") Long id);
}
