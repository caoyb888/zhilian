package com.greenlink.glmatch.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.greenlink.glmatch.domain.MatchMessage;
import com.greenlink.glmatch.dto.MatchUnreadCount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MatchMessageMapper extends BaseMapper<MatchMessage> {

    /**
     * 批量查询各 match 中对当前账号的未读消息数。
     * 未读条件：is_read=0 且 sender_id != accountId（排除自己发出的消息）。
     */
    @Select("<script>" +
            "SELECT match_id AS matchId, COUNT(*) AS cnt " +
            "FROM match_message " +
            "WHERE match_id IN " +
            "<foreach item='id' collection='matchIds' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND sender_id != #{accountId} " +
            " AND is_read = 0 " +
            "GROUP BY match_id" +
            "</script>")
    @Results({
            @Result(column = "matchId", property = "matchId"),
            @Result(column = "cnt",     property = "cnt")
    })
    List<MatchUnreadCount> countUnreadByMatchIds(@Param("accountId") Long accountId,
                                                  @Param("matchIds") List<Long> matchIds);
}
