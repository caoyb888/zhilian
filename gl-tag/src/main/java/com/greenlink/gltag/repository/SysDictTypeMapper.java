package com.greenlink.gltag.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.gltag.domain.SysDictType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysDictTypeMapper extends BaseMapper<SysDictType> {

    @Select("SELECT id FROM sys_dict_type WHERE code = #{code} AND is_deleted = 0 LIMIT 1")
    Long findIdByCode(String code);
}
