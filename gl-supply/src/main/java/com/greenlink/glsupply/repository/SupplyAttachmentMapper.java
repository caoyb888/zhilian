package com.greenlink.glsupply.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glsupply.domain.SupplyAttachment;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SupplyAttachmentMapper extends BaseMapper<SupplyAttachment> {

    @Insert("<script>INSERT INTO supply_attachment " +
            "(biz_type, biz_id, file_name, file_url, file_size, file_type, sort_order) VALUES " +
            "<foreach collection='list' item='a' separator=','>" +
            "(#{a.bizType}, #{a.bizId}, #{a.fileName}, #{a.fileUrl}, #{a.fileSize}, #{a.fileType}, #{a.sortOrder})" +
            "</foreach></script>")
    void batchInsert(@Param("list") List<SupplyAttachment> list);
}
