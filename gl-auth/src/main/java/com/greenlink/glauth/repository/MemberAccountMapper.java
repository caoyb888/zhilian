package com.greenlink.glauth.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glauth.domain.MemberAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MemberAccountMapper extends BaseMapper<MemberAccount> {

    @Select("SELECT id, member_id, parent_id, username, password_hash, phone, email, " +
            "real_name, avatar_url, openid, fail_count, locked_until, " +
            "last_login_at, last_login_ip, status, is_deleted, created_at, updated_at " +
            "FROM member_account WHERE username = #{username} AND is_deleted = 0 LIMIT 1")
    MemberAccount findByUsername(@Param("username") String username);

    @Select("SELECT id, member_id, parent_id, username, password_hash, phone, email, " +
            "real_name, avatar_url, openid, fail_count, locked_until, " +
            "last_login_at, last_login_ip, status, is_deleted, created_at, updated_at " +
            "FROM member_account WHERE phone = #{phone} AND is_deleted = 0 LIMIT 1")
    MemberAccount findByPhone(@Param("phone") String phone);

    @Select("SELECT id, member_id, parent_id, username, password_hash, phone, email, " +
            "real_name, avatar_url, openid, fail_count, locked_until, " +
            "last_login_at, last_login_ip, status, is_deleted, created_at, updated_at " +
            "FROM member_account WHERE openid = #{openid} AND is_deleted = 0 LIMIT 1")
    MemberAccount findByOpenid(@Param("openid") String openid);
}
