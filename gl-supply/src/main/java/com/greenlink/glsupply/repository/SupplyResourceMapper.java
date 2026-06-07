package com.greenlink.glsupply.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glsupply.domain.SupplyResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SupplyResourceMapper extends BaseMapper<SupplyResource> {

    @Update("UPDATE supply_resource SET view_count = view_count + #{delta} WHERE id = #{id} AND is_deleted = 0")
    void incrementViewCount(@Param("id") Long id, @Param("delta") long delta);
}
