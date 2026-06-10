package com.greenlink.glmember.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmember.domain.MemberUnit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface MemberUnitMapper extends BaseMapper<MemberUnit> {

    /**
     * 统计正常会员（status=1）按行业分布，降序，最多取 TOP-20。
     * 供管理端看板行业饼图使用。
     */
    @Select("SELECT industry, COUNT(*) AS cnt " +
            "FROM member_unit " +
            "WHERE status = 1 AND is_deleted = 0 AND industry IS NOT NULL AND industry != '' " +
            "GROUP BY industry " +
            "ORDER BY cnt DESC " +
            "LIMIT 20")
    @Results({
            @Result(column = "industry", property = "industry"),
            @Result(column = "cnt",      property = "cnt")
    })
    List<Map<String, Object>> countByIndustry();
}
