package com.greenlink.glmatch.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.MemberCompletedCount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
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
     * 批量查询：给定资源 ID 与若干需求 ID，返回已存在对接记录的需求 ID 集合。
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

    /**
     * 批量查询：给定需求 ID 与若干资源 ID，返回已存在对接记录的资源 ID 集合。
     * 用于 DEMAND→RESOURCE 方向推荐时过滤已对接记录。
     */
    @Select("<script>" +
            "SELECT resource_id FROM match_record " +
            "WHERE demand_id = #{demandId} " +
            "AND resource_id IN " +
            "<foreach item='id' collection='resourceIds' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND status IN (1,2,3,5) AND is_deleted = 0" +
            "</script>")
    Set<Long> findMatchedResourceIds(@Param("demandId") Long demandId,
                                      @Param("resourceIds") List<Long> resourceIds);

    /**
     * 统计各会员作为资源方已完成的对接次数（status=5）。
     * 供历史对接信用打分（上限 10 分）使用。
     */
    @Select("<script>" +
            "SELECT resource_member_id AS memberId, COUNT(*) AS cnt " +
            "FROM match_record " +
            "WHERE resource_member_id IN " +
            "<foreach item='id' collection='memberIds' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND status = 5 AND is_deleted = 0 " +
            "GROUP BY resource_member_id" +
            "</script>")
    @Results({
            @Result(column = "memberId", property = "memberId"),
            @Result(column = "cnt", property = "cnt")
    })
    List<MemberCompletedCount> countCompletedByResourceMemberIds(@Param("memberIds") List<Long> memberIds);

    /**
     * 统计各会员作为需求方已完成的对接次数（status=5）。
     */
    @Select("<script>" +
            "SELECT demand_member_id AS memberId, COUNT(*) AS cnt " +
            "FROM match_record " +
            "WHERE demand_member_id IN " +
            "<foreach item='id' collection='memberIds' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND status = 5 AND is_deleted = 0 " +
            "GROUP BY demand_member_id" +
            "</script>")
    @Results({
            @Result(column = "memberId", property = "memberId"),
            @Result(column = "cnt", property = "cnt")
    })
    List<MemberCompletedCount> countCompletedByDemandMemberIds(@Param("memberIds") List<Long> memberIds);
}
