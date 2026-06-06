package com.greenlink.glfile.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glfile.domain.FileRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FileRecordMapper extends BaseMapper<FileRecord> {
}
