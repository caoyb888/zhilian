package com.greenlink.glsupply.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glsupply.dto.request.AdminDemandPageRequest;
import com.greenlink.glsupply.dto.request.CreateDemandRequest;
import com.greenlink.glsupply.dto.request.DemandPageRequest;
import com.greenlink.glsupply.dto.request.UpdateDemandRequest;
import com.greenlink.glsupply.dto.response.AdminDemandVO;
import com.greenlink.glsupply.dto.response.BatchAuditResultVO;
import com.greenlink.glsupply.dto.response.DemandDetailVO;
import com.greenlink.glsupply.dto.response.DemandVO;
import com.greenlink.glsupply.dto.response.SupplyBriefVO;

import java.util.List;

public interface SupplyDemandService {

    DemandDetailVO create(CreateDemandRequest request, Long memberId, Long accountId);

    Page<DemandVO> pageList(DemandPageRequest request);

    Page<DemandVO> minePageList(Long memberId, DemandPageRequest request);

    DemandDetailVO getById(Long id);

    DemandDetailVO update(Long id, UpdateDemandRequest request, Long accountId);

    void delete(Long id, Long accountId);

    void close(Long id, Long accountId);

    // 管理端审核相关
    Page<AdminDemandVO> adminPageList(AdminDemandPageRequest request);

    void approve(Long id, Long auditorId);

    void reject(Long id, Long auditorId, String remark);

    /** 批量审核通过（#6），允许部分成功，逐条返回失败原因 */
    BatchAuditResultVO batchApprove(List<Long> ids, Long auditorId);

    /** 批量审核拒绝（#6），统一 remark，允许部分成功 */
    BatchAuditResultVO batchReject(List<Long> ids, Long auditorId, String remark);

    void adminOffline(Long id, Long auditorId);

    /** 内部调用：按 ID 批量查询需求简要信息（供 gl-match 召回过滤使用） */
    List<SupplyBriefVO> batchBrief(List<Long> ids);
}
