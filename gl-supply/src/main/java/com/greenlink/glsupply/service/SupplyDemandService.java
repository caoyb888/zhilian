package com.greenlink.glsupply.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glsupply.dto.request.CreateDemandRequest;
import com.greenlink.glsupply.dto.request.DemandPageRequest;
import com.greenlink.glsupply.dto.request.UpdateDemandRequest;
import com.greenlink.glsupply.dto.response.DemandDetailVO;
import com.greenlink.glsupply.dto.response.DemandVO;

public interface SupplyDemandService {

    DemandDetailVO create(CreateDemandRequest request, Long memberId, Long accountId);

    Page<DemandVO> pageList(DemandPageRequest request);

    Page<DemandVO> minePageList(Long memberId, DemandPageRequest request);

    DemandDetailVO getById(Long id);

    DemandDetailVO update(Long id, UpdateDemandRequest request, Long accountId);

    void delete(Long id, Long accountId);

    void close(Long id, Long accountId);
}
