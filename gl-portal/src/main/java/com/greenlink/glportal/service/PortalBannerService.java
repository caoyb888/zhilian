package com.greenlink.glportal.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glportal.dto.request.BannerPageRequest;
import com.greenlink.glportal.dto.request.CreateBannerRequest;
import com.greenlink.glportal.dto.request.UpdateBannerRequest;
import com.greenlink.glportal.dto.response.BannerVO;

import java.util.List;

public interface PortalBannerService {

    /** 前台：当前有效的轮播图（启用 + 日期在有效期内），按 sort_order 升序 */
    List<BannerVO> listActive();

    /** 管理端：分页查询（可按 isActive 筛选） */
    Page<BannerVO> pageAdmin(BannerPageRequest request);

    BannerVO getById(Long id);

    BannerVO create(CreateBannerRequest request);

    BannerVO update(Long id, UpdateBannerRequest request);

    void delete(Long id);

    void updateActive(Long id, Integer isActive);
}
