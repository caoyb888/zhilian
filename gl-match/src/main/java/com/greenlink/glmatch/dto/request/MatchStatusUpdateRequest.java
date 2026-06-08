package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class MatchStatusUpdateRequest {

    /** NEGOTIATE（进入洽谈）/ COMPLETE（标记完成）/ CANCEL（撤销） */
    @NotNull(message = "action 不能为空")
    @Pattern(regexp = "NEGOTIATE|COMPLETE|CANCEL", message = "action 必须为 NEGOTIATE、COMPLETE 或 CANCEL")
    private String action;
}
