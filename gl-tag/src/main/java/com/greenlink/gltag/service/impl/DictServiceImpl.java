package com.greenlink.gltag.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.gltag.domain.SysDictItem;
import com.greenlink.gltag.domain.SysDictType;
import com.greenlink.gltag.dto.request.CreateDictItemRequest;
import com.greenlink.gltag.dto.request.UpdateDictItemRequest;
import com.greenlink.gltag.dto.response.DictItemVO;
import com.greenlink.gltag.dto.response.DictTypeVO;
import com.greenlink.gltag.repository.SysDictItemMapper;
import com.greenlink.gltag.repository.SysDictTypeMapper;
import com.greenlink.gltag.service.DictService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictServiceImpl implements DictService {

    private final SysDictTypeMapper typeMapper;
    private final SysDictItemMapper itemMapper;

    @Override
    public List<DictItemVO> listActiveItems(String typeCode) {
        List<SysDictItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<SysDictItem>()
                        .eq(SysDictItem::getTypeCode, typeCode)
                        .eq(SysDictItem::getIsActive, 1)
                        .orderByAsc(SysDictItem::getSortOrder));
        return items.stream().map(this::toItemVO).toList();
    }

    @Override
    public List<DictTypeVO> listTypes() {
        List<SysDictType> types = typeMapper.selectList(
                new LambdaQueryWrapper<SysDictType>().orderByAsc(SysDictType::getId));
        return types.stream().map(this::toTypeVO).toList();
    }

    @Override
    public List<DictItemVO> listAllItems(String typeCode) {
        List<SysDictItem> items = itemMapper.selectList(
                new LambdaQueryWrapper<SysDictItem>()
                        .eq(SysDictItem::getTypeCode, typeCode)
                        .orderByAsc(SysDictItem::getSortOrder));
        return items.stream().map(this::toItemVO).toList();
    }

    @Override
    @Transactional
    public DictItemVO createItem(CreateDictItemRequest request) {
        if (typeMapper.findIdByCode(request.getTypeCode()) == null) {
            throw new BizException(ResultCode.PARAM_ERROR, "字典类型不存在: " + request.getTypeCode());
        }
        long dup = itemMapper.selectCount(
                new LambdaQueryWrapper<SysDictItem>()
                        .eq(SysDictItem::getTypeCode, request.getTypeCode())
                        .eq(SysDictItem::getItemValue, request.getValue()));
        if (dup > 0) {
            throw new BizException(ResultCode.PARAM_ERROR, "字典值已存在: " + request.getValue());
        }
        SysDictItem item = new SysDictItem();
        item.setTypeCode(request.getTypeCode());
        item.setItemValue(request.getValue());
        item.setItemLabel(request.getLabel());
        item.setParentValue(request.getParentValue());
        item.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
        item.setIsActive(1);
        itemMapper.insert(item);
        log.info("创建字典项 type={} value={} label={}", item.getTypeCode(), item.getItemValue(), item.getItemLabel());
        return toItemVO(item);
    }

    @Override
    @Transactional
    public DictItemVO updateItem(Long id, UpdateDictItemRequest request) {
        SysDictItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new BizException(ResultCode.NOT_FOUND, "字典项不存在");
        }
        if (request.getLabel() != null) item.setItemLabel(request.getLabel());
        if (request.getParentValue() != null) item.setParentValue(request.getParentValue());
        if (request.getSortOrder() != null) item.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) item.setIsActive(request.getIsActive() ? 1 : 0);
        itemMapper.updateById(item);
        log.info("更新字典项 id={}", id);
        return toItemVO(item);
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        SysDictItem item = itemMapper.selectById(id);
        if (item == null) {
            throw new BizException(ResultCode.NOT_FOUND, "字典项不存在");
        }
        itemMapper.deleteById(id);
        log.info("删除字典项 id={}", id);
    }

    private DictItemVO toItemVO(SysDictItem item) {
        DictItemVO vo = new DictItemVO();
        vo.setId(item.getId());
        vo.setTypeCode(item.getTypeCode());
        vo.setValue(item.getItemValue());
        vo.setLabel(item.getItemLabel());
        vo.setParentValue(item.getParentValue());
        vo.setSortOrder(item.getSortOrder());
        vo.setIsActive(item.getIsActive() == 1);
        return vo;
    }

    private DictTypeVO toTypeVO(SysDictType type) {
        DictTypeVO vo = new DictTypeVO();
        vo.setId(type.getId());
        vo.setCode(type.getCode());
        vo.setName(type.getName());
        vo.setRemark(type.getRemark());
        vo.setIsActive(type.getIsActive() == 1);
        return vo;
    }
}
