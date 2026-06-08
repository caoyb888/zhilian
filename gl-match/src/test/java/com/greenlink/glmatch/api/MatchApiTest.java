package com.greenlink.glmatch.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.controller.FavoriteController;
import com.greenlink.glmatch.controller.MatchApplyController;
import com.greenlink.glmatch.controller.MatchRecordListController;
import com.greenlink.glmatch.controller.MatchRespondController;
import com.greenlink.glmatch.controller.MatchStatusUpdateController;
import com.greenlink.glmatch.controller.RecommendController;
import com.greenlink.glmatch.dto.MemberBriefDTO;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.request.FavoriteRequest;
import com.greenlink.glmatch.dto.request.MatchApplyRequest;
import com.greenlink.glmatch.dto.request.MatchRespondRequest;
import com.greenlink.glmatch.dto.request.MatchStatusUpdateRequest;
import com.greenlink.glmatch.dto.response.MatchApplyVO;
import com.greenlink.glmatch.dto.response.MatchRecordItemVO;
import com.greenlink.glmatch.dto.response.MatchRespondVO;
import com.greenlink.glmatch.dto.response.MatchStatusUpdateVO;
import com.greenlink.glmatch.engine.score.MatchScoreResult;
import com.greenlink.glmatch.feign.MemberClient;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.FavoriteService;
import com.greenlink.glmatch.service.MatchApplyService;
import com.greenlink.glmatch.service.MatchRecommendService;
import com.greenlink.glmatch.service.MatchRecordListService;
import com.greenlink.glmatch.service.MatchRespondService;
import com.greenlink.glmatch.service.MatchStatusUpdateService;
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
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S5-14 接口自动化测试：匹配引擎 + 对接申请（15 个用例）
 *
 * <p>覆盖范围：
 * <ul>
 *   <li>TC01~TC04：推荐接口（RecommendController）</li>
 *   <li>TC05~TC08：对接申请（MatchApplyController）</li>
 *   <li>TC09~TC11：响应申请（MatchRespondController）</li>
 *   <li>TC12~TC13：状态更新（MatchStatusUpdateController）</li>
 *   <li>TC14：我的对接记录（MatchRecordListController）</li>
 *   <li>TC15：收藏（FavoriteController）</li>
 * </ul>
 */
@WebMvcTest(
        controllers = {
                RecommendController.class,
                MatchApplyController.class,
                MatchRespondController.class,
                MatchStatusUpdateController.class,
                MatchRecordListController.class,
                FavoriteController.class
        },
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@Import(GlobalExceptionHandler.class)
class MatchApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ── Service / Mapper / Client mocks ──
    @MockBean
    private MatchRecommendService matchRecommendService;
    @MockBean
    private MatchRecordMapper matchRecordMapper;
    @MockBean
    private SupplyClient supplyClient;
    @MockBean
    private MemberClient memberClient;
    @MockBean
    private MatchApplyService matchApplyService;
    @MockBean
    private MatchRespondService matchRespondService;
    @MockBean
    private MatchStatusUpdateService matchStatusUpdateService;
    @MockBean
    private MatchRecordListService matchRecordListService;
    @MockBean
    private FavoriteService favoriteService;

    // ─────────────────────────────────────────
    // 推荐接口（RecommendController）
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC01 推荐接口_缺少X-Member-Id头 → code:1001")
    void tc01_recommendations_missingMemberId_returns1001() throws Exception {
        mockMvc.perform(get("/api/v1/match/recommendations")
                        .param("sourceType", "RESOURCE")
                        .param("sourceId", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC02 推荐接口_sourceType非法 → code:1002")
    void tc02_recommendations_invalidSourceType_returns1002() throws Exception {
        mockMvc.perform(get("/api/v1/match/recommendations")
                        .header("X-Member-Id", "1")
                        .param("sourceType", "INVALID")
                        .param("sourceId", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1002));
    }

    @Test
    @DisplayName("TC03 推荐接口_sourceId为0 → code:1002")
    void tc03_recommendations_zeroSourceId_returns1002() throws Exception {
        mockMvc.perform(get("/api/v1/match/recommendations")
                        .header("X-Member-Id", "1")
                        .param("sourceType", "RESOURCE")
                        .param("sourceId", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1002));
    }

    @Test
    @DisplayName("TC04 推荐接口_正常分页 → code:0 + PageResult结构")
    void tc04_recommendations_normal_returnsPageResult() throws Exception {
        Long memberId = 1L;
        Long sourceId = 100L;

        // 来源资源简要（归属方为 memberId=1）
        SupplyBriefDTO sourceBrief = new SupplyBriefDTO();
        sourceBrief.setId(sourceId);
        sourceBrief.setMemberId(memberId);
        sourceBrief.setProvince("山东省");

        // 推荐引擎返回一个匹配结果
        MatchScoreResult scoreResult = MatchScoreResult.builder()
                .candidateId(200L)
                .candidateMemberId(2L)
                .candidateProvince("山东省")
                .totalScore(85.0)
                .matchReasons(List.of("行业标签高度匹配（新能源）", "地域相近（同省）"))
                .build();

        // 目标需求简要
        SupplyBriefDTO targetBrief = new SupplyBriefDTO();
        targetBrief.setId(200L);
        targetBrief.setTitle("新能源设备采购需求");

        // 对方会员简要
        MemberBriefDTO memberBrief = new MemberBriefDTO();
        memberBrief.setId(2L);
        memberBrief.setName("绿能科技有限公司");
        memberBrief.setMemberLevel(1);
        memberBrief.setProvince("山东省");

        when(supplyClient.getResourceMatchBrief(sourceId)).thenReturn(Result.ok(sourceBrief));
        when(matchRecommendService.recommend(eq("RESOURCE"), eq(sourceId), anyString(), eq(memberId), anyInt()))
                .thenReturn(List.of(scoreResult));
        when(matchRecordMapper.findAnyMatchedDemandIds(eq(sourceId), anyList()))
                .thenReturn(Collections.emptySet());
        when(supplyClient.batchBriefDemands(anyList())).thenReturn(Result.ok(List.of(targetBrief)));
        when(memberClient.batchBrief(anyList())).thenReturn(Result.ok(List.of(memberBrief)));

        mockMvc.perform(get("/api/v1/match/recommendations")
                        .header("X-Member-Id", memberId.toString())
                        .param("sourceType", "RESOURCE")
                        .param("sourceId", sourceId.toString())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.records[0].targetId").value(200))
                .andExpect(jsonPath("$.data.records[0].matchScore").value(85.0))
                .andExpect(jsonPath("$.data.records[0].applied").value(false));
    }

    // ─────────────────────────────────────────
    // 对接申请（MatchApplyController）
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC05 对接申请_无认证头 → code:1001")
    void tc05_apply_noAuthHeaders_returns1001() throws Exception {
        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(100L);
        req.setDemandId(200L);

        mockMvc.perform(post("/api/v1/match/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC06 对接申请_缺少resourceId参数校验 → code:1001(PARAM_ERROR)")
    void tc06_apply_missingResourceId_returnsParamError() throws Exception {
        // resourceId 为 null，触发 @NotNull 校验失败
        MatchApplyRequest req = new MatchApplyRequest();
        req.setDemandId(200L);

        mockMvc.perform(post("/api/v1/match/apply")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC07 对接申请_正常发起 → code:0 + MatchApplyVO")
    void tc07_apply_success_returnsApplyVO() throws Exception {
        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(100L);
        req.setDemandId(200L);
        req.setApplyMessage("期望建立合作关系");

        MatchApplyVO vo = MatchApplyVO.builder()
                .recordId(1L)
                .resourceId(100L)
                .demandId(200L)
                .resourceMemberId(1L)
                .demandMemberId(2L)
                .status(1)
                .matchType(2)
                .applyMessage("期望建立合作关系")
                .createdAt(LocalDateTime.now())
                .build();

        when(matchApplyService.apply(eq(10L), eq(1L), any(MatchApplyRequest.class))).thenReturn(vo);

        mockMvc.perform(post("/api/v1/match/apply")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.recordId").value(1))
                .andExpect(jsonPath("$.data.status").value(1))
                .andExpect(jsonPath("$.data.matchType").value(2));
    }

    @Test
    @DisplayName("TC08 对接申请_重复申请 → code:3102")
    void tc08_apply_duplicateRecord_returns3102() throws Exception {
        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(100L);
        req.setDemandId(200L);

        when(matchApplyService.apply(anyLong(), anyLong(), any(MatchApplyRequest.class)))
                .thenThrow(new BizException(3102, "该资源与需求之间已存在进行中的对接记录"));

        mockMvc.perform(post("/api/v1/match/apply")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(3102));
    }

    // ─────────────────────────────────────────
    // 响应申请（MatchRespondController）
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC09 响应申请_无认证头 → code:1001")
    void tc09_respond_noAuthHeaders_returns1001() throws Exception {
        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        mockMvc.perform(patch("/api/v1/match/records/1/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC10 响应申请_action非法 → code:1001(PARAM_ERROR)")
    void tc10_respond_invalidAction_returnsParamError() throws Exception {
        // action 不匹配正则 ACCEPT|REJECT
        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("INVALID_ACTION");

        mockMvc.perform(patch("/api/v1/match/records/1/respond")
                        .header("X-Account-Id", "20")
                        .header("X-Member-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC11 响应申请_ACCEPT成功 → code:0 + status=2")
    void tc11_respond_accept_returnsStatus2() throws Exception {
        MatchRespondVO vo = MatchRespondVO.builder()
                .recordId(1L)
                .resourceId(100L)
                .demandId(200L)
                .status(2)
                .updatedAt(LocalDateTime.now())
                .build();

        when(matchRespondService.respond(eq(1L), eq(20L), eq(2L), any(MatchRespondRequest.class)))
                .thenReturn(vo);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        mockMvc.perform(patch("/api/v1/match/records/1/respond")
                        .header("X-Account-Id", "20")
                        .header("X-Member-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.status").value(2))
                .andExpect(jsonPath("$.data.recordId").value(1));
    }

    // ─────────────────────────────────────────
    // 状态更新（MatchStatusUpdateController）
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC12 状态更新_无认证头 → code:1001")
    void tc12_statusUpdate_noAuthHeaders_returns1001() throws Exception {
        MatchStatusUpdateRequest req = new MatchStatusUpdateRequest();
        req.setAction("NEGOTIATE");

        mockMvc.perform(patch("/api/v1/match/records/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @DisplayName("TC13 状态更新_NEGOTIATE成功 → code:0 + status=3")
    void tc13_statusUpdate_negotiate_returnsStatus3() throws Exception {
        MatchStatusUpdateVO vo = MatchStatusUpdateVO.builder()
                .recordId(1L)
                .resourceId(100L)
                .demandId(200L)
                .status(3)
                .updatedAt(LocalDateTime.now())
                .build();

        when(matchStatusUpdateService.update(eq(1L), eq(10L), eq(1L), any(MatchStatusUpdateRequest.class)))
                .thenReturn(vo);

        MatchStatusUpdateRequest req = new MatchStatusUpdateRequest();
        req.setAction("NEGOTIATE");

        mockMvc.perform(patch("/api/v1/match/records/1/status")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.status").value(3));
    }

    // ─────────────────────────────────────────
    // 我的对接记录（MatchRecordListController）
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC14 我的对接记录_正常分页查询 → code:0 + PageResult结构")
    void tc14_myRecords_withStatusFilter_returnsPageResult() throws Exception {
        MatchRecordItemVO item = MatchRecordItemVO.builder()
                .recordId(1L)
                .resourceId(100L)
                .demandId(200L)
                .resourceTitle("新能源设备出售")
                .demandTitle("新能源设备采购需求")
                .status(1)
                .matchType(2)
                .isInitiator(true)
                .unreadCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        PageResult<MatchRecordItemVO> pageResult = PageResult.of(List.of(item), 1L, 1, 10);

        when(matchRecordListService.listMyRecords(eq(10L), eq(1L), eq(1), eq(1), eq(10)))
                .thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/match/records/my")
                        .header("X-Account-Id", "10")
                        .header("X-Member-Id", "1")
                        .param("status", "1")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.records[0].recordId").value(1))
                .andExpect(jsonPath("$.data.records[0].status").value(1))
                .andExpect(jsonPath("$.data.records[0].isInitiator").value(true));
    }

    // ─────────────────────────────────────────
    // 收藏（FavoriteController）
    // ─────────────────────────────────────────

    @Test
    @DisplayName("TC15 收藏_正常添加资源 → code:0")
    void tc15_addFavorite_resource_returnsOk() throws Exception {
        FavoriteRequest req = new FavoriteRequest();
        req.setBizType("RESOURCE");
        req.setBizId(100L);

        doNothing().when(favoriteService).add(eq(10L), eq("RESOURCE"), eq(100L));

        mockMvc.perform(post("/api/v1/favorites")
                        .header("X-Account-Id", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
