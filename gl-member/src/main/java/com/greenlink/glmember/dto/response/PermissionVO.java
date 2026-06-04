package com.greenlink.glmember.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PermissionVO {

    private Long id;
    private String code;
    private String name;
    /** 1菜单 2按钮 */
    private Integer type;
    private Integer sortOrder;
    private List<PermissionVO> children;
}
