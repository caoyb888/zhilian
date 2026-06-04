package com.greenlink.glmember.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("rbac_permission")
public class RbacPermission {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String name;
    /** 1菜单 2按钮 3数据 */
    private Integer type;
    private Long parentId;
    private Integer sortOrder;
    @TableLogic
    private Integer isDeleted;
}
