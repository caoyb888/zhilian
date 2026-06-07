package com.greenlink.glsupply.es;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

@Data
@Document(indexName = "gl_supply_resource", createIndex = false)
@Setting(settingPath = "/es/supply-resource-settings.json")
public class ResourceEsDoc {

    @Id
    private Long id;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String summary;

    /** 标签名称拼接，供全文匹配召回（S5-02 BM25） */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String tagNames;

    @Field(type = FieldType.Keyword)
    private String type;

    @Field(type = FieldType.Keyword)
    private String province;

    @Field(type = FieldType.Integer)
    private Integer auditStatus;

    @Field(type = FieldType.Integer)
    private Integer isDeleted;
}
