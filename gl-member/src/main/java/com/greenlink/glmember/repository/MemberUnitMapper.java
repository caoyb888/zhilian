package com.greenlink.glmember.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glmember.domain.MemberUnit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MemberUnitMapper extends BaseMapper<MemberUnit> {

    @Select("<script>" +
            "SELECT id, name, short_name, industry, province, city, member_level, " +
            "logo_url, is_certified, status, created_at, updated_at " +
            "FROM member_unit " +
            "WHERE is_deleted = 0 " +
            "<if test='keyword != null and keyword != \"\"'>" +
            "  AND name LIKE CONCAT('%', #{keyword}, '%') " +
            "</if>" +
            "<if test='industry != null and industry != \"\"'>" +
            "  AND industry = #{industry} " +
            "</if>" +
            "<if test='province != null and province != \"\"'>" +
            "  AND province = #{province} " +
            "</if>" +
            "<if test='memberLevel != null'>" +
            "  AND member_level = #{memberLevel} " +
            "</if>" +
            "<if test='status != null'>" +
            "  AND status = #{status} " +
            "</if>" +
            "ORDER BY created_at DESC" +
            "</script>")
    IPage<MemberUnit> pageList(Page<MemberUnit> page,
                               @Param("keyword") String keyword,
                               @Param("industry") String industry,
                               @Param("province") String province,
                               @Param("memberLevel") Integer memberLevel,
                               @Param("status") Integer status);
}
