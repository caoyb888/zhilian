package com.greenlink.glauth.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("member_unit")
public class MemberUnit {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String shortName;
    /** 1普通 2VIP 3理事 */
    private Integer memberLevel;
    private Integer status;
    @TableLogic
    private Integer isDeleted;
}
