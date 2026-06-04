package com.greenlink.glmember.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmember.domain.RbacPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RbacPermissionMapper extends BaseMapper<RbacPermission> {

    @Select("SELECT DISTINCT p.code FROM rbac_permission p " +
            "JOIN rbac_role_permission rp ON p.id = rp.permission_id " +
            "JOIN rbac_account_role ar ON rp.role_id = ar.role_id " +
            "WHERE ar.account_id = #{accountId} AND p.is_deleted = 0")
    List<String> findPermissionCodesByAccountId(@Param("accountId") Long accountId);
}
