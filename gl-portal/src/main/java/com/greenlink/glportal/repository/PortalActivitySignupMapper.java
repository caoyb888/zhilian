package com.greenlink.glportal.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glportal.domain.PortalActivitySignup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PortalActivitySignupMapper extends BaseMapper<PortalActivitySignup> {

    @Select("SELECT COUNT(1) FROM portal_activity_signup " +
            "WHERE activity_id = #{activityId} AND account_id = #{accountId} AND status != 3")
    long countByActivityAndAccount(@Param("activityId") Long activityId,
                                   @Param("accountId") Long accountId);

    @Select("SELECT id FROM portal_activity_signup " +
            "WHERE activity_id = #{activityId} AND account_id = #{accountId} LIMIT 1")
    Long findIdByActivityAndAccount(@Param("activityId") Long activityId,
                                    @Param("accountId") Long accountId);
}
