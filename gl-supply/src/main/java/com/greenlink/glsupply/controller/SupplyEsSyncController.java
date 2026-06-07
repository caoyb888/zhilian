package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glsupply.domain.SupplyDemand;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.es.DemandEsSyncService;
import com.greenlink.glsupply.es.ResourceEsSyncService;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/supply/es")
@RequiredArgsConstructor
public class SupplyEsSyncController {

    private final SupplyResourceMapper resourceMapper;
    private final SupplyDemandMapper demandMapper;
    private final ResourceEsSyncService esSyncService;
    private final DemandEsSyncService demandEsSyncService;

    private static final int SYNC_BATCH_SIZE = 500;

    /** 历史数据全量同步（管理员一次性执行）；分批处理防止 OOM；标签名称在全量同步时不逐条请求 */
    @PostMapping("/sync-all")
    public Result<Integer> syncAll() {
        QueryWrapper<SupplyResource> wrapper = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "type", "title", "summary",
                        "province", "audit_status", "is_deleted")
                .eq("is_deleted", 0);
        int pageNum = 1;
        int total = 0;
        List<SupplyResource> batch;
        do {
            batch = resourceMapper.selectPage(new Page<>(pageNum++, SYNC_BATCH_SIZE, false), wrapper)
                    .getRecords();
            if (!batch.isEmpty()) {
                total += esSyncService.syncAll(batch);
            }
        } while (batch.size() == SYNC_BATCH_SIZE);
        log.info("全量 ES 同步完成，共 {} 条资源", total);
        return Result.ok(total);
    }

    /** 需求全量同步至 ES（管理员一次性执行） */
    @PostMapping("/sync-all-demands")
    public Result<Integer> syncAllDemands() {
        QueryWrapper<SupplyDemand> wrapper = new QueryWrapper<SupplyDemand>()
                .select("id", "member_id", "type", "title", "summary",
                        "province", "audit_status", "is_deleted")
                .eq("is_deleted", 0);
        int pageNum = 1;
        int total = 0;
        List<SupplyDemand> batch;
        do {
            batch = demandMapper.selectPage(new Page<>(pageNum++, SYNC_BATCH_SIZE, false), wrapper)
                    .getRecords();
            if (!batch.isEmpty()) {
                total += demandEsSyncService.syncAll(batch);
            }
        } while (batch.size() == SYNC_BATCH_SIZE);
        log.info("全量 ES 同步完成，共 {} 条需求", total);
        return Result.ok(total);
    }
}
