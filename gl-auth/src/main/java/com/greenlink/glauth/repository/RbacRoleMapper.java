package com.greenlink.glauth.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glauth.domain.RbacRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RbacRoleMapper extends BaseMapper<RbacRole> {

    @Select("SELECT r.code FROM rbac_role r " +
            "JOIN rbac_account_role ar ON r.id = ar.role_id " +
            "WHERE ar.account_id = #{accountId} AND r.is_deleted = 0")
    List<String> findRoleCodesByAccountId(@Param("accountId") Long accountId);
}
