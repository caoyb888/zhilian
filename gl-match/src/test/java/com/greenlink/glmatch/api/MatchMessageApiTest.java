package com.greenlink.glmatch.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.controller.MatchMessageController;
import com.greenlink.glmatch.dto.request.SendMessageRequest;
import com.greenlink.glmatch.dto.response.MarkReadVO;
import com.greenlink.glmatch.dto.response.MatchMessageVO;
import com.greenlink.glmatch.service.MatchMessageService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S6-12 接口自动化测试：对接沟通消息（5 个用例）
 *
 * <p>覆盖范围：
 * <ul>
 *   <li>TC08~TC10：发送消息（MatchMessageController#send）</li>
 *   <li>TC11：消息历史分页（MatchMessageController#list）</li>
 *   <li>TC12：全部标为已读（MatchMessageController#markRead）</li>
 * </ul>
 */
@WebMvcTest(
        controllers = MatchMessageController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@Import(GlobalExceptionHandler.class)
class MatchMessageApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MatchMessageService matchMessageService;

    // ─────────────────────────────────────────
    // 发送消息
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC08 发送消息_缺少认证头 → code:1001")
    void tc08_send_missingAuthHeaders_returns1001() throws Exception {
        SendMessageRequest req = new SendMessageRequest();
        req.setMsgType(1);
        req.setContent("合作意向确认");

        mockMvc.perform(post("/api/v1/match/records/1/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC09 发送消息_content为空_触发@NotBlank → code:1001")
    void tc09_send_emptyContent_returnsParamError() throws Exception {
        SendMessageRequest req = new SendMessageRequest();
        req.setMsgType(1);
        // content 不设置，触发 @NotBlank 校验失败

        mockMvc.perform(post("/api/v1/match/records/1/messages")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC10 发送消息_正常文本 → code:0 + MatchMessageVO字段正确")
    void tc10_send_normalText_returnsMatchMessageVO() throws Exception {
        MatchMessageVO vo = MatchMessageVO.builder()
                .id(501L)
                .matchId(1L)
                .senderId(10L)
                .msgType(1)
                .content("确认合作，请提供详细方案")
                .isRead(0)
                .createdAt(LocalDateTime.now())
                .build();

        when(matchMessageService.send(eq(1L), eq(10L), eq(1L), any(SendMessageRequest.class)))
                .thenReturn(vo);

        SendMessageRequest req = new SendMessageRequest();
        req.setMsgType(1);
        req.setContent("确认合作，请提供详细方案");

        mockMvc.perform(post("/api/v1/match/records/1/messages")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(501))
                .andExpect(jsonPath("$.data.matchId").value(1))
                .andExpect(jsonPath("$.data.senderId").value(10))
                .andExpect(jsonPath("$.data.msgType").value(1))
                .andExpect(jsonPath("$.data.isRead").value(0));
    }

    // ─────────────────────────────────────────
    // 消息历史
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC11 消息历史_正常分页_返回PageResult及首条消息内容")
    void tc11_list_normal_returnsPageResult() throws Exception {
        MatchMessageVO msg1 = MatchMessageVO.builder()
                .id(501L)
                .matchId(1L)
                .senderId(10L)
                .msgType(1)
                .content("确认合作，请提供详细方案")
                .isRead(1)
                .createdAt(LocalDateTime.now().minusMinutes(10))
                .build();

        MatchMessageVO msg2 = MatchMessageVO.builder()
                .id(502L)
                .matchId(1L)
                .senderId(20L)
                .msgType(1)
                .content("方案已附件发出，请查收")
                .isRead(0)
                .createdAt(LocalDateTime.now())
                .build();

        PageResult<MatchMessageVO> page = PageResult.of(List.of(msg1, msg2), 2L, 1, 20);

        when(matchMessageService.listMessages(eq(1L), eq(10L), eq(1L), eq(1), eq(20)))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/match/records/1/messages")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.records[0].id").value(501))
                .andExpect(jsonPath("$.data.records[0].senderId").value(10))
                .andExpect(jsonPath("$.data.records[1].id").value(502))
                .andExpect(jsonPath("$.data.records[1].isRead").value(0));
    }

    // ─────────────────────────────────────────
    // 全部标为已读
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC12 全部标为已读_正常 → code:0 + markedCount=3")
    void tc12_markRead_normal_returnsMarkedCount() throws Exception {
        when(matchMessageService.markAllRead(eq(1L), eq(10L), eq(1L)))
                .thenReturn(new MarkReadVO(3));

        mockMvc.perform(patch("/api/v1/match/records/1/messages/read")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.markedCount").value(3));
    }
}
