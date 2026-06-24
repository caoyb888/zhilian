package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 批量对接申请（UAT#13，1 对 N）。
 * 两种用法二选一：
 * - 以资源对接多个需求：resourceId + demandIds
 * - 以需求对接多个资源：demandId + resourceIds
 */
@Data
public class BatchMatchApplyRequest {

    /** 固定资源（用资源对接多个需求时） */
    private Long resourceId;
    /** 多个需求 */
    private List<Long> demandIds;

    /** 固定需求（用需求对接多个资源时） */
    private Long demandId;
    /** 多个资源 */
    private List<Long> resourceIds;

    @Size(max = 1000, message = "申请留言不超过 1000 字")
    private String applyMessage;
}
