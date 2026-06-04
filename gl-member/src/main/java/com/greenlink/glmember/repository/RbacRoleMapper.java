package com.greenlink.glmember.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmember.domain.RbacRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RbacRoleMapper extends BaseMapper<RbacRole> {

    @Select("SELECT r.id, r.code, r.name, r.description, r.is_system " +
            "FROM rbac_role r " +
            "JOIN rbac_account_role ar ON r.id = ar.role_id " +
            "WHERE ar.account_id = #{accountId} AND r.is_deleted = 0")
    List<RbacRole> findRolesByAccountId(@Param("accountId") Long accountId);

    @Select("SELECT r.code FROM rbac_role r " +
            "JOIN rbac_account_role ar ON r.id = ar.role_id " +
            "WHERE ar.account_id = #{accountId} AND r.is_deleted = 0")
    List<String> findRoleCodesByAccountId(@Param("accountId") Long accountId);

    @Select("SELECT id FROM rbac_role WHERE code = #{code} AND is_deleted = 0 LIMIT 1")
    Long findIdByCode(@Param("code") String code);
}
