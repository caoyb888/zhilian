package com.greenlink.glmatch.service;

import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.response.MatchRecordItemVO;

public interface MatchRecordListService {

    /**
     * 查询我的对接记录列表（双向：我是资源方或需求方均纳入）。
     *
     * @param accountId 当前账号 ID（用于未读数计算）
     * @param memberId  当前会员 ID（用于双向过滤）
     * @param status    状态筛选，null 表示不过滤
     * @param page      页码（从 1 开始）
     * @param size      每页条数（最大 50）
     */
    PageResult<MatchRecordItemVO> listMyRecords(Long accountId, Long memberId,
                                                Integer status, int page, int size);
}
