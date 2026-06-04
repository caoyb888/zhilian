package com.greenlink.glmember.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmember.domain.RbacRolePermission;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RbacRolePermissionMapper extends BaseMapper<RbacRolePermission> {

    @Select("SELECT permission_id FROM rbac_role_permission WHERE role_id = #{roleId}")
    List<Long> findPermissionIdsByRoleId(@Param("roleId") Long roleId);

    @Delete("DELETE FROM rbac_role_permission WHERE role_id = #{roleId}")
    void deleteByRoleId(@Param("roleId") Long roleId);

    @Select("SELECT DISTINCT p.code FROM rbac_permission p " +
            "JOIN rbac_role_permission rp ON p.id = rp.permission_id " +
            "WHERE rp.role_id = #{roleId} AND p.is_deleted = 0")
    List<String> findPermissionCodesByRoleId(@Param("roleId") Long roleId);
}
