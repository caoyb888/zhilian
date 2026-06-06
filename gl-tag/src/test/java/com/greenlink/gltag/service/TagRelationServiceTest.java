package com.greenlink.gltag.service;

import com.greenlink.common.exception.BizException;
import com.greenlink.gltag.domain.Tag;
import com.greenlink.gltag.domain.TagRelation;
import com.greenlink.gltag.dto.request.BatchSetTagRelationsRequest;
import com.greenlink.gltag.dto.response.TagSimpleVO;
import com.greenlink.gltag.repository.TagMapper;
import com.greenlink.gltag.repository.TagRelationMapper;
import com.greenlink.gltag.service.impl.TagRelationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagRelationServiceTest {

    @Mock TagRelationMapper tagRelationMapper;
    @Mock TagMapper tagMapper;

    @InjectMocks TagRelationServiceImpl service;

    @Test
    void getTagsByBiz_returnsList() {
        TagSimpleVO vo = new TagSimpleVO();
        vo.setId(1L);
        vo.setName("新能源");
        vo.setCategoryCode("INDUSTRY");
        when(tagRelationMapper.findTagsByBiz("MEMBER", 10L)).thenReturn(List.of(vo));

        List<TagSimpleVO> result = service.getTagsByBiz("MEMBER", 10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("新能源");
    }

    @Test
    void batchSet_success() {
        Tag tag1 = new Tag(); tag1.setId(1L); tag1.setIsDeleted(0);
        Tag tag2 = new Tag(); tag2.setId(2L); tag2.setIsDeleted(0);
        when(tagMapper.selectById(1L)).thenReturn(tag1);
        when(tagMapper.selectById(2L)).thenReturn(tag2);
        when(tagRelationMapper.deleteByBiz("MEMBER", 10L)).thenReturn(2);

        BatchSetTagRelationsRequest req = new BatchSetTagRelationsRequest();
        req.setBizType("MEMBER");
        req.setBizId(10L);
        req.setTagIds(List.of(1L, 2L));

        service.batchSet(req);

        // 验证先清空再逐条写入的核心流程
        verify(tagRelationMapper).deleteByBiz("MEMBER", 10L);
        verify(tagMapper, times(2)).selectById(anyLong());
    }

    @Test
    void batchSet_emptyTagIds_onlyDeletes() {
        when(tagRelationMapper.deleteByBiz("MEMBER", 10L)).thenReturn(3);

        BatchSetTagRelationsRequest req = new BatchSetTagRelationsRequest();
        req.setBizType("MEMBER");
        req.setBizId(10L);
        req.setTagIds(List.of());

        service.batchSet(req);

        verify(tagRelationMapper).deleteByBiz("MEMBER", 10L);
        verifyNoMoreInteractions(tagMapper);
    }

    @Test
    void batchSet_invalidTagId_throwsBizException() {
        when(tagRelationMapper.deleteByBiz(anyString(), anyLong())).thenReturn(0);
        when(tagMapper.selectById(99L)).thenReturn(null);

        BatchSetTagRelationsRequest req = new BatchSetTagRelationsRequest();
        req.setBizType("MEMBER");
        req.setBizId(10L);
        req.setTagIds(List.of(99L));

        assertThatThrownBy(() -> service.batchSet(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("标签不存在");
    }

    @Test
    void deleteByBiz_success() {
        when(tagRelationMapper.deleteByBiz("RESOURCE", 5L)).thenReturn(3);

        service.deleteByBiz("RESOURCE", 5L);

        verify(tagRelationMapper).deleteByBiz("RESOURCE", 5L);
    }
}
