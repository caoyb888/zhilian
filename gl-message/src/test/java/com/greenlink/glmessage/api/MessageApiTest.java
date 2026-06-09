package com.greenlink.glmessage.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmessage.controller.MessageController;
import com.greenlink.glmessage.dto.request.MarkAllReadRequest;
import com.greenlink.glmessage.dto.response.MessageVO;
import com.greenlink.glmessage.dto.response.UnreadCountVO;
import com.greenlink.glmessage.service.MessageQueryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S6-12 接口自动化测试：消息服务（7 个用例）
 *
 * <p>覆盖范围：
 * <ul>
 *   <li>TC01~TC03：消息列表（MessageController#list）</li>
 *   <li>TC04~TC05：未读消息数（MessageController#unreadCount）</li>
 *   <li>TC06：标记单条已读（MessageController#markRead）</li>
 *   <li>TC07：全部标记已读（MessageController#markAllRead）</li>
 * </ul>
 */
@WebMvcTest(
        controllers = MessageController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@Import(GlobalExceptionHandler.class)
class MessageApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MessageQueryService messageQueryService;

    // ─────────────────────────────────────────
    // 消息列表
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC01 消息列表_缺少X-Account-Id头 → code:1001")
    void tc01_list_missingAccountId_returns1001() throws Exception {
        mockMvc.perform(get("/api/v1/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC02 消息列表_正常分页_返回PageResult及字段")
    void tc02_list_normal_returnsPageResult() throws Exception {
        MessageVO vo = new MessageVO();
        vo.setId(1001L);
        vo.setBizType("MATCH");
        vo.setBizId(50L);
        vo.setTitle("新对接申请");
        vo.setContent("某公司希望与您对接");
        vo.setChannel("SITE");
        vo.setIsRead(false);
        vo.setCreatedAt(LocalDateTime.now());

        PageResult<MessageVO> page = PageResult.of(List.of(vo), 1L, 1, 20);

        when(messageQueryService.pageList(eq(10L), isNull(), isNull(), isNull(), eq(1), eq(20)))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/messages")
                        .header("X-Account-Id", "10")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.records[0].id").value(1001))
                .andExpect(jsonPath("$.data.records[0].bizType").value("MATCH"))
                .andExpect(jsonPath("$.data.records[0].isRead").value(false));
    }

    @Test
    @DisplayName("TC03 消息列表_isRead=false过滤_服务层收到正确参数")
    void tc03_list_isReadFalseFilter_serviceReceivesParam() throws Exception {
        PageResult<MessageVO> empty = PageResult.of(List.of(), 0L, 1, 20);

        when(messageQueryService.pageList(eq(10L), eq("SITE"), eq("MATCH"), eq(false), eq(1), eq(20)))
                .thenReturn(empty);

        mockMvc.perform(get("/api/v1/messages")
                        .header("X-Account-Id", "10")
                        .param("channel", "SITE")
                        .param("bizType", "MATCH")
                        .param("isRead", "false")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(0));

        verify(messageQueryService).pageList(10L, "SITE", "MATCH", false, 1, 20);
    }

    // ─────────────────────────────────────────
    // 未读消息数
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC04 未读消息数_缺少X-Account-Id头 → code:1001")
    void tc04_unreadCount_missingAccountId_returns1001() throws Exception {
        mockMvc.perform(get("/api/v1/messages/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC05 未读消息数_正常_各类型分别返回且total汇总正确")
    void tc05_unreadCount_normal_returnsByTypeAndTotal() throws Exception {
        UnreadCountVO vo = new UnreadCountVO();
        vo.setMatch(3);
        vo.setAudit(2);
        vo.setActivity(1);
        vo.setSystem(0);
        vo.setTotal(6);

        when(messageQueryService.unreadCount(10L)).thenReturn(vo);

        mockMvc.perform(get("/api/v1/messages/unread-count")
                        .header("X-Account-Id", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(6))
                .andExpect(jsonPath("$.data.match").value(3))
                .andExpect(jsonPath("$.data.audit").value(2))
                .andExpect(jsonPath("$.data.activity").value(1))
                .andExpect(jsonPath("$.data.system").value(0));
    }

    // ─────────────────────────────────────────
    // 标记单条已读
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC06 标记单条已读_消息不属于当前账号 → code:1003")
    void tc06_markRead_notOwner_returns1003() throws Exception {
        doThrow(new BizException(1003, "无权操作该消息"))
                .when(messageQueryService).markRead(eq(10L), eq(999L));

        mockMvc.perform(patch("/api/v1/messages/999/read")
                        .header("X-Account-Id", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1003));
    }

    // ─────────────────────────────────────────
    // 全部标记已读
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC07 全部标记已读_按bizType=MATCH过滤 → code:0")
    void tc07_markAllRead_withBizType_returnsOk() throws Exception {
        doNothing().when(messageQueryService).markAllRead(eq(10L), eq("MATCH"));

        MarkAllReadRequest req = new MarkAllReadRequest();
        req.setBizType("MATCH");

        mockMvc.perform(patch("/api/v1/messages/read-all")
                        .header("X-Account-Id", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        verify(messageQueryService).markAllRead(10L, "MATCH");
    }
}
