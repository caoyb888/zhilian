package com.greenlink.gltag.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.gltag.domain.Tag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface TagMapper extends BaseMapper<Tag> {

    @Select("SELECT id FROM tag WHERE name = #{name} AND category_id = #{categoryId} AND is_deleted = 0 LIMIT 1")
    Long findIdByNameAndCategory(String name, Long categoryId);
}
