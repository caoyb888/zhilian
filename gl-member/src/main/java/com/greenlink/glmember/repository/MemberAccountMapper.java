package com.greenlink.glmember.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glmember.domain.MemberAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MemberAccountMapper extends BaseMapper<MemberAccount> {

    @Select("SELECT id, member_id, parent_id, username, phone, email, real_name, " +
            "avatar_url, status, is_deleted, last_login_at, created_at, updated_at " +
            "FROM member_account WHERE username = #{username} AND is_deleted = 0 LIMIT 1")
    MemberAccount findByUsername(@Param("username") String username);

    @Select("SELECT id, member_id, parent_id, username, phone, email, real_name, " +
            "avatar_url, status, is_deleted, last_login_at, created_at, updated_at " +
            "FROM member_account WHERE phone = #{phone} AND is_deleted = 0 LIMIT 1")
    MemberAccount findByPhone(@Param("phone") String phone);

    @Select("SELECT id, member_id, parent_id, username, phone, email, real_name, " +
            "avatar_url, status, is_deleted, last_login_at, created_at, updated_at " +
            "FROM member_account WHERE member_id = #{memberId} AND parent_id IS NULL AND is_deleted = 0 LIMIT 1")
    MemberAccount findMainAccountByMemberId(@Param("memberId") Long memberId);

    @Select("SELECT id, member_id, parent_id, username, phone, email, real_name, " +
            "avatar_url, status, is_deleted, last_login_at, created_at, updated_at " +
            "FROM member_account WHERE member_id = #{memberId} AND parent_id IS NOT NULL AND is_deleted = 0")
    List<MemberAccount> findSubAccountsByMemberId(@Param("memberId") Long memberId);

    @Select("<script>" +
            "SELECT id, member_id, parent_id, username, phone, email, real_name, " +
            "avatar_url, status, last_login_at, created_at, updated_at " +
            "FROM member_account WHERE is_deleted = 0" +
            "<if test='memberId != null'> AND member_id = #{memberId}</if>" +
            "<if test='status != null'> AND status = #{status}</if>" +
            "<if test='keyword != null and keyword != \"\"'> AND (username LIKE CONCAT('%',#{keyword},'%') OR real_name LIKE CONCAT('%',#{keyword},'%'))</if>" +
            " ORDER BY created_at DESC" +
            "</script>")
    IPage<MemberAccount> pageAllAccounts(Page<MemberAccount> page,
                                         @Param("memberId") Long memberId,
                                         @Param("status") Integer status,
                                         @Param("keyword") String keyword);
}
