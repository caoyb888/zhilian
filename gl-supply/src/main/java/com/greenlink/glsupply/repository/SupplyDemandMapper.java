package com.greenlink.glsupply.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glsupply.domain.SupplyDemand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

@Mapper
public interface SupplyDemandMapper extends BaseMapper<SupplyDemand> {

    @Update("UPDATE supply_demand SET view_count = view_count + #{delta} WHERE id = #{id} AND is_deleted = 0")
    void incrementViewCount(@Param("id") Long id, @Param("delta") long delta);

    /**
     * 按天统计近 N 天内审核完成（通过/拒绝）的需求数量。
     */
    @Select("SELECT DATE_FORMAT(audited_at, '%Y-%m-%d') AS auditDate, COUNT(*) AS cnt " +
            "FROM supply_demand " +
            "WHERE audited_at >= #{startDate} " +
            "  AND audited_at < DATE_ADD(#{endDate}, INTERVAL 1 DAY) " +
            "  AND audit_status IN (1, 2) " +
            "  AND is_deleted = 0 " +
            "GROUP BY DATE_FORMAT(audited_at, '%Y-%m-%d')")
    @Results({
            @Result(column = "auditDate", property = "auditDate"),
            @Result(column = "cnt",       property = "cnt")
    })
    List<Map<String, Object>> countAuditedByDay(@Param("startDate") String startDate,
                                                 @Param("endDate")   String endDate);
}
