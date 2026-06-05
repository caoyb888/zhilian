package com.greenlink.glportal.dto.request;

import com.greenlink.glportal.enums.PublishMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateArticleRequest {

    @NotNull(message = "栏目ID不能为空")
    private Long categoryId;

    @NotBlank(message = "文章标题不能为空")
    @Size(max = 300)
    private String title;

    private String content;

    @Size(max = 500)
    private String summary;

    @Size(max = 500)
    private String coverUrl;

    @Size(max = 100)
    private String author;

    @Size(max = 500)
    private String sourceUrl;

    private Boolean isTop;

    @NotNull(message = "发布模式不能为空")
    private PublishMode publishMode;

    private LocalDateTime scheduledAt;
}
