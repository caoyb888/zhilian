package com.greenlink.glsupply.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glsupply.domain.SupplyAttachment;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.dto.request.AttachmentDTO;
import com.greenlink.glsupply.dto.request.CreateResourceRequest;
import com.greenlink.glsupply.dto.request.ResourcePageRequest;
import com.greenlink.glsupply.dto.request.UpdateResourceRequest;
import com.greenlink.glsupply.dto.response.ResourceDetailVO;
import com.greenlink.glsupply.dto.response.ResourceVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.repository.SupplyAttachmentMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import com.greenlink.glsupply.service.impl.SupplyResourceServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * S4-01 单元测试：资源发布 CRUD 核心场景
 */
@ExtendWith(MockitoExtension.class)
class SupplyResourceServiceTest {

    @Mock
    SupplyResourceMapper resourceMapper;
    @Mock
    SupplyAttachmentMapper attachmentMapper;

    @InjectMocks
    SupplyResourceServiceImpl service;

    // ─────────────────────────────────────────────
    // TC-01  创建资源 — 正常流程
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 创建资源：正常提交，状态为待审核，附件写入")
    void create_success_withAttachments() {
        doAnswer(inv -> {
            SupplyResource r = inv.getArgument(0);
            r.setId(1L);
            return 1;
        }).when(resourceMapper).insert(any(SupplyResource.class));
        when(attachmentMapper.selectList(any())).thenReturn(List.of());

        AttachmentDTO att = new AttachmentDTO();
        att.setFileName("方案.pdf");
        att.setFileUrl("http://minio/files/xxx.pdf");
        att.setFileSize(1024L);
        att.setFileType("application/pdf");

        CreateResourceRequest request = new CreateResourceRequest();
        request.setType("PRODUCT");
        request.setTitle("光伏组件供应");
        request.setSummary("高效光伏组件");
        request.setProvince("山东省");
        request.setAttachments(List.of(att));

        ResourceDetailVO result = service.create(request, 100L, 200L);

        assertThat(result.getMemberId()).isEqualTo(100L);
        assertThat(result.getAuditStatus()).isEqualTo(AuditStatus.PENDING.getCode());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SupplyAttachment>> captor = ArgumentCaptor.forClass(List.class);
        verify(attachmentMapper).batchInsert(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getFileName()).isEqualTo("方案.pdf");
        assertThat(captor.getValue().get(0).getBizType()).isEqualTo("RESOURCE");
    }

    // ─────────────────────────────────────────────
    // TC-02  查询详情 — 资源不存在
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 查询详情：资源不存在，抛出 RESOURCE_NOT_FOUND")
    void getById_notFound_throwsBizException() {
        when(resourceMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.getById(999L, null))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.RESOURCE_NOT_FOUND.getCode()));
    }

    // ─────────────────────────────────────────────
    // TC-03  更新资源 — 权限校验
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 更新资源：非本账号操作，抛出 PERMISSION_DENIED")
    void update_notOwner_throwsPermissionDenied() {
        SupplyResource resource = new SupplyResource();
        resource.setId(1L);
        resource.setAccountId(200L);
        when(resourceMapper.selectById(1L)).thenReturn(resource);

        UpdateResourceRequest request = new UpdateResourceRequest();
        request.setTitle("修改标题");

        assertThatThrownBy(() -> service.update(1L, request, 999L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.PERMISSION_DENIED.getCode()));
    }

    // ─────────────────────────────────────────────
    // TC-04  更新资源 — 成功，重置为待审核
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 更新资源：成功后审核状态重置为待审核")
    void update_success_resetsAuditStatus() {
        SupplyResource resource = new SupplyResource();
        resource.setId(1L);
        resource.setAccountId(200L);
        resource.setAuditStatus(AuditStatus.APPROVED.getCode());
        when(resourceMapper.selectById(1L)).thenReturn(resource);
        when(resourceMapper.updateById(any(SupplyResource.class))).thenReturn(1);
        when(attachmentMapper.selectList(any())).thenReturn(List.of());

        UpdateResourceRequest request = new UpdateResourceRequest();
        request.setTitle("更新后的标题");

        ResourceDetailVO result = service.update(1L, request, 200L);

        assertThat(result.getAuditStatus()).isEqualTo(AuditStatus.PENDING.getCode());
        assertThat(result.getTitle()).isEqualTo("更新后的标题");
    }

    // ─────────────────────────────────────────────
    // TC-05  软删除 — 成功
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 软删除：调用 deleteById 而非物理删除")
    void delete_success_callsDeleteById() {
        SupplyResource resource = new SupplyResource();
        resource.setId(1L);
        resource.setAccountId(200L);
        when(resourceMapper.selectById(1L)).thenReturn(resource);
        when(resourceMapper.deleteById(1L)).thenReturn(1);
        when(attachmentMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);

        service.delete(1L, 200L);

        verify(resourceMapper).deleteById(1L);
        verify(attachmentMapper).delete(any(LambdaQueryWrapper.class));
    }

    // ─────────────────────────────────────────────
    // TC-06  撤回 — 状态流转
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-06 撤回资源：auditStatus 变更为 OFFLINE(3)")
    void withdraw_success_setsOfflineStatus() {
        SupplyResource resource = new SupplyResource();
        resource.setId(1L);
        resource.setAccountId(200L);
        resource.setAuditStatus(AuditStatus.APPROVED.getCode());
        when(resourceMapper.selectById(1L)).thenReturn(resource);

        ArgumentCaptor<SupplyResource> captor = ArgumentCaptor.forClass(SupplyResource.class);
        when(resourceMapper.updateById(captor.capture())).thenReturn(1);

        service.withdraw(1L, 200L);

        assertThat(captor.getValue().getAuditStatus()).isEqualTo(AuditStatus.OFFLINE.getCode());
    }
}
