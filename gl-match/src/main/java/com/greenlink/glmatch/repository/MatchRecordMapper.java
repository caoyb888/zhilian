package com.greenlink.glmatch.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmatch.domain.MatchRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Set;

@Mapper
public interface MatchRecordMapper extends BaseMapper<MatchRecord> {

    /**
     * 查询某资源已发起/接受对接的需求 ID 集合（排除已撤销/拒绝状态）。
     * 用于推荐时过滤已有对接记录（status: 1待响应 2已接受 3洽谈中 5已完成）。
     */
    @Select("<script>" +
            "SELECT demand_id FROM match_record " +
            "WHERE resource_id = #{resourceId} " +
            "AND status IN (1,2,3,5) " +
            "AND is_deleted = 0" +
            "</script>")
    List<Long> findActiveDemandIdsByResource(@Param("resourceId") Long resourceId);

    /**
     * 查询某需求已发起/接受对接的资源 ID 集合（排除已撤销/拒绝状态）。
     */
    @Select("<script>" +
            "SELECT resource_id FROM match_record " +
            "WHERE demand_id = #{demandId} " +
            "AND status IN (1,2,3,5) " +
            "AND is_deleted = 0" +
            "</script>")
    List<Long> findActiveResourceIdsByDemand(@Param("demandId") Long demandId);

    /**
     * 批量查询：给定资源 ID 与若干需求 ID，返回已存在对接记录的需求 ID 列表。
     */
    @Select("<script>" +
            "SELECT demand_id FROM match_record " +
            "WHERE resource_id = #{resourceId} " +
            "AND demand_id IN " +
            "<foreach item='id' collection='demandIds' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND status IN (1,2,3,5) AND is_deleted = 0" +
            "</script>")
    Set<Long> findMatchedDemandIds(@Param("resourceId") Long resourceId,
                                    @Param("demandIds") List<Long> demandIds);
}
