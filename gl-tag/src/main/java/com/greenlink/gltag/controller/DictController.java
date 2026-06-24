package com.greenlink.gltag.controller;

import com.greenlink.common.result.Result;
import com.greenlink.gltag.dto.request.CreateDictItemRequest;
import com.greenlink.gltag.dto.request.UpdateDictItemRequest;
import com.greenlink.gltag.dto.response.DictItemVO;
import com.greenlink.gltag.dto.response.DictTypeVO;
import com.greenlink.gltag.service.DictService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dict")
@RequiredArgsConstructor
public class DictController {

    private final DictService dictService;

    /** 公开：按类型取启用中的字典项（前端下拉用，已在网关白名单 /api/v1/dict/options/**） */
    @GetMapping("/options/{typeCode}")
    public Result<List<DictItemVO>> options(@PathVariable String typeCode) {
        return Result.ok(dictService.listActiveItems(typeCode));
    }

    /** 管理端：字典类型列表 */
    @GetMapping("/types")
    public Result<List<DictTypeVO>> types() {
        return Result.ok(dictService.listTypes());
    }

    /** 管理端：某类型下全部字典项（含停用） */
    @GetMapping("/types/{typeCode}/items")
    public Result<List<DictItemVO>> items(@PathVariable String typeCode) {
        return Result.ok(dictService.listAllItems(typeCode));
    }

    @PostMapping("/items")
    public Result<DictItemVO> create(@Valid @RequestBody CreateDictItemRequest request) {
        return Result.ok(dictService.createItem(request));
    }

    @PutMapping("/items/{id}")
    public Result<DictItemVO> update(@PathVariable Long id,
                                     @Valid @RequestBody UpdateDictItemRequest request) {
        return Result.ok(dictService.updateItem(id, request));
    }

    @DeleteMapping("/items/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        dictService.deleteItem(id);
        return Result.ok();
    }
}
