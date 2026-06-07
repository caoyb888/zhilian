package com.greenlink.glsupply.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glsupply.dto.request.AdminResourcePageRequest;
import com.greenlink.glsupply.dto.request.CreateResourceRequest;
import com.greenlink.glsupply.dto.request.ResourcePageRequest;
import com.greenlink.glsupply.dto.request.UpdateResourceRequest;
import com.greenlink.glsupply.dto.response.AdminResourceVO;
import com.greenlink.glsupply.dto.response.ResourceDetailVO;
import com.greenlink.glsupply.dto.response.ResourceVO;
import com.greenlink.glsupply.dto.response.SupplyBriefVO;

import java.util.List;

public interface SupplyResourceService {

    ResourceDetailVO create(CreateResourceRequest request, Long memberId, Long accountId);

    Page<ResourceVO> pageList(ResourcePageRequest request);

    /** 会员中心：查看自己发布的所有资源（不限审核状态） */
    Page<ResourceVO> minePageList(Long memberId, ResourcePageRequest request);

    ResourceDetailVO getById(Long id, Long accountId);

    ResourceDetailVO update(Long id, UpdateResourceRequest request, Long accountId);

    void delete(Long id, Long accountId);

    void withdraw(Long id, Long accountId);

    // 管理端审核相关
    Page<AdminResourceVO> adminPageList(AdminResourcePageRequest request);

    void approve(Long id, Long auditorId);

    void reject(Long id, Long auditorId, String remark);

    void adminOffline(Long id, Long auditorId);

    /** 内部调用：按 ID 批量查询资源简要信息（供 gl-match 召回过滤使用） */
    List<SupplyBriefVO> batchBrief(List<Long> ids);
}
