package com.greenlink.glmatch.es;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

/** gl-supply 需求 ES 索引的只读视图，createIndex=false 确保 gl-match 不创建/修改该索引 */
@Data
@Document(indexName = "gl_supply_demand", createIndex = false)
public class SupplyDemandEsRef {

    @Id
    private Long id;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String summary;

    @Field(type = FieldType.Text)
    private String tagNames;

    @Field(type = FieldType.Keyword)
    private String province;

    @Field(type = FieldType.Integer)
    private Integer auditStatus;

    @Field(type = FieldType.Integer)
    private Integer isDeleted;
}
