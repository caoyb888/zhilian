package com.greenlink.glauth.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glauth.domain.MemberLoginLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MemberLoginLogMapper extends BaseMapper<MemberLoginLog> {
}
