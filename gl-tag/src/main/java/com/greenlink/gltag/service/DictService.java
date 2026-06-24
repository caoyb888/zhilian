package com.greenlink.gltag.service;

import com.greenlink.gltag.dto.request.CreateDictItemRequest;
import com.greenlink.gltag.dto.request.UpdateDictItemRequest;
import com.greenlink.gltag.dto.response.DictItemVO;
import com.greenlink.gltag.dto.response.DictTypeVO;

import java.util.List;

public interface DictService {

    /** 公开：按类型编码取启用中的字典项（前端下拉用） */
    List<DictItemVO> listActiveItems(String typeCode);

    /** 管理端：所有字典类型 */
    List<DictTypeVO> listTypes();

    /** 管理端：某类型下全部字典项（含停用） */
    List<DictItemVO> listAllItems(String typeCode);

    DictItemVO createItem(CreateDictItemRequest request);

    DictItemVO updateItem(Long id, UpdateDictItemRequest request);

    void deleteItem(Long id);
}
